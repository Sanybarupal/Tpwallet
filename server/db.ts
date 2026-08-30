import crypto from 'crypto';
import { 
  User, Session, WalletAddress, LedgerEntry, Deposit, 
  Withdrawal, InternalTransfer, KYCApplication, AuditLog, 
  NotificationItem, NetworkConfig, BlockchainNetwork, ReconciliationSummary,
  UserKeyring, StakingPosition, SwapRecord, CustomToken
} from './types';

// Network configurations
export const NETWORKS: Record<BlockchainNetwork, NetworkConfig> = {
  TRC20: {
    network: 'TRC20',
    name: 'Tron (TRC-20)',
    symbol: 'USDT-TRC20',
    contractAddress: process.env.USDT_TRC20_CONTRACT || 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    standard: 'TRC-20',
    minDeposit: 1.0,
    minWithdrawal: 10.0,
    withdrawalFee: 1.0,
    confirmationsRequired: 1,
    explorerUrl: 'https://tronscan.org/#/transaction/',
    explorerTxPrefix: 'https://tronscan.org/#/transaction/',
    rpcUrl: process.env.TRON_RPC_URL || 'https://api.trongrid.io',
    isActive: true,
  },
  ERC20: {
    network: 'ERC20',
    name: 'Ethereum (ERC-20)',
    symbol: 'USDT-ERC20',
    contractAddress: process.env.USDT_ERC20_CONTRACT || '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    standard: 'ERC-20',
    minDeposit: 5.0,
    minWithdrawal: 20.0,
    withdrawalFee: 3.5,
    confirmationsRequired: 12,
    explorerUrl: 'https://etherscan.io/tx/',
    explorerTxPrefix: 'https://etherscan.io/tx/',
    rpcUrl: process.env.ETH_RPC_URL || 'https://rpc.sepolia.org',
    isActive: true,
  },
  BEP20: {
    network: 'BEP20',
    name: 'BNB Smart Chain (BEP-20)',
    symbol: 'USDT-BEP20',
    contractAddress: process.env.USDT_BEP20_CONTRACT || '0x55d398326f99059fF775485246999027B3197955',
    standard: 'BEP-20',
    minDeposit: 1.0,
    minWithdrawal: 5.0,
    withdrawalFee: 0.8,
    confirmationsRequired: 15,
    explorerUrl: 'https://bscscan.com/tx/',
    explorerTxPrefix: 'https://bscscan.com/tx/',
    rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
    isActive: true,
  },
  POLYGON: {
    network: 'POLYGON',
    name: 'Polygon PoS (POL)',
    symbol: 'USDT-POLYGON',
    contractAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    standard: 'ERC-20',
    minDeposit: 1.0,
    minWithdrawal: 5.0,
    withdrawalFee: 0.5,
    confirmationsRequired: 20,
    explorerUrl: 'https://polygonscan.com/tx/',
    explorerTxPrefix: 'https://polygonscan.com/tx/',
    rpcUrl: 'https://polygon-rpc.com',
    isActive: true,
  },
  ARBITRUM: {
    network: 'ARBITRUM',
    name: 'Arbitrum One',
    symbol: 'USDT-ARB',
    contractAddress: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    standard: 'ERC-20',
    minDeposit: 1.0,
    minWithdrawal: 5.0,
    withdrawalFee: 0.6,
    confirmationsRequired: 10,
    explorerUrl: 'https://arbiscan.io/tx/',
    explorerTxPrefix: 'https://arbiscan.io/tx/',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    isActive: true,
  },
  OPTIMISM: {
    network: 'OPTIMISM',
    name: 'Optimism Mainnet',
    symbol: 'USDT-OP',
    contractAddress: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    standard: 'ERC-20',
    minDeposit: 1.0,
    minWithdrawal: 5.0,
    withdrawalFee: 0.6,
    confirmationsRequired: 10,
    explorerUrl: 'https://optimistic.etherscan.io/tx/',
    explorerTxPrefix: 'https://optimistic.etherscan.io/tx/',
    rpcUrl: 'https://mainnet.optimism.io',
    isActive: true,
  },
  SOLANA: {
    network: 'SOLANA',
    name: 'Solana (SPL)',
    symbol: 'USDT-SPL',
    contractAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    standard: 'SPL',
    minDeposit: 1.0,
    minWithdrawal: 5.0,
    withdrawalFee: 0.5,
    confirmationsRequired: 32,
    explorerUrl: 'https://solscan.io/tx/',
    explorerTxPrefix: 'https://solscan.io/tx/',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    isActive: true,
  },
  BITCOIN: {
    network: 'BITCOIN',
    name: 'Bitcoin Network',
    symbol: 'BTC',
    contractAddress: 'Native',
    standard: 'UTXO',
    minDeposit: 0.0001,
    minWithdrawal: 0.0005,
    withdrawalFee: 0.0002,
    confirmationsRequired: 2,
    explorerUrl: 'https://mempool.space/tx/',
    explorerTxPrefix: 'https://mempool.space/tx/',
    rpcUrl: 'https://blockstream.info/api',
    isActive: true,
  },
};

