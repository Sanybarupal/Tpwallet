import React, { useState } from 'react';
import { 
  X, Check, Plus, Copy, ExternalLink, ShieldCheck, 
  Key, RefreshCw, Layers, ArrowRight, ShieldAlert, Sparkles,
  Wallet, ChevronRight, Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BlockchainNetwork } from '../types';
import { CryptoIcon } from './CryptoIcons';

interface ChainItem {
  id: BlockchainNetwork | 'POLYGON' | 'SOLANA' | 'BITCOIN';
  name: string;
  symbol: string;
  badge: string;
  standard: string;
  addressPrefix: string;
}

const CHAINS: ChainItem[] = [
  {
    id: 'TRC20',
    name: 'TRON (TRC20)',
    symbol: 'TRX',
    badge: 'TRON',
    standard: 'TRC-20',
    addressPrefix: 'T',
  },
  {
    id: 'ERC20',
    name: 'Ethereum (ERC20)',
    symbol: 'ETH',
    badge: 'ETH',
    standard: 'ERC-20',
    addressPrefix: '0x',
  },
  {
    id: 'BEP20',
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    badge: 'BSC',
    standard: 'BEP-20',
    addressPrefix: '0x',
  },
  {
    id: 'POLYGON',
    name: 'Polygon PoS',
    symbol: 'POL',
    badge: 'POL',
    standard: 'Polygon-ERC20',
    addressPrefix: '0x',
  },
  {
    id: 'SOLANA',
    name: 'Solana Network',
    symbol: 'SOL',
    badge: 'SOL',
    standard: 'SPL-USDT',
    addressPrefix: 'EPjF',
  },
  {
    id: 'BITCOIN',
    name: 'Bitcoin Omni / Layer',
    symbol: 'BTC',
    badge: 'BTC',
    standard: 'Omni-USDT',
    addressPrefix: '1',
  },
];

