import {
  User, UserBalance, NetworkConfig, TransactionItem,
  NotificationItem, UserSession, KYCApplication, AdminMetrics,
  AuditLog, ReconciliationSummary, BlockchainNetwork,
  UserKeyringInfo, StakingOverview, StakingPosition, SwapQuote, SwapRecord, CustomToken
} from '../types';

const TOKEN_KEY = 'usdt_vault_token';
const LOGGED_OUT_KEY = 'usdt_vault_logged_out';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) return token;
  // If user hasn't explicitly clicked logout, default to Alice's active demo session for instant live usability
  if (localStorage.getItem(LOGGED_OUT_KEY) !== 'true') {
    const demoToken = 'tok_alice_demo_session_token_2026';
    localStorage.setItem(TOKEN_KEY, demoToken);
    return demoToken;
  }
  return null;
}

export function setStoredToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOGGED_OUT_KEY);
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOGGED_OUT_KEY, 'true');
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({ success: false, error: 'Malformed response' }));

  if (!response.ok || data.success === false) {
    if (response.status === 401) {
      removeStoredToken();
    }
    throw new Error(data.error || 'Network request failed');
  }

  return data;
}

export const api = {
  // Auth
  register: (payload: { email: string; password: string; firstName: string; lastName: string }) =>
    request<{ success: boolean; token: string; user: User; balance: UserBalance }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string; totpCode?: string }) =>
    request<{ success: boolean; token?: string; user?: User; balance?: UserBalance; requireTwoFactor?: boolean; message?: string }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  logout: () =>
    request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),

  getMe: () =>
    request<{ success: boolean; user: User; balance: UserBalance; unreadNotifications: number }>('/api/auth/me'),

  setup2FA: () =>
    request<{ success: boolean; secret: string; qrDataUrl: string; backupCodes: string[] }>('/api/auth/2fa/setup', {
      method: 'POST',
    }),

  enable2FA: (totpCode: string) =>
    request<{ success: boolean; user: User; message: string }>('/api/auth/2fa/enable', {
      method: 'POST',
      body: JSON.stringify({ totpCode }),
    }),

  disable2FA: (payload: { totpCode: string; password: string }) =>
    request<{ success: boolean; user: User; message: string }>('/api/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  setAntiPhishing: (phrase: string) =>
    request<{ success: boolean; antiPhishingCode: string; message: string }>('/api/auth/anti-phishing', {
      method: 'POST',
      body: JSON.stringify({ phrase }),
    }),

  getSessions: () =>
    request<{ success: boolean; sessions: UserSession[] }>('/api/auth/sessions'),

  revokeSession: (sessionId?: string, revokeAllOthers?: boolean) =>
    request<{ success: boolean; message: string }>('/api/auth/sessions/revoke', {
      method: 'POST',
      body: JSON.stringify({ sessionId, revokeAllOthers }),
    }),

  changePassword: (payload: { currentPassword: string; newPassword: string; totpCode?: string }) =>
    request<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Wallet Core & Keyring
  getKeyring: () =>
    request<UserKeyringInfo & { success: boolean }>('/api/wallet/keyring'),

  createKeyring: (password: string) =>
    request<{
      success: boolean;
      mnemonic: string[];
      mnemonicString: string;
      addresses: Record<string, string>;
      message: string;
    }>('/api/wallet/create-keyring', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  importKeyring: (payload: { importType: 'MNEMONIC' | 'PRIVATE_KEY'; secretInput: string; password: string }) =>
    request<{
      success: boolean;
      addresses: Record<string, string>;
      message: string;
    }>('/api/wallet/import-keyring', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyBackup: (payload: { answers: { index: number; word: string }[]; password: string }) =>
    request<{ success: boolean; message: string }>('/api/wallet/verify-backup', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  exportKeyring: (password: string) =>
    request<{
      success: boolean;
      mnemonic?: string;
      evmPrivateKey: string;
      tronPrivateKey: string;
      addresses: Record<string, string>;
    }>('/api/wallet/export-keyring', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  // Wallet Balances & Networks
  getBalance: () =>
    request<{ success: boolean; balance: UserBalance }>('/api/wallet/balance'),

  getNetworks: () =>
    request<{ success: boolean; networks: NetworkConfig[] }>('/api/wallet/networks'),

  getAddress: (network: BlockchainNetwork) =>
    request<{
      success: boolean;
      networkConfig: NetworkConfig;
      address: string;
      derivationPath: string;
      qrDataUrl: string;
      createdAt: string;
    }>(`/api/wallet/address/${network}`),

  simulateDeposit: (payload: { network: BlockchainNetwork; amount: number; fromAddress?: string; customTxHash?: string }) =>
    request<{ success: boolean; message: string; deposit: unknown }>('/api/wallet/deposit/simulate-testnet', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  withdraw: (payload: { network: BlockchainNetwork; destinationAddress: string; amount: number; totpCode?: string }) =>
    request<{ success: boolean; message: string; withdrawal: unknown; balance: UserBalance }>('/api/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  transfer: (payload: { recipientEmail: string; amount: number; note?: string; totpCode?: string }) =>
    request<{ success: boolean; message: string; transfer: unknown; balance: UserBalance }>('/api/wallet/transfer', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Swap DEX
  getSwapQuote: (params: { fromAsset: string; toAsset: string; fromAmount: number; slippageTolerance?: number }) => {
    const query = new URLSearchParams({
      fromAsset: params.fromAsset,
      toAsset: params.toAsset,
      fromAmount: params.fromAmount.toString(),
      ...(params.slippageTolerance !== undefined ? { slippageTolerance: params.slippageTolerance.toString() } : {}),
    });
    return request<{ success: boolean; quote: SwapQuote }>(`/api/wallet/swap/quote?${query.toString()}`);
  },

  executeSwap: (payload: {
    fromAsset: string;
    toAsset: string;
    fromAmount: number;
    minReceived: number;
    slippageTolerance: number;
  }) =>
    request<{ success: boolean; message: string; swapRecord: SwapRecord; balance: UserBalance }>('/api/wallet/swap/execute', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Staking
  getStakingOverview: () =>
    request<{ success: boolean } & StakingOverview>('/api/wallet/staking/overview'),

  stake: (payload: { poolId: string; amount: number; duration: 'FLEXIBLE' | '30D' | '90D' }) =>
    request<{ success: boolean; message: string; position: StakingPosition; balance: UserBalance }>('/api/wallet/staking/stake', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  claimStakingRewards: (positionId: string) =>
    request<{ success: boolean; claimedAmount: number; message: string; balance: UserBalance }>('/api/wallet/staking/claim', {
      method: 'POST',
      body: JSON.stringify({ positionId }),
    }),

  unstake: (positionId: string) =>
    request<{ success: boolean; unstakedAmount: number; message: string; balance: UserBalance }>('/api/wallet/staking/unstake', {
      method: 'POST',
      body: JSON.stringify({ positionId }),
    }),

  // Custom Tokens
  getTokens: () =>
    request<{ success: boolean; tokens: CustomToken[] }>('/api/wallet/tokens'),

  queryContract: (contractAddress: string, network: BlockchainNetwork) =>
    request<{ success: boolean; tokenInfo: { symbol: string; name: string; decimals: number; isVerified: boolean } }>(
      '/api/wallet/token/query-contract',
      {
        method: 'POST',
        body: JSON.stringify({ contractAddress, network }),
      }
    ),

  addCustomToken: (contractAddress: string, network: BlockchainNetwork) =>
    request<{ success: boolean; token: CustomToken; message: string }>('/api/wallet/token/add-custom', {
      method: 'POST',
      body: JSON.stringify({ contractAddress, network }),
    }),

  getTransactions: (params?: { type?: string; network?: string; search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.type) query.append('type', params.type);
    if (params?.network) query.append('network', params.network);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    return request<{
      success: boolean;
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      transactions: TransactionItem[];
    }>(`/api/wallet/transactions?${query.toString()}`);
  },

  getNotifications: () =>
    request<{ success: boolean; notifications: NotificationItem[] }>('/api/wallet/notifications'),

  markNotificationsRead: (notificationId?: string) =>
    request<{ success: boolean }>('/api/wallet/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ notificationId }),
    }),

  // KYC
  getKYCStatus: () =>
    request<{
      success: boolean;
      kycTier: number;
      kycStatus: string;
      latestApplication: KYCApplication | null;
      history: KYCApplication[];
    }>('/api/kyc/status'),

  submitKYC: (payload: Partial<KYCApplication>) =>
    request<{ success: boolean; message: string; application: KYCApplication }>('/api/kyc/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Admin
  getAdminMetrics: () =>
    request<{ success: boolean; metrics: AdminMetrics }>('/api/admin/metrics'),

  getAdminUsers: (search?: string) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<{ success: boolean; users: (User & { balance: UserBalance })[] }>(`/api/admin/users${query}`);
  },

  freezeUser: (userId: string, reason?: string) =>
    request<{ success: boolean; message: string; isFrozen: boolean }>(`/api/admin/users/${userId}/freeze`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  getAdminWithdrawals: (status?: string) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return request<{ success: boolean; withdrawals: (TransactionItem & { userEmail: string; riskScore: number; requiresAdminApproval: boolean })[] }>(
      `/api/admin/withdrawals${query}`
    );
  },

  approveWithdrawal: (id: string) =>
    request<{ success: boolean; message: string; txHash: string }>(`/api/admin/withdrawals/${id}/approve`, {
      method: 'POST',
    }),

  rejectWithdrawal: (id: string, reason: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/withdrawals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  getAdminDeposits: () =>
    request<{ success: boolean; deposits: unknown[] }>('/api/admin/deposits'),

  getAdminKYC: () =>
    request<{ success: boolean; applications: KYCApplication[] }>('/api/admin/kyc'),

  reviewKYC: (id: string, action: 'APPROVE' | 'REJECT' | 'RESUBMIT', reason?: string) =>
    request<{ success: boolean; userKycTier: number; userKycStatus: string }>(`/api/admin/kyc/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, reason }),
    }),

  getAdminLedger: (params?: { userId?: string; type?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.userId) query.append('userId', params.userId);
    if (params?.type) query.append('type', params.type);
    if (params?.limit) query.append('limit', params.limit.toString());
    return request<{ success: boolean; total: number; entries: unknown[] }>(`/api/admin/ledger?${query.toString()}`);
  },

  adjustUserBalance: (payload: { userId: string; type: 'CREDIT' | 'DEBIT'; amount: number; reason: string }) =>
    request<{ success: boolean; message: string; balance: UserBalance }>('/api/admin/adjust-balance', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getAdminReconciliation: () =>
    request<{ success: boolean; history: ReconciliationSummary[]; latest: ReconciliationSummary | null }>('/api/admin/reconciliation'),

  runAdminReconciliation: () =>
    request<{ success: boolean; summary: ReconciliationSummary }>('/api/admin/reconciliation/run', {
      method: 'POST',
    }),

  getAdminAuditLogs: () =>
    request<{ success: boolean; logs: AuditLog[] }>('/api/admin/audit-logs'),

  // Binance Real Gateway APIs
  getBinanceTickers: () =>
    request<{ success: boolean; source: string; tickers: any[]; timestamp: number }>('/api/wallet/binance/tickers'),

  getBinanceDepth: (symbol?: string, limit?: number) => {
    const query = new URLSearchParams();
    if (symbol) query.append('symbol', symbol);
    if (limit) query.append('limit', limit.toString());
    return request<{ success: boolean; symbol: string; depth: { bids: [string, string][]; asks: [string, string][] } }>(
      `/api/wallet/binance/depth?${query.toString()}`
    );
  },

  getBinanceStatus: () =>
    request<{ success: boolean; account: any }>('/api/wallet/binance/status'),

  connectBinance: (payload: { apiKey: string; secretKey?: string; isTestnet?: boolean }) =>
    request<{ success: boolean; message: string }>('/api/wallet/binance/connect', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  disconnectBinance: () =>
    request<{ success: boolean; message: string }>('/api/wallet/binance/disconnect', {
      method: 'POST',
    }),

  transferBinance: (payload: { amount: number; direction: 'TO_VAULT' | 'TO_BINANCE' }) =>
    request<{ success: boolean; direction: string; amount: number; txHash: string; message: string }>('/api/wallet/binance/transfer', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

