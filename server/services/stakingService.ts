import crypto from 'crypto';
import { db } from '../db';
import { ledgerService } from './ledgerService';
import { BlockchainNetwork, StakingPool, StakingPosition } from '../types';

export const DEFAULT_STAKING_POOLS: StakingPool[] = [
  {
    id: 'pool_usdt_liquid',
    name: 'USDT Liquid Staking Vault',
    asset: 'USDT',
    network: 'TRC20',
    apy: 8.45,
    durationOptions: [
      { type: 'FLEXIBLE', label: 'Flexible (Instant)', bonusApy: 0 },
      { type: '30D', label: '30 Days Lock', bonusApy: 2.35 },
      { type: '90D', label: '90 Days Lock', bonusApy: 5.05 },
    ],
    minStake: 10,
    tvl: 48200000,
    description: 'Institutional-grade multi-chain yield vault with automated daily compounding and zero gas fees.',
    status: 'ACTIVE',
  },
  {
    id: 'pool_tron_energy',
    name: 'TRON Super Representative Energy',
    asset: 'USDT',
    network: 'TRC20',
    apy: 12.20,
    durationOptions: [
      { type: 'FLEXIBLE', label: 'Flexible', bonusApy: 0 },
      { type: '30D', label: '30 Days Lock', bonusApy: 3.40 },
      { type: '90D', label: '90 Days Lock', bonusApy: 6.70 },
    ],
    minStake: 50,
    tvl: 26400000,
    description: 'Stake USDT to rent network energy & bandwidth to high-frequency Tron dapp traders and earn TRX gas dividends.',
    status: 'ACTIVE',
  },
  {
    id: 'pool_eth_liquid',
    name: 'ETH 2.0 Liquid Validator',
    asset: 'ETH',
    network: 'ERC20',
    apy: 4.50,
    durationOptions: [
      { type: 'FLEXIBLE', label: 'Flexible', bonusApy: 0 },
      { type: '30D', label: '30 Days', bonusApy: 1.20 },
    ],
    minStake: 0.05,
    tvl: 89100000,
    description: 'Decentralized Ethereum proof-of-stake node validation yield with liquid receipt tokens.',
    status: 'ACTIVE',
  },
  {
    id: 'pool_bnb_vault',
    name: 'BNB Chain Yield Vault',
    asset: 'BNB',
    network: 'BEP20',
    apy: 6.20,
    durationOptions: [
      { type: 'FLEXIBLE', label: 'Flexible', bonusApy: 0 },
      { type: '30D', label: '30 Days', bonusApy: 1.80 },
    ],
    minStake: 0.1,
    tvl: 14700000,
    description: 'Automated liquidity provision to BNB Chain verified AMM lending markets.',
    status: 'ACTIVE',
  },
];

export class StakingService {
  /**
   * Computes dynamic real-time interest accrued up to the exact current millisecond
   */
  public calculateCurrentAccruedReward(position: StakingPosition): number {
    const lastClaimed = new Date(position.lastClaimedAt).getTime();
    const now = Date.now();
    const elapsedMs = Math.max(0, now - lastClaimed);
    const msInYear = 365.25 * 24 * 60 * 60 * 1000;
    const yearlyFraction = elapsedMs / msInYear;

    const currentReward = position.stakedAmount * (position.effectiveApy / 100) * yearlyFraction;
    return Number((position.accruedRewards + currentReward).toFixed(6));
  }

  /**
   * Returns user's staking dashboard overview with dynamic reward counters
   */
  public async getStakingOverview(userId: string) {
    return db.withLock(async () => {
      const userBalance = await ledgerService.getUserBalance(userId);
      const positions = Array.from(db.stakingPositions.values())
        .filter((p) => p.userId === userId && p.status === 'ACTIVE')
        .map((p) => {
          const liveRewards = this.calculateCurrentAccruedReward(p);
          return {
            ...p,
            liveAccruedRewards: liveRewards,
          };
        });

      const totalStakedUSDT = positions.reduce((acc, p) => acc + (p.asset === 'USDT' ? p.stakedAmount : p.stakedAmount * (p.asset === 'ETH' ? 2745 : 668)), 0);
      const totalPendingRewards = positions.reduce((acc, p) => acc + p.liveAccruedRewards, 0);

      return {
        pools: DEFAULT_STAKING_POOLS,
        positions,
        totalStakedUSDT: Number(totalStakedUSDT.toFixed(2)),
        totalPendingRewards: Number(totalPendingRewards.toFixed(4)),
        availableBalanceUSDT: userBalance.availableBalance,
      };
    });
  }