export const MultiChainWalletDrawer: React.FC = () => {
  const { 
    user, balance, formatCurrency, 
    isWalletDrawerOpen, setIsWalletDrawerOpen,
    activeNetwork, setActiveNetwork, triggerHaptic,
    setIsDepositModalOpen, setIsWithdrawModalOpen,
    setActiveView
  } = useAuth();

  const [selectedChainId, setSelectedChainId] = useState<string>('TRC20');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddWalletModal, setShowAddWalletModal] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isWalletDrawerOpen) return null;

  const totalBal = balance?.totalBalance || 0;

  const handleCopy = (text: string, id: string) => {
    triggerHaptic();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelectNetwork = (net: BlockchainNetwork) => {
    triggerHaptic();
    setActiveNetwork(net);
  };

  // Mock wallet accounts for the selected chain to match TokenPocket's multi-account UX
  const walletAccounts = [
    {
      id: 'w1',
      name: `${user?.firstName || 'User'}'s Main Vault #01`,
      address: selectedChainId === 'TRC20' 
        ? 'TXLaErHExepFdTnBsTXbvB6Nqh1mZ36Qz5' 
        : selectedChainId === 'ERC20' 
        ? '0x71C83638b1805847F4094572424294b0525287f3'
        : '0x55d398326f99059fF775485246999027B3197955',
      balance: totalBal,
      isDefault: true,
      tag: 'MPC Multi-Sig Active',
    },
    {
      id: 'w2',
      name: 'Trading & Arbitrage Vault #02',
      address: selectedChainId === 'TRC20' 
        ? 'TLyqzVGLV1srkB7dToTAnYgWxNDP6UeW5g' 
        : '0x8894E0a0c962CB723c1976a4421c95949bE2D4E3',
      balance: 0.0,
      isDefault: false,
      tag: 'Cold Isolation',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex select-none animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-xs"
        onClick={() => setIsWalletDrawerOpen(false)}
      />

      {/* Left-Right Split Drawer (Authentic TokenPocket APK Layout) */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#10141f] border-r border-[#e5e7eb] dark:border-[#1e2433] shadow-2xl flex flex-col h-full z-10 text-[#1e2024] dark:text-white">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#e5e7eb] dark:border-[#1e2433] flex items-center justify-between bg-white dark:bg-[#121620]">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 text-[#2980fe] dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
              <Wallet className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-[#1e2024] dark:text-white">Multi-Chain Wallet Manager</h2>
              <p className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] font-mono">TokenPocket HD Keyring</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsWalletDrawerOpen(false)}
            className="p-1.5 rounded-xl bg-[#f7f8fa] dark:bg-[#182030] text-[#6b7280] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white border border-[#e5e7eb] dark:border-[#1e2433] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Left Chain Rail + Right Account List Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Rail: Blockchain Networks */}
          <div className="w-20 bg-[#f7f8fa] dark:bg-[#0b0e14] border-r border-[#e5e7eb] dark:border-[#1e2433] flex flex-col items-center py-3 gap-3 overflow-y-auto no-scrollbar">
            {CHAINS.map((chain) => {
              const isSelected = selectedChainId === chain.id;
              return (
                <button
                  key={chain.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    setSelectedChainId(chain.id);
                    if (chain.id === 'TRC20' || chain.id === 'ERC20' || chain.id === 'BEP20') {
                      handleSelectNetwork(chain.id as BlockchainNetwork);
                    }
                  }}
                  className={`relative flex flex-col items-center p-2 rounded-2xl transition-all w-16 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/40 text-[#2980fe] dark:text-white shadow-xs'
                      : 'hover:bg-white dark:hover:bg-[#182030] text-[#6b7280] dark:text-[#94a3b8]'
                  }`}
                >
                  {/* Left selection blue bar indicator */}
                  {isSelected && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#2980fe] rounded-r-full" />
                  )}
                  <div className="mb-1">
                    <CryptoIcon symbol={chain.symbol} size={32} />
                  </div>
                  <span className="text-[10px] font-bold text-center truncate max-w-[58px]">
                    {chain.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Area: Accounts under selected chain */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-white dark:bg-[#10141f]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280] dark:text-[#94a3b8]">
                {CHAINS.find((c) => c.id === selectedChainId)?.name} Accounts
              </span>
              <span className="text-[10px] font-mono text-[#2980fe] bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/20 font-bold">
                {CHAINS.find((c) => c.id === selectedChainId)?.standard}
              </span>
            </div>

            {/* Wallet Account Cards */}
            {walletAccounts.map((w) => {
              const isSelected = activeNetwork === selectedChainId && w.isDefault;
              return (
                <div
                  key={w.id}
                  onClick={() => {
                    if (selectedChainId === 'TRC20' || selectedChainId === 'ERC20' || selectedChainId === 'BEP20') {
                      handleSelectNetwork(selectedChainId as BlockchainNetwork);
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2.5 relative overflow-hidden ${
                    isSelected
                      ? 'bg-blue-50/60 dark:bg-[#152033] border-[#2980fe] shadow-xs'
                      : 'bg-[#f7f8fa] dark:bg-[#182030] border-[#e5e7eb] dark:border-[#1e2433] hover:border-[#2980fe]/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-bold text-[#1e2024] dark:text-white">{w.name}</h4>
                        {w.isDefault && (
                          <span className="text-[9px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1.5 font-mono text-[11px] text-[#6b7280] dark:text-[#94a3b8] mt-1">
                        <span>{w.address.slice(0, 8)}...{w.address.slice(-6)}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(w.address, w.id);
                          }}
                          className="text-[#9ca3af] hover:text-[#1e2024] dark:hover:text-white p-0.5 cursor-pointer"
                        >
                          {copiedId === w.id ? <Check className="h-3 w-3 text-[#03b875]" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2980fe] text-white">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Balance & Tag */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#e5e7eb] dark:border-[#1e2433] text-xs">
                    <div className="font-mono">
                      <span className="font-black text-[#1e2024] dark:text-white">{w.balance.toFixed(2)}</span>{' '}
                      <span className="text-[#03b875] dark:text-emerald-400 font-sans text-[10px] font-bold">USDT</span>
                      <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] block">≈ {formatCurrency(w.balance)}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] font-mono text-[#6b7280] dark:text-[#94a3b8] bg-white dark:bg-[#121620] px-2 py-0.5 rounded-lg border border-[#e5e7eb] dark:border-[#1e2433]">
                        {w.tag}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add / Import Wallet Button */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setShowAddWalletModal(!showAddWalletModal);
              }}
              className="w-full py-3 px-4 rounded-2xl bg-[#f7f8fa] dark:bg-[#182030] hover:bg-white dark:hover:bg-[#1e2433] border border-dashed border-[#e5e7eb] dark:border-[#2a3449] hover:border-[#2980fe] text-xs font-bold text-[#6b7280] dark:text-[#94a3b8] hover:text-[#2980fe] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create or Import {CHAINS.find((c) => c.id === selectedChainId)?.badge} Wallet</span>
            </button>

            {/* Quick Add Form */}
            {showAddWalletModal && (
              <div className="p-3 bg-[#f7f8fa] dark:bg-[#182030] rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] space-y-2.5 animate-in fade-in">
                <h5 className="text-[11px] font-bold text-[#1e2024] dark:text-white">Create HD Vault Account</h5>
                <input
                  type="text"
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                  placeholder="e.g. DeFi Savings Vault #03"
                  className="w-full bg-white dark:bg-[#121620] border border-[#e5e7eb] dark:border-[#1e2433] rounded-xl px-3 py-2 text-xs text-[#1e2024] dark:text-white focus:border-[#2980fe] focus:outline-none"
                />
                <button
                  type="button"
                  disabled={isCreating}
                  onClick={() => {
                    triggerHaptic();
                    setIsCreating(true);
                    setTimeout(() => {
                      setIsCreating(false);
                      setShowAddWalletModal(false);
                      setNewWalletName('');
                    }, 1200);
                  }}
                  className="w-full py-2 bg-[#2980fe] hover:bg-[#1e58e6] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {isCreating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                  <span>Generate MPC Protected Keys</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-[#e5e7eb] dark:border-[#1e2433] bg-white dark:bg-[#121620] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setIsWalletDrawerOpen(false);
              setActiveView('security');
            }}
            className="text-xs font-bold text-[#6b7280] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Lock className="h-3.5 w-3.5 text-purple-500" />
            <span>Key Management</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setIsWalletDrawerOpen(false);
              setActiveView('settings');
            }}
            className="text-xs font-bold text-[#2980fe] hover:text-[#1e58e6] flex items-center gap-1 cursor-pointer"
          >
            <span>Node RPCs</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
