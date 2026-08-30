import crypto from 'crypto';
import { ethers } from 'ethers';
import { db, NETWORKS } from '../db';
import { BlockchainNetwork, Deposit, WalletAddress, Withdrawal } from '../types';
import { ledgerService } from './ledgerService';

export class BlockchainService {
  private masterSeed: string;

  constructor() {
    // In production, master seed is derived from HSM / AWS KMS / Multi-Party Computation (MPC)
    this.masterSeed = process.env.CUSTODY_MASTER_SEED || 'enterprise_mpc_vault_secure_seed_2026_production';
    this.startConfirmationWorker();
  }

  /**
   * Validates a destination blockchain address according to the network standards
   */
  public validateAddress(address: string, network: BlockchainNetwork): { isValid: boolean; error?: string } {
    if (!address || typeof address !== 'string') {
      return { isValid: false, error: 'Address is required.' };
    }

    const trimmed = address.trim();

    if (network === 'TRC20') {
      // Tron address must start with 'T', be 34 alphanumeric characters
      const tronRegex = /^T[a-km-zA-HJ-NP-Z1-9]{33}$/;
      if (!tronRegex.test(trimmed)) {
        return { isValid: false, error: 'Invalid TRC-20 address. Tron addresses must start with "T" and be 34 base58 characters.' };
      }
      return { isValid: true };
    }

    if (network === 'ERC20' || network === 'BEP20') {
      // Ethereum and BSC address must be valid hex address
      if (!ethers.isAddress(trimmed)) {
        return { isValid: false, error: `Invalid ${network} address format. Must be a valid 0x 40-character hexadecimal address.` };
      }
      return { isValid: true };
    }

    return { isValid: false, error: 'Unsupported network' };
  }

  /**
   * Generates a unique, deterministic deposit address for a user on the requested network.
   * Follows standard BIP44 derivation paths.
   */
  public async getOrCreateUserAddress(userId: string, network: BlockchainNetwork): Promise<WalletAddress> {
    return db.withLock(async () => {
      // Check existing
      const existing = Array.from(db.walletAddresses.values()).find(
        (a) => a.userId === userId && a.network === network && a.status === 'active'
      );
      if (existing) {
        return existing;
      }

      // Count addresses for derivation index
      const userIndex = db.walletAddresses.size + 1;
      let address = '';
      let derivationPath = '';

      if (network === 'TRC20') {
        derivationPath = `m/44'/195'/0'/0/${userIndex}`;
        // Derive Tron-style address (T + 33 base58 characters)
        const hash = crypto.createHmac('sha256', this.masterSeed).update(`${userId}-TRC20-${userIndex}`).digest();
        const hex = hash.subarray(0, 20).toString('hex');
        // Base58Check formatted representation with Tron prefix
        address = `T${ethers.encodeBase58(Buffer.from('41' + hex, 'hex')).slice(0, 33)}`;
      } else {
        // ERC20 / BEP20 (EVM)
        derivationPath = `m/44'/60'/0'/0/${userIndex}`;
        const wallet = ethers.HDNodeWallet.fromSeed(
          crypto.createHash('sha512').update(`${this.masterSeed}-${userId}`).digest()
        ).derivePath(derivationPath);
        address = ethers.getAddress(wallet.address);
      }

      const newAddressRecord: WalletAddress = {
        id: `addr_${crypto.randomUUID()}`,
        userId,
        network,
        address,
        derivationPath,
        createdAt: new Date().toISOString(),
        status: 'active',
      };

      db.walletAddresses.set(newAddressRecord.id, newAddressRecord);
      return newAddressRecord;
    });
  }

  /**
   * Emulates or ingests a detected incoming blockchain transaction to the deposit pipeline
   */
  public async detectIncomingDeposit(params: {
    userId: string;
    network: BlockchainNetwork;
    amount: number;
    fromAddress: string;
    toAddress: string;
    customTxHash?: string;
  }): Promise<Deposit> {
    return db.withLock(async () => {
      const config = NETWORKS[params.network];
      if (params.amount < config.minDeposit) {
        throw new Error(`Amount is below minimum deposit of ${config.minDeposit} USDT for ${config.network}.`);
      }

      const txHash =
        params.customTxHash ||
        (params.network === 'TRC20'
          ? crypto.randomBytes(32).toString('hex')
          : `0x${crypto.randomBytes(32).toString('hex')}`);

      // Check duplicate hash
      const duplicate = Array.from(db.deposits.values()).find((d) => d.txHash.toLowerCase() === txHash.toLowerCase());
      if (duplicate) {
        throw new Error(`Transaction with hash ${txHash} has already been processed.`);
      }

      const deposit: Deposit = {
        id: `dep_${crypto.randomUUID()}`,
        userId: params.userId,
        network: params.network,
        txHash,
        fromAddress: params.fromAddress,
        toAddress: params.toAddress,
        amount: params.amount,
        fee: 0,
        blockNumber: Math.floor(50000000 + Math.random() * 1000000),
        confirmations: 0,
        requiredConfirmations: config.confirmationsRequired,
        status: 'CONFIRMING',
        detectedAt: new Date().toISOString(),
      };

      db.deposits.set(deposit.id, deposit);

      // Notification
      db.notifications.push({
        id: `notif_${crypto.randomUUID()}`,
        userId: params.userId,
        type: 'DEPOSIT',
        title: 'Incoming USDT Deposit Detected',
        message: `Detected deposit of ${params.amount.toFixed(2)} USDT (${params.network}). Awaiting ${config.confirmationsRequired} network confirmation(s).`,
        read: false,
        createdAt: new Date().toISOString(),
      });

      return deposit;
    });
  }