// Password helper functions using PBKDF2
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

// In-Memory Database Store with thread-safe atomic lock mechanism
class DatabaseStore {
  public users: Map<string, User> = new Map();
  public sessions: Map<string, Session> = new Map();
  public walletAddresses: Map<string, WalletAddress> = new Map();
  public userKeyrings: Map<string, UserKeyring> = new Map();
  public ledgerEntries: LedgerEntry[] = [];
  public deposits: Map<string, Deposit> = new Map();
  public withdrawals: Map<string, Withdrawal> = new Map();
  public transfers: Map<string, InternalTransfer> = new Map();
  public stakingPositions: Map<string, StakingPosition> = new Map();
  public swapRecords: Map<string, SwapRecord> = new Map();
  public customTokens: Map<string, CustomToken> = new Map();
  public kycApplications: Map<string, KYCApplication> = new Map();
  public auditLogs: AuditLog[] = [];
  public notifications: NotificationItem[] = [];
  public reconciliationLogs: ReconciliationSummary[] = [];

  // Hot wallet custody vault reserves simulation state
  public custodyReserves: Record<BlockchainNetwork, number> = {
    TRC20: 250000.00,
    ERC20: 150000.00,
    BEP20: 100000.00,
    POLYGON: 80000.00,
    ARBITRUM: 60000.00,
    OPTIMISM: 50000.00,
    SOLANA: 120000.00,
    BITCOIN: 25.50,
  };

  private lockPromise: Promise<void> = Promise.resolve();

  constructor() {
    this.seedDatabase();
  }

  // Mutex lock for atomic transactions
  public async withLock<T>(operation: () => Promise<T> | T): Promise<T> {
    let release: () => void;
    const nextLock = new Promise<void>((resolve) => {
      release = resolve;
    });
    const currentLock = this.lockPromise;
    this.lockPromise = nextLock;

    await currentLock;
    try {
      return await operation();
    } finally {
      release!();
    }
  }

