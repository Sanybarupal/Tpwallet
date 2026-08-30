import crypto from 'crypto';
import { db } from '../db';
import { LedgerEntry, LedgerAccountType, LedgerReferenceType } from '../types';

export interface UserBalanceBreakdown {
  totalBalance: number;
  availableBalance: number;
  pendingBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalTransferredOut: number;
  totalTransferredIn: number;
  currency: 'USDT';
  lastCalculatedAt: string;
}

export class LedgerService {
  /**
   * Calculates the exact real-time balances from the immutable ledger entries.
   * Balances are NEVER stored in a mutable counter; they are derived from debit/credit sums.
   */
  public async getUserBalance(userId: string): Promise<UserBalanceBreakdown> {
    return db.withLock(() => {
      const userEntries = db.ledgerEntries.filter((e) => e.userId === userId);

      let availableCredit = 0;
      let availableDebit = 0;
      let pendingCredit = 0;
      let pendingDebit = 0;
      let totalDeposited = 0;
      let totalWithdrawn = 0;
      let totalTransferredOut = 0;
      let totalTransferredIn = 0;

      for (const entry of userEntries) {
        if (entry.accountType === 'ASSET_AVAILABLE') {
          availableCredit += entry.creditAmount;
          availableDebit += entry.debitAmount;
        } else if (entry.accountType === 'ASSET_PENDING_WITHDRAWAL') {
          pendingCredit += entry.creditAmount;
          pendingDebit += entry.debitAmount;
        }

        if (entry.referenceType === 'DEPOSIT' && entry.accountType === 'ASSET_AVAILABLE') {
          totalDeposited += entry.creditAmount;
        } else if (entry.referenceType === 'WITHDRAWAL' && entry.accountType === 'ASSET_PENDING_WITHDRAWAL') {
          totalWithdrawn += entry.debitAmount;
        } else if (entry.referenceType === 'TRANSFER_OUT' && entry.accountType === 'ASSET_AVAILABLE') {
          totalTransferredOut += entry.debitAmount;
        } else if (entry.referenceType === 'TRANSFER_IN' && entry.accountType === 'ASSET_AVAILABLE') {
          totalTransferredIn += entry.creditAmount;
        }
      }

      const availableBalance = Math.max(0, Number((availableCredit - availableDebit).toFixed(4)));
      const pendingBalance = Math.max(0, Number((pendingCredit - pendingDebit).toFixed(4)));
      const totalBalance = Number((availableBalance + pendingBalance).toFixed(4));

      return {
        totalBalance,
        availableBalance,
        pendingBalance,
        totalDeposited: Number(totalDeposited.toFixed(4)),
        totalWithdrawn: Number(totalWithdrawn.toFixed(4)),
        totalTransferredOut: Number(totalTransferredOut.toFixed(4)),
        totalTransferredIn: Number(totalTransferredIn.toFixed(4)),
        currency: 'USDT',
        lastCalculatedAt: new Date().toISOString(),
      };
    });
  }

  /**
   * Posts on-chain deposit confirmation to the ledger
   */
  public async creditDeposit(
    userId: string,
    depositId: string,
    amount: number,
    network: string,
    txHash: string
  ): Promise<{ entryGroupId: string }> {
    return db.withLock(() => {
      // Check if deposit already credited in ledger
      const exists = db.ledgerEntries.some(
        (e) => e.referenceId === depositId && e.referenceType === 'DEPOSIT'
      );
      if (exists) {
        throw new Error(`Deposit ${depositId} has already been credited to ledger.`);
      }

      const entryGroupId = `grp_dep_${crypto.randomUUID()}`;
      const now = new Date().toISOString();

      // Entry 1: Credit User Asset
      db.ledgerEntries.push({
        id: `ledg_${crypto.randomUUID()}`,
        entryGroupId,
        userId,
        accountType: 'ASSET_AVAILABLE',
        debitAmount: 0,
        creditAmount: amount,
        currency: 'USDT',
        referenceType: 'DEPOSIT',
        referenceId: depositId,
        description: `USDT-${network} Deposit confirmed (Tx: ${txHash.slice(0, 10)}...)`,
        timestamp: now,
      });

      // Entry 2: Credit User Liability
      db.ledgerEntries.push({
        id: `ledg_${crypto.randomUUID()}`,
        entryGroupId,
        userId,
        accountType: 'LIABILITY_DEPOSIT',
        debitAmount: 0,
        creditAmount: amount,
        currency: 'USDT',
        referenceType: 'DEPOSIT',
        referenceId: depositId,
        description: `Vault Reserve Liability for Deposit ${depositId}`,
        timestamp: now,
      });

      return { entryGroupId };
    });
  }