  /**
   * Stakes funds into a yield pool with atomic double-entry ledger lock
   */
  public async stake(params: {
    userId: string;
    poolId: string;
    amount: number;
    duration: 'FLEXIBLE' | '30D' | '90D';
  }): Promise<{ position: StakingPosition; message: string }> {
    return db.withLock(async () => {
      const { userId, poolId, amount, duration } = params;
      const pool = DEFAULT_STAKING_POOLS.find((p) => p.id === poolId);
      if (!pool) {
        throw new Error('Staking pool not found.');
      }

      if (amount < pool.minStake) {
        throw new Error(`Minimum stake for ${pool.name} is ${pool.minStake} ${pool.asset}.`);
      }

      const userBalance = await ledgerService.getUserBalance(userId);
      if (userBalance.availableBalance < amount) {
        throw new Error(`Insufficient available balance. You have ${userBalance.availableBalance.toFixed(2)} USDT.`);
      }

      // Calculate effective APY
      const durationOpt = pool.durationOptions.find((d) => d.type === duration);
      const bonus = durationOpt ? durationOpt.bonusApy : 0;
      const effectiveApy = pool.apy + bonus;

      const positionId = `stk_${crypto.randomUUID()}`;
      const entryGroupId = `grp_stake_${crypto.randomUUID()}`;
      const now = new Date().toISOString();

      let unlocksAt: string | undefined = undefined;
      if (duration === '30D') {
        unlocksAt = new Date(Date.now() + 30 * 86400000).toISOString();
      } else if (duration === '90D') {
        unlocksAt = new Date(Date.now() + 90 * 86400000).toISOString();
      }

      // 1. Double Entry in Ledger: Debit Available, Credit Staked
      db.ledgerEntries.push({
        id: `ledg_${crypto.randomUUID()}`,
        entryGroupId,
        userId,
        accountType: 'ASSET_AVAILABLE',
        debitAmount: amount,
        creditAmount: 0,
        currency: pool.asset,
        referenceType: 'STAKE',
        referenceId: positionId,
        description: `Staked into ${pool.name} (${duration} @ ${effectiveApy.toFixed(2)}% APY)`,
        timestamp: now,
      });

      db.ledgerEntries.push({
        id: `ledg_${crypto.randomUUID()}`,
        entryGroupId,
        userId,
        accountType: 'ASSET_STAKED',
        debitAmount: 0,
        creditAmount: amount,
        currency: pool.asset,
        referenceType: 'STAKE',
        referenceId: positionId,
        description: `Staking Principal Lock for ${positionId}`,
        timestamp: now,
      });

      const position: StakingPosition = {
        id: positionId,
        userId,
        poolId: pool.id,
        poolName: pool.name,
        asset: pool.asset,
        network: pool.network,
        stakedAmount: amount,
        effectiveApy,
        duration,
        stakedAt: now,
        lastClaimedAt: now,
        accruedRewards: 0,
        totalClaimedRewards: 0,
        unlocksAt,
        status: 'ACTIVE',
      };

      db.stakingPositions.set(positionId, position);

      // Notification
      db.notifications.push({
        id: `notif_${crypto.randomUUID()}`,
        userId,
        type: 'STAKING',
        title: 'Staking Deposit Confirmed',
        message: `Deposited ${amount.toFixed(2)} ${pool.asset} into ${pool.name} earning ${effectiveApy.toFixed(2)}% APY!`,
        read: false,
        createdAt: now,
      });

      return {
        position,
        message: `Successfully staked ${amount.toFixed(2)} ${pool.asset} at ${effectiveApy.toFixed(2)}% APY!`,
      };
    });
  }

