import React, { useState, useEffect } from 'react';
import { 
  ArrowDownLeft, ArrowUpRight, Send, ShieldCheck, 
  RefreshCw, Eye, EyeOff, ChevronRight, Copy, Check,
  QrCode, BookOpen, HelpCircle, Shield, Sparkles, 
  ArrowLeftRight, FileText, TrendingUp, Plus, Layers,
  Search, ExternalLink, Zap, ShieldAlert, CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TransactionItem, BlockchainNetwork } from '../types';
import { api } from '../lib/api';
import { AddTokenModal } from '../components/AddTokenModal';
import { StakingVaultModal } from '../components/StakingVaultModal';
import { CryptoIcon } from '../components/CryptoIcons';

export const DashboardView: React.FC = () => {
  const { 
    user, balance, formatCurrency, currency, refreshUserData, refreshBalance,
    setIsDepositModalOpen, setIsWithdrawModalOpen, 
    setIsTransferModalOpen, setIsReceiveModalOpen,
    setSelectedTxDetail, setActiveView, openQRScanner,
    setIsAddressBookOpen, setSelectedWithdrawalPrefill,
    triggerHaptic, activeNetwork, setActiveNetwork, setIsWalletDrawerOpen 
  } = useAuth();

  const [recentTransactions, setRecentTransactions] = useState<TransactionItem[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hideBalances, setHideBalances] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [activeTab, setActiveTab] = useState<'TOKENS' | 'DEFI' | 'ACTIVITY'>('TOKENS');
  const [txFilter, setTxFilter] = useState<'ALL' | 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER_IN' | 'TRANSFER_OUT'>('ALL');
  const [tokenSearch, setTokenSearch] = useState('');
  
  // Interactive Modals
  const [isAddTokenOpen, setIsAddTokenOpen] = useState(false);
  const [isStakingOpen, setIsStakingOpen] = useState(false);

  // Custom User Added Tokens
  const [customTokens, setCustomTokens] = useState<Array<{
    id: string;
    name: string;
    symbol: string;
    chainBadge: string;
    badgeBg: string;
    price: number;
    change24h: string;
    isPositive: boolean;
    balance: number;
    network: BlockchainNetwork;
  }>>([]);

  const currentAddress = activeNetwork === 'TRC20' 
    ? 'TXLaErHExepFdTnBsTXbvB6Nqh1mZ36Qz5' 
    : activeNetwork === 'ERC20' 
    ? '0x71C83638b1805847F4094572424294b0525287f3'
    : '0x55d398326f99059fF775485246999027B3197955';

  const fetchRecentTx = async () => {
    setIsLoadingTx(true);
    try {
      const [res, tokenRes] = await Promise.all([
        api.getTransactions({ limit: 10 }),
        api.getTokens().catch(() => ({ tokens: [] })),
      ]);
      setRecentTransactions(res.transactions);
      if (tokenRes && tokenRes.tokens) {
        setCustomTokens(
          tokenRes.tokens.map((tok: any) => ({
            id: tok.id || `custom-${tok.symbol.toLowerCase()}-${tok.network || tok.chain}`,
            name: tok.name,
            symbol: tok.symbol,
            chainBadge: tok.network || tok.chain,
            badgeBg:
              (tok.network || tok.chain) === 'TRC20'
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : (tok.network || tok.chain) === 'ERC20'
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            price: tok.symbol === 'USDC' || tok.symbol === 'DAI' || tok.symbol === 'BUSD' ? 1.0 : 0.85,
            change24h: '+0.01%',
            isPositive: true,
            balance: 0.0,
            network: (tok.network || tok.chain) as BlockchainNetwork,
          }))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingTx(false);
    }
  };

  useEffect(() => {
    fetchRecentTx();
  }, []);

  const totalBal = balance?.totalBalance || 0;
  const availBal = balance?.availableBalance || 0;

  const handleManualRefresh = async () => {
    triggerHaptic();
    setIsRefreshing(true);
    await Promise.all([refreshBalance(), fetchRecentTx()]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleCopyAddress = () => {
    triggerHaptic();
    navigator.clipboard.writeText(currentAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleQuickSend = (net?: BlockchainNetwork) => {
    triggerHaptic();
    if (net) {
      setSelectedWithdrawalPrefill({ network: net });
    }
    setIsWithdrawModalOpen(true);
  };

  const handleQuickReceive = () => {
    triggerHaptic();
    setActiveView('receive');
  };

  const handleAddTokenSuccess = (token: { symbol: string; name: string; chain: BlockchainNetwork; contract: string; decimals: number }) => {
    setCustomTokens((prev) => [
      ...prev,
      {
        id: `custom-${token.symbol.toLowerCase()}-${token.chain}`,
        name: token.name,
        symbol: token.symbol,
        chainBadge: token.chain,
        badgeBg: token.chain === 'TRC20' ? 'bg-red-500/10 text-red-400 border-red-500/20' : token.chain === 'ERC20' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        price: token.symbol === 'USDC' || token.symbol === 'DAI' || token.symbol === 'BUSD' ? 1.00 : 0.85,
        change24h: '+0.01%',
        isPositive: true,
        balance: 0.00,
        network: token.chain,
      }
    ]);
  };

  const baseTokenList = [
    {
      id: 'usdt-trc20',
      name: 'Tether USD',
      symbol: 'USDT',
      chainBadge: 'TRC20',
      badgeBg: 'bg-red-500/10 text-red-400 border-red-500/20',
      price: 1.00,
      change24h: '+0.01%',
      isPositive: true,
      balance: totalBal,
      network: 'TRC20' as BlockchainNetwork,
    },
    {
      id: 'usdt-erc20',
      name: 'Tether USD',
      symbol: 'USDT',
      chainBadge: 'ERC20',
      badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      price: 1.00,
      change24h: '+0.00%',
      isPositive: true,
      balance: totalBal,
      network: 'ERC20' as BlockchainNetwork,
    },
    {
      id: 'usdt-bep20',
      name: 'Tether USD',
      symbol: 'USDT',
      chainBadge: 'BEP20',
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      price: 1.00,
      change24h: '+0.02%',
      isPositive: true,
      balance: totalBal,
      network: 'BEP20' as BlockchainNetwork,
    },
    {
      id: 'trx-gas',
      name: 'TRON Gas',
      symbol: 'TRX',
      chainBadge: 'Gas',
      badgeBg: 'bg-red-500/10 text-red-400 border-red-500/20',
      price: 0.245,
      change24h: '+4.62%',
      isPositive: true,
      balance: 1250.00,
      network: 'TRC20' as BlockchainNetwork,
    },
    {
      id: 'eth-gas',
      name: 'Ethereum Gas',
      symbol: 'ETH',
      chainBadge: 'Gas',
      badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      price: 2745.20,
      change24h: '-1.15%',
      isPositive: false,
      balance: 0.154,
      network: 'ERC20' as BlockchainNetwork,
    },
    {
      id: 'bnb-gas',
      name: 'BNB Gas',
      symbol: 'BNB',
      chainBadge: 'Gas',
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      price: 668.40,
      change24h: '+1.45%',
      isPositive: true,
      balance: 0.85,
      network: 'BEP20' as BlockchainNetwork,
    },
    ...customTokens,
  ];

  const filteredTokens = baseTokenList.filter((tok) => {
    if (!tokenSearch.trim()) return true;
    return (
      tok.symbol.toLowerCase().includes(tokenSearch.toLowerCase()) ||
      tok.name.toLowerCase().includes(tokenSearch.toLowerCase()) ||
      tok.chainBadge.toLowerCase().includes(tokenSearch.toLowerCase())
    );
  });

  const filteredTx = recentTransactions.filter((tx) => {
    if (txFilter === 'ALL') return true;
    return tx.type === txFilter;
  });

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* Network Quick Switch Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
        <div className="flex items-center gap-1.5">
          {(['TRC20', 'ERC20', 'BEP20'] as const).map((net) => (
            <button
              key={net}
              type="button"
              onClick={() => {
                triggerHaptic();
                setActiveNetwork(net);
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                activeNetwork === net
                  ? 'bg-[#2980fe] text-white shadow-md shadow-blue-500/20'
                  : 'bg-white text-[#4b5563] border border-[#e5e7eb] hover:text-[#1e2024]'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${net === 'TRC20' ? 'bg-red-500' : net === 'ERC20' ? 'bg-blue-500' : 'bg-amber-500'}`} />
              <span>{net}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleManualRefresh}
          className="p-1.5 rounded-xl bg-white border border-[#e5e7eb] text-[#4b5563] hover:text-[#2980fe] transition-colors shrink-0 shadow-xs"
          title="Refresh On-Chain State"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-[#2980fe]' : ''}`} />
        </button>
      </div>

      {/* 2FA / KYC Security Upgrade Notification (if missing) */}
      {user && (!user.twoFactorEnabled || user.kycTier === 0) && (
        <div className="rounded-2xl border border-[#bfdbfe] bg-gradient-to-r from-[#eff6ff] to-[#f0fdf4] p-3 text-xs text-[#1e40af] flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="p-1.5 rounded-xl bg-[#2980fe]/10 text-[#2980fe] shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[#1e2024] text-xs truncate">
                {!user.twoFactorEnabled ? 'Activate 2FA Protection' : 'Complete KYC Verification'}
              </p>
              <p className="text-[10px] text-[#6b7280] truncate">
                {!user.twoFactorEnabled ? 'Secure your vault with Google Authenticator' : 'Unlock daily withdrawal limits'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic();
              setActiveView(!user.twoFactorEnabled ? 'security' : 'kyc');
            }}
            className="px-3 py-1.5 rounded-xl bg-[#2980fe] hover:bg-[#1e58e6] text-white font-bold text-xs shrink-0 transition-colors shadow-xs"
          >
            {!user.twoFactorEnabled ? 'Enable' : 'Verify'}
          </button>
        </div>
      )}

      {/* Main TokenPocket Signature Gradient Card */}
      <div className="relative overflow-hidden rounded-3xl border border-[#2980fe]/40 bg-gradient-to-tr from-[#1E5BF0] via-[#2F74FF] to-[#60A5FA] p-5 shadow-[0_12px_30px_rgba(37,99,235,0.28)] text-white">
        {/* Subtle decorative mesh background glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-44 w-44 rounded-full bg-white/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-44 w-44 rounded-full bg-blue-900/20 blur-3xl pointer-events-none" />

        {/* Top Row: Network and Address with Copy */}
        <div className="flex items-center justify-between mb-3 relative z-10">
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setIsWalletDrawerOpen(true);
            }}
            className="flex items-center space-x-1.5 bg-black/15 hover:bg-black/25 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold text-white border border-white/20"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#34d399] animate-pulse" />
            <span>{activeNetwork} Multi-Chain Vault</span>
            <ChevronRight className="h-3 w-3 text-blue-100" />
          </button>

          <button
            type="button"
            onClick={handleCopyAddress}
            className="flex items-center space-x-1 bg-black/15 hover:bg-black/25 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono text-white border border-white/20"
            title="Copy Wallet Address"
          >
            <span>{currentAddress.slice(0, 5)}...{currentAddress.slice(-4)}</span>
            {copiedAddress ? <Check className="h-3 w-3 text-[#34d399]" /> : <Copy className="h-3 w-3 text-blue-100" />}
          </button>
        </div>

        {/* Balance Row */}
        <div className="space-y-1 relative z-10">
          <div className="flex items-center space-x-2 text-blue-100 text-xs font-medium">
            <span>Total Assets (USDT)</span>
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setHideBalances(!hideBalances);
              }}
              className="text-blue-100 hover:text-white p-0.5"
            >
              {hideBalances ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>

          <div className="flex items-baseline space-x-2">
            <span className="font-mono text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm">
              {hideBalances ? '••••••••' : totalBal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm font-bold text-blue-100 font-sans">USDT</span>
          </div>

          <div className="flex items-center space-x-3 text-xs text-blue-100/90 font-mono pt-0.5 font-medium">
            <span>≈ {hideBalances ? '••••' : formatCurrency(totalBal)}</span>
            <span>•</span>
            <span className="text-[#a7f3d0]">
              {hideBalances ? '••••' : availBal.toFixed(2)} Available
            </span>
          </div>
        </div>

        {/* 4 Signature Action Buttons (Transfer, Receive, Flash Swap, Details) */}
        <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-white/20 relative z-10">
          {/* Transfer (转账) */}
          <button
            type="button"
            onClick={() => handleQuickSend()}
            className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white transition-all group active:scale-95 border border-white/20"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/25 text-white mb-1 group-hover:scale-105 transition-transform shadow-xs">
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-bold tracking-tight">Transfer</span>
          </button>

          {/* Receive (收款) */}
          <button
            type="button"
            onClick={handleQuickReceive}
            className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white transition-all group active:scale-95 border border-white/20"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/25 text-white mb-1 group-hover:scale-105 transition-transform shadow-xs">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-bold tracking-tight">Receive</span>
          </button>

          {/* Flash Swap (闪兑) */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveView('markets');
            }}
            className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white transition-all group active:scale-95 border border-white/20"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/25 text-white mb-1 group-hover:scale-105 transition-transform shadow-xs">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-bold tracking-tight">Swap</span>
          </button>

          {/* Ledger / Details (账单) */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveView('transactions');
            }}
            className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white transition-all group active:scale-95 border border-white/20"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/25 text-white mb-1 group-hover:scale-105 transition-transform shadow-xs">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-bold tracking-tight">Ledger</span>
          </button>
        </div>
      </div>

      {/* Quick Tools Shortcuts Row */}
      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            openQRScanner();
          }}
          className="p-2.5 rounded-2xl bg-white border border-[#e5e7eb] hover:border-[#2980fe]/40 text-center transition-colors flex flex-col items-center shadow-xs"
        >
          <QrCode className="h-4 w-4 text-[#2980fe] mb-1" />
          <span className="text-[10px] font-bold text-[#1e2024]">Scan QR</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setIsAddressBookOpen(true);
          }}
          className="p-2.5 rounded-2xl bg-white border border-[#e5e7eb] hover:border-[#2980fe]/40 text-center transition-colors flex flex-col items-center shadow-xs"
        >
          <BookOpen className="h-4 w-4 text-[#03b875] mb-1" />
          <span className="text-[10px] font-bold text-[#1e2024]">Address Book</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setIsStakingOpen(true);
          }}
          className="p-2.5 rounded-2xl bg-white border border-[#e5e7eb] hover:border-[#2980fe]/40 text-center transition-colors flex flex-col items-center shadow-xs"
        >
          <TrendingUp className="h-4 w-4 text-[#f59e0b] mb-1" />
          <span className="text-[10px] font-bold text-[#1e2024]">DeFi Yield</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setActiveView('support');
          }}
          className="p-2.5 rounded-2xl bg-white border border-[#e5e7eb] hover:border-[#2980fe]/40 text-center transition-colors flex flex-col items-center shadow-xs"
        >
          <HelpCircle className="h-4 w-4 text-[#0d9488] mb-1" />
          <span className="text-[10px] font-bold text-[#1e2024]">24/7 Desk</span>
        </button>
      </div>

      {/* Main Tab Segment: Tokens (资产) vs DeFi (收益) vs Activity (账单) */}
      <div className="space-y-3">
        <div className="flex border-b border-[#e5e7eb] px-1 gap-6">
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveTab('TOKENS');
            }}
            className={`pb-2.5 text-xs font-bold transition-all relative ${
              activeTab === 'TOKENS' ? 'text-[#2980fe]' : 'text-[#8a93a6] hover:text-[#1e2024]'
            }`}
          >
            <span>Assets ({filteredTokens.length})</span>
            {activeTab === 'TOKENS' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2980fe] rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveTab('DEFI');
            }}
            className={`pb-2.5 text-xs font-bold transition-all relative ${
              activeTab === 'DEFI' ? 'text-[#2980fe]' : 'text-[#8a93a6] hover:text-[#1e2024]'
            }`}
          >
            <span>Yield & Vaults</span>
            {activeTab === 'DEFI' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2980fe] rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveTab('ACTIVITY');
            }}
            className={`pb-2.5 text-xs font-bold transition-all relative ${
              activeTab === 'ACTIVITY' ? 'text-[#2980fe]' : 'text-[#8a93a6] hover:text-[#1e2024]'
            }`}
          >
            <span>Recent Activity</span>
            {activeTab === 'ACTIVITY' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2980fe] rounded-full" />
            )}
          </button>
        </div>

        {/* TAB 1: TOKENS LIST */}
        {activeTab === 'TOKENS' && (
          <div className="space-y-2.5">
            {/* Search and Add Token Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#9ca3af]" />
                <input
                  type="text"
                  value={tokenSearch}
                  onChange={(e) => setTokenSearch(e.target.value)}
                  placeholder="Filter assets (USDT, TRX, ETH...)"
                  className="w-full bg-white border border-[#e5e7eb] rounded-2xl pl-8 pr-3 py-1.5 text-xs text-[#1e2024] placeholder-[#9ca3af] focus:border-[#2980fe] focus:outline-none shadow-xs"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setIsAddTokenOpen(true);
                }}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-[#e5e7eb] text-[#2980fe] font-bold text-xs rounded-2xl flex items-center gap-1 transition-colors shrink-0 shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Token</span>
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-[#e5e7eb] divide-y divide-[#f5f6f8] overflow-hidden shadow-sm">
              {filteredTokens.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#8a93a6]">
                  No matching crypto assets found.
                </div>
              ) : (
                filteredTokens.map((token) => (
                  <div
                    key={token.id}
                    onClick={() => {
                      triggerHaptic();
                      handleQuickSend(token.network);
                    }}
                    className="p-3.5 flex items-center justify-between hover:bg-[#f7f8fa] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center space-x-3">
                      <CryptoIcon symbol={token.symbol} size={40} />
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-xs text-[#1e2024] group-hover:text-[#2980fe] transition-colors">{token.symbol}</span>
                          <span className="text-[10px] font-mono text-[#8a93a6] px-1.5 py-0.5 bg-slate-100 rounded-md font-bold">{token.chainBadge}</span>
                        </div>
                        <p className="text-[10px] text-[#8a93a6] font-mono mt-0.5">
                          ${token.price.toFixed(token.price < 1 ? 4 : 2)}{' '}
                          <span className={token.isPositive ? 'text-[#03b875]' : 'text-[#f5465c]'}>
                            {token.change24h}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-xs font-bold text-[#1e2024] block">
                        {hideBalances ? '••••' : token.balance.toFixed(2)} {token.symbol}
                      </span>
                      <span className="text-[10px] text-[#8a93a6] block">
                        ≈ {hideBalances ? '••••' : formatCurrency(token.balance * token.price)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DEFI & VAULT YIELD */}
        {activeTab === 'DEFI' && (
          <div className="space-y-2.5">
            <div className="bg-white rounded-3xl border border-[#e5e7eb] p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#03b875]/10 text-[#03b875] border border-[#03b875]/20 font-bold text-xs">
                    APR
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1e2024]">USDT Liquid Staking Vault</h4>
                    <p className="text-[10px] text-[#8a93a6]">Institutional MPC backing with zero lockup</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-black text-[#03b875] bg-[#03b875]/10 px-2 py-0.5 rounded-full border border-[#03b875]/20">
                  +8.45% APY
                </span>
              </div>

              <div className="flex items-center justify-between bg-[#f7f8fa] p-2.5 rounded-2xl border border-[#e5e7eb] text-xs">
                <span className="text-[#8a93a6]">Vault TVL:</span>
                <span className="font-mono font-bold text-[#1e2024]">48,290,000 USDT</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setIsStakingOpen(true);
                }}
                className="w-full py-2.5 bg-[#03b875] hover:bg-[#029e64] text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Stake USDT & Earn Daily Yield</span>
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-[#e5e7eb] p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2980fe]/10 text-[#2980fe] border border-[#2980fe]/20 font-bold text-xs">
                    TRON
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1e2024]">TRON Energy Rental Staking</h4>
                    <p className="text-[10px] text-[#8a93a6]">Earn daily TRX rental fees from TRC20 volume</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-black text-[#2980fe] bg-[#2980fe]/10 px-2 py-0.5 rounded-full border border-[#2980fe]/20">
                  +12.20% APR
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setIsStakingOpen(true);
                }}
                className="w-full py-2.5 bg-[#2980fe] hover:bg-[#1e58e6] text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
              >
                <Zap className="h-4 w-4" />
                <span>Rent TRON Energy (Save Gas)</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: RECENT ACTIVITY */}
        {activeTab === 'ACTIVITY' && (
          <div className="space-y-2">
            {/* Filter Chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {(['ALL', 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    setTxFilter(filter);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition-all ${
                    txFilter === filter
                      ? 'bg-[#2980fe] text-white shadow-xs'
                      : 'bg-white text-[#6b7280] border border-[#e5e7eb]'
                  }`}
                >
                  {filter === 'ALL' ? 'All' : filter === 'DEPOSIT' ? 'Deposits' : filter === 'WITHDRAWAL' ? 'Withdrawals' : filter.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredTx.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#e5e7eb] p-8 text-center text-xs text-[#8a93a6]">
                  {isLoadingTx ? 'Loading ledger events...' : 'No transactions recorded yet'}
                </div>
              ) : (
                filteredTx.map((tx) => {
                  const isPositive = tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_IN';
                  return (
                    <div
                      key={tx.id}
                      onClick={() => {
                        triggerHaptic();
                        setSelectedTxDetail(tx);
                      }}
                      className="bg-white rounded-2xl border border-[#e5e7eb] p-3.5 flex items-center justify-between hover:border-[#2980fe]/40 transition-all cursor-pointer shadow-xs group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-xs ${
                          isPositive
                            ? 'bg-[#03b875]/10 text-[#03b875]'
                            : 'bg-[#2980fe]/10 text-[#2980fe]'
                        }`}>
                          {tx.type === 'DEPOSIT' ? (
                            <ArrowDownLeft className="h-4 w-4" />
                          ) : tx.type === 'WITHDRAWAL' ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#1e2024] group-hover:text-[#2980fe] transition-colors">
                            {tx.type.replace('_', ' ')}
                          </h4>
                          <p className="text-[10px] text-[#8a93a6] font-mono">
                            {tx.network} • {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <span className={`text-xs font-bold block ${isPositive ? 'text-[#03b875]' : 'text-[#1e2024]'}`}>
                          {isPositive ? '+' : '-'}{tx.amount.toFixed(2)} USDT
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block mt-0.5 ${
                          tx.status === 'COMPLETED' || tx.status === 'APPROVED' || tx.status === 'CONFIRMED'
                            ? 'bg-[#03b875]/10 text-[#03b875]'
                            : tx.status === 'PENDING' || tx.status === 'CONFIRMING' || tx.status === 'PENDING_REVIEW'
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-[#f5465c]/10 text-[#f5465c]'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Token Modal */}
      <AddTokenModal
        isOpen={isAddTokenOpen}
        onClose={() => setIsAddTokenOpen(false)}
        onAddToken={handleAddTokenSuccess}
      />

      {/* Staking Vault Modal */}
      <StakingVaultModal
        isOpen={isStakingOpen}
        onClose={() => setIsStakingOpen(false)}
      />
    </div>
  );
};