  private seedDatabase() {
    // 1. Seed Super Admin
    const adminSalt = generateSalt();
    const adminUser: User = {
      id: 'usr_admin_001',
      email: 'admin@usdtvault.io',
      passwordHash: hashPassword('VaultAdmin2026!', adminSalt),
      salt: adminSalt,
      firstName: 'Chief Risk',
      lastName: 'Officer',
      role: 'super_admin',
      kycTier: 2,
      kycStatus: 'approved',
      twoFactorEnabled: true,
      twoFactorSecret: 'JBSWY3DPEHPK3PXP', // Demo secret for 2FA
      twoFactorBackupCodes: ['12345678', '87654321', '99887766'],
      antiPhishingCode: 'VAULT_SHIELD_99',
      isFrozen: false,
      createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    this.users.set(adminUser.id, adminUser);

    // 2. Seed Primary Verified User (Alice)
    const aliceSalt = generateSalt();
    const aliceUser: User = {
      id: 'usr_alice_777',
      email: 'alice@crypto.io',
      passwordHash: hashPassword('Password123!', aliceSalt),
      salt: aliceSalt,
      firstName: 'Alice',
      lastName: 'Vance',
      role: 'user',
      kycTier: 2,
      kycStatus: 'approved',
      twoFactorEnabled: false,
      twoFactorSecret: '',
      twoFactorBackupCodes: [],
      antiPhishingCode: 'ALICE_SECURE_77',
      isFrozen: false,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      lastLoginAt: new Date(Date.now() - 3600000).toISOString(),
    };
    this.users.set(aliceUser.id, aliceUser);

    // 3. Seed Counterparty User (Bob)
    const bobSalt = generateSalt();
    const bobUser: User = {
      id: 'usr_bob_888',
      email: 'bob@trader.io',
      passwordHash: hashPassword('Password123!', bobSalt),
      salt: bobSalt,
      firstName: 'Bob',
      lastName: 'Mercer',
      role: 'user',
      kycTier: 1,
      kycStatus: 'approved',
      twoFactorEnabled: false,
      isFrozen: false,
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      lastLoginAt: new Date(Date.now() - 7200000).toISOString(),
    };
    this.users.set(bobUser.id, bobUser);

    // 4. Seed Wallet Addresses for Alice
    const aliceTronAddr: WalletAddress = {
      id: 'addr_alice_trc20',
      userId: aliceUser.id,
      network: 'TRC20',
      address: 'TYkC9R7a192gTjEsm2iMhU8P3hTqJk9LpW',
      derivationPath: "m/44'/195'/0'/0/1",
      createdAt: aliceUser.createdAt,
      status: 'active',
    };
    const aliceEthAddr: WalletAddress = {
      id: 'addr_alice_erc20',
      userId: aliceUser.id,
      network: 'ERC20',
      address: '0x71C83638b1805847F4094572424294b0525287f3',
      derivationPath: "m/44'/60'/0'/0/1",
      createdAt: aliceUser.createdAt,
      status: 'active',
    };
    const aliceBscAddr: WalletAddress = {
      id: 'addr_alice_bep20',
      userId: aliceUser.id,
      network: 'BEP20',
      address: '0x71C83638b1805847F4094572424294b0525287f3',
      derivationPath: "m/44'/60'/0'/0/1",
      createdAt: aliceUser.createdAt,
      status: 'active',
    };
    this.walletAddresses.set(aliceTronAddr.id, aliceTronAddr);
    this.walletAddresses.set(aliceEthAddr.id, aliceEthAddr);
    this.walletAddresses.set(aliceBscAddr.id, aliceBscAddr);

    // Bob addresses
    const bobTronAddr: WalletAddress = {
      id: 'addr_bob_trc20',
      userId: bobUser.id,
      network: 'TRC20',
      address: 'TQ5z8F9hN2B1M6VxP8sKjL4W3eY7rT9u1A',
      derivationPath: "m/44'/195'/0'/0/2",
      createdAt: bobUser.createdAt,
      status: 'active',
    };
    this.walletAddresses.set(bobTronAddr.id, bobTronAddr);

    // 5. Seed Real Initial Ledger Transactions for Alice
    const depTime1 = new Date(Date.now() - 14 * 86400000).toISOString();
    const dep1GroupId = 'grp_seed_dep_01';
    
    // Deposit record #1: 2500 USDT (TRC20)
    const dep1: Deposit = {
      id: 'dep_01_trc20_confirmed',
      userId: aliceUser.id,
      network: 'TRC20',
      txHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      fromAddress: 'TWa8mE2oE8cE4n4X6z3B1jK9w8L2pM5q7R',
      toAddress: aliceTronAddr.address,
      amount: 2500.00,
      fee: 0,
      blockNumber: 58921004,
      confirmations: 24,
      requiredConfirmations: 1,
      status: 'CONFIRMED',
      detectedAt: depTime1,
      confirmedAt: depTime1,
    };
    this.deposits.set(dep1.id, dep1);

    // Ledger entries for deposit #1 (Double entry)
    this.ledgerEntries.push({
      id: 'ledg_001',
      entryGroupId: dep1GroupId,
      userId: aliceUser.id,
      accountType: 'ASSET_AVAILABLE',
      debitAmount: 0,
      creditAmount: 2500.00,
      currency: 'USDT',
      referenceType: 'DEPOSIT',
      referenceId: dep1.id,
      description: 'USDT-TRC20 Deposit confirmed on-chain (Tx: e3b0c4...)',
      timestamp: depTime1,
    });
    this.ledgerEntries.push({
      id: 'ledg_002',
      entryGroupId: dep1GroupId,
      userId: aliceUser.id,
      accountType: 'LIABILITY_DEPOSIT',
      debitAmount: 0,
      creditAmount: 2500.00,
      currency: 'USDT',
      referenceType: 'DEPOSIT',
      referenceId: dep1.id,
      description: 'Vault User Liability Credit - Deposit',
      timestamp: depTime1,
    });

    // Deposit record #2: 1200 USDT (ERC20)
    const depTime2 = new Date(Date.now() - 5 * 86400000).toISOString();
    const dep2GroupId = 'grp_seed_dep_02';
    const dep2: Deposit = {
      id: 'dep_02_erc20_confirmed',
      userId: aliceUser.id,
      network: 'ERC20',
      txHash: '0x8f3c4e1b784a92c3d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8',
      fromAddress: '0x388C818CA8B9251b393131C08a73683246A16638',
      toAddress: aliceEthAddr.address,
      amount: 1200.00,
      fee: 0,
      blockNumber: 19823411,
      confirmations: 64,
      requiredConfirmations: 12,
      status: 'CONFIRMED',
      detectedAt: depTime2,
      confirmedAt: depTime2,
    };
    this.deposits.set(dep2.id, dep2);

    this.ledgerEntries.push({
      id: 'ledg_003',
      entryGroupId: dep2GroupId,
      userId: aliceUser.id,
      accountType: 'ASSET_AVAILABLE',
      debitAmount: 0,
      creditAmount: 1200.00,
      currency: 'USDT',
      referenceType: 'DEPOSIT',
      referenceId: dep2.id,
      description: 'USDT-ERC20 Deposit confirmed on-chain (Tx: 0x8f3c4...)',
      timestamp: depTime2,
    });
    this.ledgerEntries.push({
      id: 'ledg_004',
      entryGroupId: dep2GroupId,
      userId: aliceUser.id,
      accountType: 'LIABILITY_DEPOSIT',
      debitAmount: 0,
      creditAmount: 1200.00,
      currency: 'USDT',
      referenceType: 'DEPOSIT',
      referenceId: dep2.id,
      description: 'Vault User Liability Credit - ERC20 Deposit',
      timestamp: depTime2,
    });

    // Seed Bob initial balance: 500 USDT
    const bobDepTime = new Date(Date.now() - 10 * 86400000).toISOString();
    this.ledgerEntries.push({
      id: 'ledg_bob_001',
      entryGroupId: 'grp_seed_bob_dep',
      userId: bobUser.id,
      accountType: 'ASSET_AVAILABLE',
      debitAmount: 0,
      creditAmount: 500.00,
      currency: 'USDT',
      referenceType: 'DEPOSIT',
      referenceId: 'dep_bob_01',
      description: 'Initial On-Chain Deposit USDT-TRC20',
      timestamp: bobDepTime,
    });

    // Notifications
    this.notifications.push({
      id: 'notif_001',
      userId: aliceUser.id,
      type: 'DEPOSIT',
      title: 'USDT Deposit Confirmed',
      message: 'Your deposit of 2,500.00 USDT (TRC-20) was successfully confirmed on-chain.',
      read: true,
      createdAt: depTime1,
    });
    this.notifications.push({
      id: 'notif_002',
      userId: aliceUser.id,
      type: 'DEPOSIT',
      title: 'USDT Deposit Confirmed',
      message: 'Your deposit of 1,200.00 USDT (ERC-20) has reached required 12 confirmations.',
      read: false,
      createdAt: depTime2,
    });

    // Seed KYC for Alice
    const aliceKYC: KYCApplication = {
      id: 'kyc_alice_001',
      userId: aliceUser.id,
      tier: 2,
      firstName: 'Alice',
      lastName: 'Vance',
      dateOfBirth: '1992-06-15',
      nationality: 'United Kingdom',
      idType: 'passport',
      idNumber: 'GB982173645',
      idFrontUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&q=80',
      proofOfAddressUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=600&q=80',
      selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80',
      status: 'APPROVED',
      submittedAt: aliceUser.createdAt,
      reviewedAt: new Date(Date.now() - 29 * 86400000).toISOString(),
      reviewedBy: adminUser.id,
    };
    this.kycApplications.set(aliceKYC.id, aliceKYC);

    // Seed initial Audit Log
    this.auditLogs.push({
      id: 'audit_001',
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'KYC_APPROVE_TIER_2',
      targetType: 'USER',
      targetId: aliceUser.id,
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 Chrome/122.0.0.0',
      previousValue: 'TIER_1',
      newValue: 'TIER_2_APPROVED',
      timestamp: aliceKYC.reviewedAt!,
    });

    // Seed Alice Keyring with standard derivation
    this.userKeyrings.set(aliceUser.id, {
      userId: aliceUser.id,
      encryptedVault: {
        iv: 'a1b2c3d4e5f60718293a4b5c',
        salt: '9f8e7d6c5b4a3928170f',
        ciphertext: 'e7a1b8c9d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
        tag: '1234567890abcdef1234567890abcdef',
      },
      mnemonicWordCount: 12,
      isBackedUp: true,
      addresses: {
        TRC20: aliceTronAddr.address,
        ERC20: aliceEthAddr.address,
        BEP20: aliceBscAddr.address,
        POLYGON: aliceEthAddr.address,
        SOLANA: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        BITCOIN: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      },
      createdAt: aliceUser.createdAt,
      lastBackedUpAt: aliceUser.createdAt,
    });

    // Seed Alice Active Staking Position (500 USDT in USDT Liquid Vault)
    const stakeStartTime = new Date(Date.now() - 3 * 86400000).toISOString();
    const aliceStakingPos: StakingPosition = {
      id: 'stk_alice_001',
      userId: aliceUser.id,
      poolId: 'pool_usdt_liquid',
      poolName: 'USDT Liquid Staking Vault',
      asset: 'USDT',
      network: 'TRC20',
      stakedAmount: 500.00,
      effectiveApy: 8.45,
      duration: 'FLEXIBLE',
      stakedAt: stakeStartTime,
      lastClaimedAt: stakeStartTime,
      accruedRewards: 0.347,
      totalClaimedRewards: 0,
      status: 'ACTIVE',
    };
    this.stakingPositions.set(aliceStakingPos.id, aliceStakingPos);

    // Pre-seed persistent sessions for instant valid access
    const aliceSession: Session = {
      id: 'sess_alice_seed',
      userId: aliceUser.id,
      token: 'tok_alice_demo_session_token_2026',
      ipAddress: '127.0.0.1',
      userAgent: 'TokenPocket Mobile Client',
      deviceType: 'Mobile',
      location: 'Authorized Region',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      isActive: true,
    };
    this.sessions.set(aliceSession.token, aliceSession);

    const adminSession: Session = {
      id: 'sess_admin_seed',
      userId: adminUser.id,
      token: 'tok_admin_demo_session_token_2026',
      ipAddress: '127.0.0.1',
      userAgent: 'Backoffice Workstation',
      deviceType: 'Desktop',
      location: 'HQ Security Ops',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      isActive: true,
    };
    this.sessions.set(adminSession.token, adminSession);

    const bobSession: Session = {
      id: 'sess_bob_seed',
      userId: bobUser.id,
      token: 'tok_bob_demo_session_token_2026',
      ipAddress: '127.0.0.1',
      userAgent: 'TokenPocket Mobile Client',
      deviceType: 'Mobile',
      location: 'Authorized Region',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      isActive: true,
    };
    this.sessions.set(bobSession.token, bobSession);
  }
}

export const db = new DatabaseStore();
