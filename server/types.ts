export interface User {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'finance_manager' | 'compliance' | 'user';
  kycTier: 0 | 1 | 2;
  kycStatus: 'none' | 'pending' | 'approved' | 'rejected' | 'resubmit';
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  twoFactorBackupCodes?: string[];
  antiPhishingCode?: string;
  isFrozen: boolean;
  isKeyringBackedUp?: boolean;
  activeNetwork?: BlockchainNetwork;
  createdAt: string;
  lastLoginAt: string;
}

export interface EncryptedVault {
  iv: string;
  salt: string;
  ciphertext: string;
  tag: string;
}

export interface UserKeyring {
  userId: string;
  encryptedVault: EncryptedVault; // AES-256-GCM encrypted mnemonic & private keys
  mnemonicWordCount: 12 | 24;
  isBackedUp: boolean;
  addresses: {
    TRC20: string;
    ERC20: string;
    BEP20: string;
    POLYGON?: string;
    SOLANA?: string;
    BITCOIN?: string;
  };
  createdAt: string;
  lastBackedUpAt?: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  ipAddress: string;
  userAgent: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  location: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}

export type BlockchainNetwork = 'TRC20' | 'ERC20' | 'BEP20' | 'POLYGON' | 'ARBITRUM' | 'OPTIMISM' | 'SOLANA' | 'BITCOIN';

export interface WalletAddress {
  id: string;
  userId: string;
  network: BlockchainNetwork;
  address: string;
  derivationPath: string;
  createdAt: string;
  status: 'active' | 'retired';
}

export type LedgerAccountType = 
  | 'ASSET_AVAILABLE'
  | 'ASSET_PENDING_WITHDRAWAL'
  | 'ASSET_STAKED'
  | 'LIABILITY_DEPOSIT'
  | 'FEE_EXPENSE'
  | 'SYSTEM_RESERVE';

export type LedgerReferenceType = 
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'WITHDRAWAL_HOLD'
  | 'WITHDRAWAL_REFUND'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'SWAP'
  | 'STAKE'
  | 'UNSTAKE'
  | 'STAKING_REWARD'
  | 'FEE'
  | 'ADJUSTMENT'
  | 'RESERVE_INJECTION';

export interface LedgerEntry {
  id: string;
  entryGroupId: string; // Links balancing double-entry transactions
  userId: string;
  accountType: LedgerAccountType;
  debitAmount: number;  // Outflow / Debit
  creditAmount: number; // Inflow / Credit
  currency: string;
  referenceType: LedgerReferenceType;
  referenceId: string;
  description: string;
  timestamp: string;
}

export type TransactionStatus = 'PENDING' | 'CONFIRMING' | 'CONFIRMED' | 'REJECTED' | 'FAILED' | 'CANCELLED';

export interface Deposit {
  id: string;
  userId: string;
  network: BlockchainNetwork;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  fee: number;
  blockNumber: number;
  confirmations: number;
  requiredConfirmations: number;
  status: TransactionStatus;
  detectedAt: string;
  confirmedAt?: string;
  rawPayload?: Record<string, unknown>;
}

export interface Withdrawal {
  id: string;
  userId: string;
  network: BlockchainNetwork;
  txHash?: string;
  toAddress: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: TransactionStatus | 'PENDING_REVIEW' | 'APPROVED' | 'BROADCASTING';
  riskScore: number; // 0 - 100
  requiresAdminApproval: boolean;
  approvedBy?: string;
  rejectionReason?: string;
  requestedAt: string;
  completedAt?: string;
}

export interface InternalTransfer {
  id: string;
  senderUserId: string;
  senderEmail: string;
  receiverUserId: string;
  receiverEmail: string;
  amount: number;
  fee: number;
  note?: string;
  status: 'COMPLETED' | 'FAILED';
  completedAt: string;
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
  status: TransactionStatus;
  createdAt: string;
}

export interface StakingPool {
  id: string;
  name: string;
  asset: string;
  network: BlockchainNetwork;
  apy: number;
  durationOptions: {
    type: 'FLEXIBLE' | '30D' | '90D';
    label: string;
    bonusApy: number;
  }[];
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
  totalClaimedRewards: number;
  unlocksAt?: string;
  status: 'ACTIVE' | 'UNSTAKED';
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
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  idType: 'passport' | 'drivers_license' | 'national_id';
  idNumber: string;
  idFrontUrl: string;
  idBackUrl?: string;
  proofOfAddressUrl?: string;
  selfieUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESUBMIT';
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  ipAddress: string;
  userAgent: string;
  previousValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'SWAP' | 'STAKING' | 'SECURITY' | 'KYC' | 'SYSTEM';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ReconciliationSummary {
  id: string;
  timestamp: string;
  totalUserLiabilityUSDT: number;
  totalSystemReservesUSDT: number;
  totalPendingWithdrawalsUSDT: number;
  onChainBalances: {
    TRC20: number;
    ERC20: number;
    BEP20: number;
  };
  solvencyRatio: number; // reserves / liabilities
  discrepancyUSDT: number;
  status: 'SOLVENT_MATCH' | 'DISCREPANCY_DETECTED' | 'HEALTHY';
  alerts: string[];
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