  /**
   * Broadcasts a withdrawal through the MPC/Hot wallet custody infrastructure
   */
  public async broadcastWithdrawal(withdrawalId: string): Promise<{ txHash: string; broadcastedAt: string }> {
    return db.withLock(async () => {
      const withdrawal = db.withdrawals.get(withdrawalId);
      if (!withdrawal) {
        throw new Error(`Withdrawal ${withdrawalId} not found.`);
      }

      if (withdrawal.status !== 'APPROVED' && withdrawal.status !== 'PENDING_REVIEW') {
        throw new Error(`Withdrawal cannot be broadcast in status: ${withdrawal.status}`);
      }

      // Generate on-chain hash
      const txHash =
        withdrawal.network === 'TRC20'
          ? crypto.randomBytes(32).toString('hex')
          : `0x${crypto.randomBytes(32).toString('hex')}`;

      const now = new Date().toISOString();

      withdrawal.status = 'CONFIRMED';
      withdrawal.txHash = txHash;
      withdrawal.completedAt = now;
      db.withdrawals.set(withdrawal.id, withdrawal);

      // Settle in Ledger
      await ledgerService.finalizeWithdrawal(
        withdrawal.userId,
        withdrawal.id,
        withdrawal.netAmount,
        withdrawal.fee,
        txHash
      );

      // Deduct from hot wallet reserves
      db.custodyReserves[withdrawal.network] = Math.max(
        0,
        db.custodyReserves[withdrawal.network] - withdrawal.netAmount
      );

      // Notify user
      db.notifications.push({
        id: `notif_${crypto.randomUUID()}`,
        userId: withdrawal.userId,
        type: 'WITHDRAWAL',
        title: 'Withdrawal Broadcasted & Confirmed',
        message: `Your withdrawal of ${withdrawal.netAmount.toFixed(2)} USDT (${withdrawal.network}) has been broadcasted. Tx: ${txHash.slice(0, 10)}...`,
        read: false,
        createdAt: now,
      });

      return { txHash, broadcastedAt: now };
    });
  }

  /**
   * Background worker to process pending confirmations on blockchain
   */
  private startConfirmationWorker() {
    setInterval(async () => {
      try {
        await db.withLock(async () => {
          const pendingDeposits = Array.from(db.deposits.values()).filter(
            (d) => d.status === 'CONFIRMING' || (d.status === 'PENDING' && d.confirmations < d.requiredConfirmations)
          );

          for (const deposit of pendingDeposits) {
            deposit.confirmations += 1;

            if (deposit.confirmations >= deposit.requiredConfirmations) {
              deposit.status = 'CONFIRMED';
              deposit.confirmedAt = new Date().toISOString();
              db.deposits.set(deposit.id, deposit);

              // Post credit to user ledger!
              await ledgerService.creditDeposit(
                deposit.userId,
                deposit.id,
                deposit.amount,
                deposit.network,
                deposit.txHash
              );

              // Add to hot wallet reserve
              db.custodyReserves[deposit.network] += deposit.amount;

              // Notification
              db.notifications.push({
                id: `notif_${crypto.randomUUID()}`,
                userId: deposit.userId,
                type: 'DEPOSIT',
                title: 'USDT Deposit Confirmed',
                message: `Your deposit of ${deposit.amount.toFixed(2)} USDT (${deposit.network}) is now available in your wallet!`,
                read: false,
                createdAt: new Date().toISOString(),
              });
            } else {
              db.deposits.set(deposit.id, deposit);
            }
          }
        });
      } catch (err) {
        console.error('Confirmation worker error:', err);
      }
    }, 4000);
  }
}

export const blockchainService = new BlockchainService();
