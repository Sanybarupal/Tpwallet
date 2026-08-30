import React, { useState } from 'react';
import { 
  Wallet, ArrowDownLeft, ArrowUpRight, Copy, Check, 
  ExternalLink, ShieldCheck, RefreshCw, Eye, EyeOff, 
  Send, Layers, Server, Activity, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BlockchainNetwork } from '../types';
import { CryptoIcon } from '../components/CryptoIcons';

export const WalletAssetsView: React.FC = () => {
  const { 
    balance, formatCurrency, currency, refreshBalance,
    setIsDepositModalOpen, setIsWithdrawModalOpen, 
    setIsReceiveModalOpen, setSelectedWithdrawalPrefill,
    setActiveView, triggerHaptic 
  } = useAuth();

  const [hideBalances, setHideBalances] = useState(false);
  const [copiedContract, setCopiedContract] = useState<string | null>(null);

  const totalBal = balance?.totalBalance || 0;
  const availBal = balance?.availableBalance || 0;

  const handleCopyContract = (contract: string) => {
    triggerHaptic();
    navigator.clipboard.writeText(contract);
    setCopiedContract(contract);
    setTimeout(() => setCopiedContract(null), 2000);
  };

  const handleQuickSend = (net: BlockchainNetwork) => {
    triggerHaptic();
    setSelectedWithdrawalPrefill({ network: net });
    setIsWithdrawModalOpen(true);
  };

  const handleQuickReceive = () => {
    triggerHaptic();
    setActiveView('receive');
  };

  const assetList = [
    {
      network: 'TRC20' as BlockchainNetwork,
      name: 'Tether USD (TRON)',
      symbol: 'USDT-TRC20',
      iconBg: 'bg-red-500/10 text-red-400 border-red-500/20',
      badge: 'TRON',
      contract: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      gasFee: '1.00 USDT',
      speed: '~1 min (1 block)',
      sharePercent: 65,
      rpcStatus: 'Operational (24ms)',
    },
    {
      network: 'ERC20' as BlockchainNetwork,
      name: 'Tether USD (Ethereum)',
      symbol: 'USDT-ERC20',
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      badge: 'ETH',
      contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      gasFee: '3.50 USDT',
      speed: '~3 min (12 blocks)',
      sharePercent: 25,
      rpcStatus: 'Operational (48ms)',
    },
    {
      network: 'BEP20' as BlockchainNetwork,
      name: 'Tether USD (BNB Chain)',
      symbol: 'USDT-BEP20',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      badge: 'BSC',
      contract: '0x55d398326f99059fF775485246999027B3197955',
      gasFee: '0.80 USDT',
      speed: '~1 min (15 blocks)',
      sharePercent: 10,
      rpcStatus: 'Operational (18ms)',
    },
  ];

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* Total Asset Valuation Header */}
      <div className="bg-white rounded-3xl border border-[#e5e7eb] p-5 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-[#8a93a6] uppercase tracking-wider">
              Total Assets Valuation
            </span>
            <button
              onClick={() => setHideBalances(!hideBalances)}
              className="text-[#9ca3af] hover:text-[#1e2024] p-1 cursor-pointer"
            >
              {hideBalances ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          <span className="text-[10px] font-mono font-bold bg-[#f0f4ff] text-[#2980fe] px-2 py-0.5 rounded-full border border-[#dbeafe]">
            {currency} VALUATION
          </span>
        </div>

        <div className="flex items-baseline space-x-2">
          <span className="font-mono text-3xl sm:text-4xl font-black text-[#1e2024] tracking-tight">
            {hideBalances ? '••••••••' : formatCurrency(totalBal)}
          </span>
        </div>

        <div className="flex items-center space-x-3 mt-1 text-xs text-[#8a93a6] font-mono">
          <span>{hideBalances ? '••••' : totalBal.toFixed(2)} USDT</span>
          <span>•</span>
          <span className="text-[#03b875] font-semibold">{hideBalances ? '••••' : availBal.toFixed(2)} USDT Available</span>
        </div>

        {/* Quick Top Actions */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#f3f4f6]">
          <button
            onClick={() => {
              triggerHaptic();
              setActiveView('receive');
            }}
            className="flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-[#2980fe] text-white font-bold text-xs shadow-xs hover:bg-[#2268d1] transition-colors cursor-pointer"
          >
            <ArrowDownLeft className="h-4 w-4" />
            <span>Receive Asset</span>
          </button>
          <button
            onClick={() => {
              triggerHaptic();
              setIsWithdrawModalOpen(true);
            }}
            className="flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-[#f7f8fa] hover:bg-[#e5e7eb] text-[#1e2024] font-bold text-xs border border-[#e5e7eb] transition-colors cursor-pointer"
          >
            <ArrowUpRight className="h-4 w-4 text-[#2980fe]" />
            <span>Send Asset</span>
          </button>
        </div>
      </div>

      {/* Chain Asset Breakdown List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-[#8a93a6] uppercase tracking-wider">
            Multi-Chain Vault Assets
          </h3>
          <span className="text-[11px] text-[#8a93a6] font-mono">3 Networks Live</span>
        </div>

        {assetList.map((asset) => {
          return (
            <div
              key={asset.network}
              className="bg-white rounded-2xl border border-[#e5e7eb] p-4 shadow-xs hover:border-[#2980fe]/40 transition-all space-y-3"
            >
              {/* Asset Title Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CryptoIcon symbol="USDT" size={40} />
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-xs text-[#1e2024]">{asset.symbol}</span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[#2980fe]">{asset.badge}</span>
                    </div>
                    <h4 className="text-xs font-bold text-[#1e2024] flex items-center gap-1.5">
                      <span>{asset.name}</span>
                      <span className="text-[10px] font-mono text-[#8a93a6] font-normal">({asset.network})</span>
                    </h4>
                    <p className="text-[10px] text-[#8a93a6] font-mono mt-0.5">
                      Gas: {asset.gasFee} • {asset.speed}
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-sm font-black text-[#1e2024] block">
                    {hideBalances ? '••••' : totalBal.toFixed(2)} <span className="text-[10px] text-[#03b875] font-sans">USDT</span>
                  </span>
                  <span className="text-[10px] text-[#8a93a6] block">
                    ≈ {hideBalances ? '••••' : formatCurrency(totalBal)}
                  </span>
                </div>
              </div>

              {/* Smart Contract & RPC Status */}
              <div className="flex items-center justify-between bg-[#f7f8fa] p-2.5 rounded-xl border border-[#e5e7eb] text-[11px]">
                <div className="flex items-center space-x-1 font-mono text-[#6b7280] truncate max-w-[180px]">
                  <span className="text-[#8a93a6]">Contract:</span>
                  <span className="truncate">{asset.contract.slice(0, 6)}...{asset.contract.slice(-4)}</span>
                  <button
                    onClick={() => handleCopyContract(asset.contract)}
                    className="text-[#8a93a6] hover:text-[#1e2024] p-0.5 cursor-pointer"
                    title="Copy Contract Address"
                  >
                    {copiedContract === asset.contract ? <Check className="h-3 w-3 text-[#03b875]" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
                <div className="flex items-center space-x-1.5 text-[10px] text-[#03b875] font-mono font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#03b875]" />
                  <span>{asset.rpcStatus}</span>
                </div>
              </div>

              {/* Action Buttons for this specific network */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    setActiveView('receive');
                  }}
                  className="py-2 px-3 rounded-xl bg-[#f0fdf4] hover:bg-[#dcfce7] text-xs font-bold text-[#03b875] border border-emerald-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowDownLeft className="h-3.5 w-3.5" />
                  <span>Deposit {asset.network}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickSend(asset.network)}
                  className="py-2 px-3 rounded-xl bg-[#f0f4ff] hover:bg-[#dbeafe] text-xs font-bold text-[#2980fe] border border-blue-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>Send {asset.network}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custody Node Protocol Specs */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] p-4 space-y-2 shadow-xs">
        <div className="flex items-center space-x-2 text-xs font-bold text-[#1e2024]">
          <Server className="h-4 w-4 text-[#2980fe]" />
          <span>MPC Hardware Custody Enclave</span>
        </div>
        <p className="text-[11px] text-[#6b7280] leading-relaxed">
          All deposits are isolated across multi-party computation (MPC) shard partitions. User balances are backed 1:1 by on-chain verifiable liquidity pools with double-entry journal auditing.
        </p>
      </div>
    </div>
  );
};