  /**
   * Places an atomic hold on funds when a user requests a withdrawal.
   * Verifies that the user has sufficient available funds.
   */
  public async holdWithdrawalFunds(
    userId: string,
    withdrawalId: string,
    grossAmount: number,
    description: string
  ): Promise<{ entryGroupId: string }> {
    return db.withLock(async () => {
      // Re-calculate balance inside the lock
      const balance = await this.getUserBalance(userId);
      if (balance.availableBalance < grossAmount) {
        throw new Error(
          `Insufficient available balance. Required: ${grossAmount.toFixed(2)} USDT, Available: ${balance.availableBalance.toFixed(2)} USDT`
        );
      }

      const entryGroupId = `grp_whold_${crypto.randomUUID()}`;
      const now = new Date().toISOString();

      // Entry 1: Debit available asset
      db.ledgerEntries.push({
        id: `ledg_${crypto.randomUUID()}`,
        entryGroupId,
        userId,
        accountType: 'ASSET_AVAILABLE',
        debitAmount: grossAmount,
        creditAmount: 0,
        currency: 'USDT',
        referenceType: 'WITHDRAWAL_HOLD',
        referenceId: withdrawalId,
        description: `Hold for withdrawal: ${description}`,
        timestamp: now,
      });

      // Entry 2: Credit pending withdrawal account
      db.ledgerEntries.push({
        id: `ledg_${crypto.randomUUID()}`,
        entryGroupId,
        userId,
        accountType: 'ASSET_PENDING_WITHDRAWAL',
        debitAmount: 0,
        creditAmount: grossAmount,
        currency: 'USDT',
        referenceType: 'WITHDRAWAL_HOLD',
        referenceId: withdrawalId,
        description: `Pending withdrawal escrow for ${withdrawalId}`,
        timestamp: now,
      });

      return { entryGroupId };
    });
  }

  /**
   * Finalizes the withdrawal upon on-chain confirmation by debiting the pending hold
   * and clearing the liability.
   */
  public async finalizeWithdrawal(
    userId: string,
    withdrawalId: string,
    netAmount: number,
    fee: number,
    txHash: string
  ): Promise<{ entryGroupId: string }> {
    return db.withLock(() => {
      const grossAmount = netAmount + fee;
      const entryGroupId = `grp_wfin_${crypto.randomUUID()}`;
      const now = new Date().toISOString();

      // Clear pending hold
      db.ledgerEntries.push({
        id: `ledg_${crypto.randomUUID()}`,
        entryGroupId,
        userId,
        accountType: 'ASSET_PENDING_WITHDRAWAL',
        debitAmount: grossAmount,
        creditAmount: 0,
        currency: 'USDT',
        referenceType: 'WITHDRAWAL',
        referenceId: withdrawalId,
        description: `Settled withdrawal on-chain (Tx: ${txHash.slice(0, 10)}...)`,
        timestamp: now,
      });

      // Debit liability
      db.ledgerEntries.push({
        id: `ledg_${crypto.randomUUID()}`,
        entryGroupId,
        userId,
        accountType: 'LIABILITY_DEPOSIT',
        debitAmount: grossAmount,
        creditAmount: 0,
        currency: 'USDT',
        referenceType: 'WITHDRAWAL',
        referenceId: withdrawalId,
        description: `Liability discharge for withdrawal ${withdrawalId}`,
        timestamp: now,
      });

      // Record fee revenue
      if (fee > 0) {
        db.ledgerEntries.push({
          id: `ledg_${crypto.randomUUID()}`,
          entryGroupId,
          userId,
          accountType: 'FEE_EXPENSE',
          debitAmount: 0,
          creditAmount: fee,
          currency: 'USDT',
          referenceType: 'FEE',
          referenceId: withdrawalId,
          description: `Network gas fee collected for withdrawal`,
          timestamp: now,
        });
      }

      return { entryGroupId };
    });
  }

  /**
   * Releases an active withdrawal hold back to the user's available balance (e.g. rejection or cancellation)
   */
  public async refundWithdrawalHold(
    userId: string,
    withdrawalId: string,
    grossAmount: number,
    reason: string
  ): Promise<{ entryGroupId: string }> {
    return db.withLock(() => {
      const entryGroupId = `grp_wref_${crypto.randomUUID()}`;
      const now = new Date().toISOString();

      // Debit pending withdrawal escrow
      db.ledgerEntries.push({
        id: `ledg_${crypto.randomUUID()}`,
        entryGroupId,
        userId,
        accountType: 'ASSET_PENDING_WITHDRAWAL',
        debitAmount: grossAmount,
        creditAmount: 0,
        currency: 'USDT',
        referenceType: 'WITHDRAWAL_REFUND',
        referenceId: withdrawalId,
        description: `Refund hold: ${reason}`,
        timestamp: now,
      });

      // Re-credit available balance
      db.ledgerEntries.push({
        id: `ledg_${crypto.randomUUID()}`,
        entryGroupId,
        userId,
        accountType: 'ASSET_AVAILABLE',
        debitAmount: 0,
        creditAmount: grossAmount,
        currency: 'USDT',
        referenceType: 'WITHDRAWAL_REFUND',
        referenceId: withdrawalId,
        description: `Restored available balance for rejected withdrawal ${withdrawalId}`,
        timestamp: now,
      });

      return { entryGroupId };
    });
  }

