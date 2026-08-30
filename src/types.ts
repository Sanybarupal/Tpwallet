export type BlockchainNetwork = 'TRC20' | 'ERC20' | 'BEP20' | 'POLYGON' | 'ARBITRUM' | 'OPTIMISM' | 'SOLANA' | 'BITCOIN';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'finance_manager' | 'compliance' | 'user';
  kycTier: 0 | 1 | 2;
  kycStatus: 'none' | 'pending' | 'approved' | 'rejected' | 'resubmit';
  twoFactorEnabled: boolean;
  antiPhishingCode?: string;
  isFrozen: boolean;
  isKeyringBackedUp?: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export interface UserBalance {
  totalBalance: number;
  availableBalance: number;
  pendingBalance: number;
  stakedBalance?: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalTransferredOut: number;
  totalTransferredIn: number;
  currency: 'USDT';
  lastCalculatedAt: string;
}

export interface NetworkConfig {
  network: BlockchainNetwork;
  name: string;
  symbol: string;
  contractAddress: string;
  standard: string;
  minDeposit: number;
  minWithdrawal: number;
  withdrawalFee: number;
  confirmationsRequired: number;
  explorerUrl: string;
  explorerTxPrefix: string;
  rpcUrl: string;
  isActive: boolean;
}

export interface TransactionItem {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'SWAP' | 'STAKE' | 'UNSTAKE' | 'STAKING_REWARD';
  network: BlockchainNetwork | 'INTERNAL';
  amount: number;
  fee: number;
  netAmount: number;
  status: 'PENDING' | 'CONFIRMING' | 'CONFIRMED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'FAILED' | 'COMPLETED';
  txHash?: string;
  counterpartyAddress: string;
  myAddress: string;
  confirmations: string;
  createdAt: string;
  completedAt?: string;
  explorerUrl?: string;
  rejectionReason?: string;
  note?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'SECURITY' | 'KYC' | 'SYSTEM' | 'SWAP' | 'STAKING';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface UserSession {
  id: string;
  ipAddress: string;
  userAgent: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  location: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface UserKeyringInfo {
  hasKeyring: boolean;
  isBackedUp: boolean;
  mnemonicWordCount?: 12 | 24;
  addresses: Record<string, string>;
  createdAt?: string;
  lastBackedUpAt?: string;
}

export interface StakingDurationOption {
  type: 'FLEXIBLE' | '30D' | '90D';
  label: string;
  bonusApy: number;
}

export interface StakingPool {
  id: string;
  name: string;
  asset: string;
  network: BlockchainNetwork;
  apy: number;
  durationOptions: StakingDurationOption[];
  minStake: number;
  tvl: number;
  description: string;
  status: 'ACTIVE' | 'PAUSED';
}

export interface StakingPosition {
  id: string;
  userId: string;
  poolId: string;
  poolName: string;
  asset: string;
  network: BlockchainNetwork;
  stakedAmount: number;
  effectiveApy: number;
  duration: 'FLEXIBLE' | '30D' | '90D';
  stakedAt: string;
  lastClaimedAt: string;
  accruedRewards: number;
  liveAccruedRewards?: number;
  totalClaimedRewards: number;
  unlocksAt?: string;
  status: 'ACTIVE' | 'UNSTAKED';
}

export interface StakingOverview {
  pools: StakingPool[];
  positions: StakingPosition[];
  totalStakedUSDT: number;
  totalPendingRewards: number;
  availableBalanceUSDT: number;
}

export interface SwapQuote {
  fromAsset: string;
  toAsset: string;
  fromAmount: number;
  toAmount: number;
  exchangeRate: number;
  minReceived: number;
  priceImpact: number;
  liquidityFee: number;
  networkGasFee: number;
  slippageTolerance: number;
  route: string[];
  expiresAt: number;
}

export interface SwapRecord {
  id: string;
  userId: string;
  fromAsset: string;
  toAsset: string;
  fromAmount: number;
  toAmount: number;
  exchangeRate: number;
  fee: number;
  slippage: number;
  txHash: string;
  blockNumber: number;
  network: BlockchainNetwork;
  status: 'CONFIRMED' | 'FAILED';
  createdAt: string;
}

export interface CustomToken {
  id: string;
  userId: string;
  contractAddress: string;
  network: BlockchainNetwork;
  symbol: string;
  name: string;
  decimals: number;
  balance: number;
  addedAt: string;
}

export interface KYCApplication {
  id: string;
  userId: string;
  tier: 1 | 2;
  tierRequested?: number;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  dob?: string;
  nationality: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  idType?: string;
  documentType?: string;
  idNumber?: string;
  documentNumber?: string;
  idFrontUrl?: string;
  documentFrontUrl?: string;
  idBackUrl?: string;
  documentBackUrl?: string;
  proofOfAddressUrl?: string;
  selfieUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESUBMIT';
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  userEmail?: string;
}

export interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  frozenUsers: number;
  totalLiabilityUSDT: number;
  totalVaultLiability?: number;
  totalPendingWithdrawalsUSDT: number;
  totalFeesCollectedUSDT: number;
  feeRevenue?: number;
  twentyFourHourVolume?: number;
  totalOnChainReserves?: number;
  reserves: {
    TRC20: number;
    ERC20: number;
    BEP20: number;
    POLYGON?: number;
    ARBITRUM?: number;
    OPTIMISM?: number;
    SOLANA?: number;
    BITCOIN?: number;
    total: number;
  };
  solvencyRatio: number;
  pendingWithdrawalsCount: number;
  pendingKycCount: number;
  totalDepositsCount: number;
  totalWithdrawalsCount: number;
  totalLedgerEntriesCount: number;
  networkBreakdown?: Record<string, {
    reserves: number;
    liabilities: number;
    depositsCount: number;
  }>;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  ipAddress: string;
  userAgent?: string;
  previousValue?: string;
  newValue?: string;
  timestamp?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface ReconciliationSummary {
  id: string;
  timestamp: string;
  totalUserLiabilityUSDT: number;
  totalSystemReservesUSDT: number;
  totalReserves: number;
  totalLiabilities: number;
  totalPendingWithdrawalsUSDT: number;
  onChainBalances: {
    TRC20: number;
    ERC20: number;
    BEP20: number;
    POLYGON?: number;
    SOLANA?: number;
    BITCOIN?: number;
  };
  solvencyRatio: number;
  discrepancyUSDT: number;
  status: 'SOLVENT_MATCH' | 'DISCREPANCY_DETECTED' | 'HEALTHY';
  alerts: string[];
}

export interface SavedContact {
  id: string;
  name: string;
  address: string;
  network: BlockchainNetwork | 'INTERNAL';
  note?: string;
  createdAt: string;
}

export type SupportedCurrency = 'USD' | 'EUR' | 'GBP' | 'CNY' | 'INR' | 'JPY';

export interface SupportFAQ {
  id: string;
  question: string;
  answer: string;
  category: 'DEPOSIT' | 'WITHDRAW' | 'SECURITY' | 'KYC' | 'FEES';
}

export interface SupportChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'agent';
  text: string;
  timestamp: string;
}

export interface BinanceTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice?: string;
  lastPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume?: string;
}

export interface BinanceAccountInfo {
  connected: boolean;
  apiKeyMasked?: string;
  isTestnet?: boolean;
  canTrade?: boolean;
  canWithdraw?: boolean;
  canDeposit?: boolean;
  balances: Array<{
    asset: string;
    free: number;
    locked: number;
    usdValue: number;
  }>;
  totalUsdValue: number;
  lastSyncedAt?: string;
}