  /**
   * Claims live accrued rewards into user's available balance
   */
  public async claimRewards(userId: string, positionId: string): Promise<{ claimedAmount: number; message: string }> {
    return db.withLock(async () => {
      const position = db.stakingPositions.get(positionId);
      if (!position || position.userId !== userId || position.status !== 'ACTIVE') {
        throw new Error('Active staking position not found.');
      }

      const rewardAmount = this.calculateCurrentAccruedReward(position);
      if (rewardAmount <= 0.0001) {
        throw new Error('Reward threshold not met. Minimum claimable amount is 0.0001 USDT.');
      }

      const now = new Date().toISOString();
      const entryGroupId = `grp_claim_${crypto.randomUUID()}`;

      // Credit available balance with reward
      db.ledgerEntries.push({
        id: `ledg_${crypto.randomUUID()}`,
        entryGroupId,
        userId,
        accountType: 'ASSET_AVAILABLE',
        debitAmount: 0,
        creditAmount: rewardAmount,
        currency: position.asset,
        referenceType: 'STAKING_REWARD',
        referenceId: position.id,
        description: `Claimed yield rewards from ${position.poolName}`,
        timestamp: now,
      });

      position.accruedRewards = 0;
      position.lastClaimedAt = now;
      position.totalClaimedRewards += rewardAmount;
      db.stakingPositions.set(position.id, position);

      db.notifications.push({
        id: `notif_${crypto.randomUUID()}`,
        userId,
        type: 'STAKING',
        title: 'Staking Rewards Claimed',
        message: `Claimed ${rewardAmount.toFixed(4)} ${position.asset} in staking dividends to your wallet.`,
        read: false,
        createdAt: now,
      });

      return {
        claimedAmount: rewardAmount,
        message: `Successfully claimed +${rewardAmount.toFixed(4)} ${position.asset} to available balance!`,
      };
    });
  }

  /**
   * Unstakes principal and returns it to available balance
   */
  public async unstake(userId: string, positionId: string): Promise<{ unstakedAmount: number; message: string }> {
    return db.withLock(async () => {
      const position = db.stakingPositions.get(positionId);
      if (!position || position.userId !== userId || position.status !== 'ACTIVE') {
        throw new Error('Active staking position not found.');
      }

      if (position.unlocksAt && new Date(position.unlocksAt).getTime() > Date.now()) {
        const remainingDays = Math.ceil((new Date(position.unlocksAt).getTime() - Date.now()) / 86400000);
        throw new Error(`Position is locked. Remaining lock period: ${remainingDays} day(s).`);
      }

      const now = new Date().toISOString();
      const entryGroupId = `grp_unstk_${crypto.randomUUID()}`;

      // 1. Claim any pending rewards first
      const pendingRewards = this.calculateCurrentAccruedReward(position);
      if (pendingRewards > 0.0001) {
        db.ledgerEntries.push({
          id: `ledg_${crypto.randomUUID()}`,
          entryGroupId,
          userId,
          accountType: 'ASSET_AVAILABLE',
          debitAmount: 0,
          creditAmount: pendingRewards,
          currency: position.asset,
          referenceType: 'STAKING_REWARD',
          referenceId: position.id,
          description: `Auto-claimed remaining rewards on unstake from ${position.poolName}`,
          timestamp: now,
        });
        position.totalClaimedRewards += pendingRewards;
      }

      // 2. Return principal from ASSET_STAKED to ASSET_AVAILABLE
      db.ledgerEntries.push({
        id: `ledg_${crypto.randomUUID()}`,
        entryGroupId,
        userId,
        accountType: 'ASSET_STAKED',
        debitAmount: position.stakedAmount,
        creditAmount: 0,
        currency: position.asset,
        referenceType: 'UNSTAKE',
        referenceId: position.id,
        description: `Unstaked principal from ${position.poolName}`,
        timestamp: now,
      });

      db.ledgerEntries.push({
        id: `ledg_${crypto.randomUUID()}`,
        entryGroupId,
        userId,
        accountType: 'ASSET_AVAILABLE',
        debitAmount: 0,
        creditAmount: position.stakedAmount,
        currency: position.asset,
        referenceType: 'UNSTAKE',
        referenceId: position.id,
        description: `Restored principal from ${position.poolName}`,
        timestamp: now,
      });

      position.status = 'UNSTAKED';
      position.accruedRewards = 0;
      position.lastClaimedAt = now;
      db.stakingPositions.set(position.id, position);

      db.notifications.push({
        id: `notif_${crypto.randomUUID()}`,
        userId,
        type: 'STAKING',
        title: 'Principal Unstaked',
        message: `Successfully unstaked ${position.stakedAmount.toFixed(2)} ${position.asset} back to your wallet.`,
        read: false,
        createdAt: now,
      });

      return {
        unstakedAmount: position.stakedAmount,
        message: `Successfully unstaked ${position.stakedAmount.toFixed(2)} ${position.asset}!`,
      };
    });
  }
}

export const stakingService = new StakingService();