  /**
   * Executes atomic internal transfer between two users with zero race conditions.
   */
  public async executeInternalTransfer(
    senderUserId: string,
    receiverUserId: string,
    amount: number,
    transferId: string,
    note?: string
  ): Promise<{ entryGroupId: string }> {
    return db.withLock(async () => {
      if (senderUserId === receiverUserId) {
        throw new Error('Sender and receiver cannot be the same account.');
      }

      const senderBalance = await this.getUserBalance(senderUserId);
      if (senderBalance.availableBalance < amount) {
        throw new Error(
          `Insufficient available balance. Required: ${amount.toFixed(2)} USDT, Available: ${senderBalance.availableBalance.toFixed(2)} USDT`
        );
      }

      const entryGroupId = `grp_transfer_${crypto.randomUUID()}`;
      const now = new Date().toISOString();

      // 1. Debit Sender
      db.ledgerEntries.push({
        id: `ledg_${crypto.randomUUID()}`,
        entryGroupId,
        userId: senderUserId,
        accountType: 'ASSET_AVAILABLE',
        debitAmount: amount,
        creditAmount: 0,
        currency: 'USDT',
        referenceType: 'TRANSFER_OUT',
        referenceId: transferId,
        description: `Internal transfer sent to ${receiverUserId}${note ? ` (${note})` : ''}`,
        timestamp: now,
      });

      // 2. Credit Receiver
      db.ledgerEntries.push({
        id: `ledg_${crypto.randomUUID()}`,
        entryGroupId,
        userId: receiverUserId,
        accountType: 'ASSET_AVAILABLE',
        debitAmount: 0,
        creditAmount: amount,
        currency: 'USDT',
        referenceType: 'TRANSFER_IN',
        referenceId: transferId,
        description: `Internal transfer received from ${senderUserId}${note ? ` (${note})` : ''}`,
        timestamp: now,
      });

      return { entryGroupId };
    });
  }

  /**
   * Admin manual balance adjustment with immutable audit and double entry
   */
  public async postAdminAdjustment(
    userId: string,
    type: 'CREDIT' | 'DEBIT',
    amount: number,
    adminId: string,
    reason: string
  ): Promise<{ entryGroupId: string }> {
    return db.withLock(async () => {
      if (amount <= 0) {
        throw new Error('Adjustment amount must be greater than zero.');
      }

      if (type === 'DEBIT') {
        const balance = await this.getUserBalance(userId);
        if (balance.availableBalance < amount) {
          throw new Error('User has insufficient available balance for debit adjustment.');
        }
      }

      const entryGroupId = `grp_adj_${crypto.randomUUID()}`;
      const adjustmentId = `adj_${crypto.randomUUID()}`;
      const now = new Date().toISOString();

      if (type === 'CREDIT') {
        db.ledgerEntries.push({
          id: `ledg_${crypto.randomUUID()}`,
          entryGroupId,
          userId,
          accountType: 'ASSET_AVAILABLE',
          debitAmount: 0,
          creditAmount: amount,
          currency: 'USDT',
          referenceType: 'ADJUSTMENT',
          referenceId: adjustmentId,
          description: `Admin balance adjustment (Credit): ${reason} (by ${adminId})`,
          timestamp: now,
        });
        db.ledgerEntries.push({
          id: `ledg_${crypto.randomUUID()}`,
          entryGroupId,
          userId,
          accountType: 'LIABILITY_DEPOSIT',
          debitAmount: 0,
          creditAmount: amount,
          currency: 'USDT',
          referenceType: 'ADJUSTMENT',
          referenceId: adjustmentId,
          description: `Vault liability adjustment credit: ${reason}`,
          timestamp: now,
        });
      } else {
        db.ledgerEntries.push({
          id: `ledg_${crypto.randomUUID()}`,
          entryGroupId,
          userId,
          accountType: 'ASSET_AVAILABLE',
          debitAmount: amount,
          creditAmount: 0,
          currency: 'USDT',
          referenceType: 'ADJUSTMENT',
          referenceId: adjustmentId,
          description: `Admin balance adjustment (Debit): ${reason} (by ${adminId})`,
          timestamp: now,
        });
        db.ledgerEntries.push({
          id: `ledg_${crypto.randomUUID()}`,
          entryGroupId,
          userId,
          accountType: 'LIABILITY_DEPOSIT',
          debitAmount: amount,
          creditAmount: 0,
          currency: 'USDT',
          referenceType: 'ADJUSTMENT',
          referenceId: adjustmentId,
          description: `Vault liability adjustment debit: ${reason}`,
          timestamp: now,
        });
      }

      return { entryGroupId };
    });
  }
}

export const ledgerService = new LedgerService();
