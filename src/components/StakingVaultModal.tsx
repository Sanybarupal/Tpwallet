import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Zap, ShieldCheck, Check, Sparkles, AlertCircle, ArrowRight, Lock, RefreshCw, Coins, Gift } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { StakingOverview, StakingPool, StakingPosition } from '../types';

interface StakingVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StakingVaultModal: React.FC<StakingVaultModalProps> = ({ isOpen, onClose }) => {
  const { balance, triggerHaptic, refreshBalance } = useAuth();
  const [activeTab, setActiveTab] = useState<'STAKE' | 'POSITIONS'>('STAKE');
  const [overview, setOverview] = useState<StakingOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState<string>('pool_usdt_liquid');
  const [stakeAmount, setStakeAmount] = useState('100.00');
  const [duration, setDuration] = useState<'FLEXIBLE' | '30D' | '90D'>('FLEXIBLE');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await api.getStakingOverview();
      setOverview(res);
    } catch (err: unknown) {
      console.error('Failed to load staking overview', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOverview();
      const interval = setInterval(fetchOverview, 6000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPool: StakingPool | undefined = overview?.pools.find((p) => p.id === selectedPoolId) || overview?.pools[0];
  const availableBal = balance?.availableBalance || 0;
  const numAmt = parseFloat(stakeAmount) || 0;

  const durationBonus = currentPool?.durationOptions.find((d) => d.type === duration)?.bonusApy || 0;
  const effectiveApy = (currentPool?.apy || 8.45) + durationBonus;

  const estYearly = (numAmt * (effectiveApy / 100)).toFixed(2);
  const estDaily = (numAmt * (effectiveApy / 100) / 365).toFixed(4);

  const handleStake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPool || numAmt <= 0) return;

    triggerHaptic();
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await api.stake({
        poolId: currentPool.id,
        amount: numAmt,
        duration,
      });
      setMessage({ type: 'success', text: res.message });
      await refreshBalance();
      await fetchOverview();
      setTimeout(() => {
        setActiveTab('POSITIONS');
      }, 1200);
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Staking failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaim = async (positionId: string) => {
    triggerHaptic();
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await api.claimStakingRewards(positionId);
      setMessage({ type: 'success', text: res.message });
      await refreshBalance();
      await fetchOverview();
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Claim failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnstake = async (positionId: string) => {
    triggerHaptic();
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await api.unstake(positionId);
      setMessage({ type: 'success', text: res.message });
      await refreshBalance();
      await fetchOverview();
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Unstake failed' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in select-none">
      <div className="w-full max-w-md bg-white dark:bg-[#121620] border border-[#e5e7eb] dark:border-[#1e2433] rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-[#1e2024] dark:text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f5f6f8] dark:border-[#182030] pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-[#03b875] border border-emerald-200 dark:border-emerald-500/20">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#1e2024] dark:text-white">DeFi Yield & Staking Vault</h3>
              <p className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] font-mono">Real Smart Contract Yields</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl bg-[#f7f8fa] dark:bg-[#182030] text-[#9ca3af] hover:text-[#1e2024] dark:hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Global stats bar */}
        <div className="grid grid-cols-2 gap-2 bg-[#f7f8fa] dark:bg-[#0b0e14] p-2.5 rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] text-xs">
          <div>
            <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] block">Total Staked Principal</span>
            <span className="font-bold text-[#1e2024] dark:text-white font-mono text-sm">${overview?.totalStakedUSDT.toFixed(2) || '0.00'}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] block">Unclaimed Dividends</span>
            <span className="font-bold text-[#03b875] font-mono text-sm">+{overview?.totalPendingRewards.toFixed(4) || '0.0000'} USDT</span>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-[#f7f8fa] dark:bg-[#0b0e14] p-1 rounded-xl border border-[#e5e7eb] dark:border-[#1e2433] text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('STAKE')}
            className={`flex-1 py-1.5 font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'STAKE' ? 'bg-[#2980fe] text-white shadow-xs' : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white'
            }`}
          >
            Deposit & Stake
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('POSITIONS')}
            className={`flex-1 py-1.5 font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'POSITIONS' ? 'bg-[#2980fe] text-white shadow-xs' : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white'
            }`}
          >
            <span>My Positions</span>
            {overview && overview.positions.length > 0 && (
              <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-500/20 text-[#03b875] dark:text-emerald-300 rounded-full text-[10px] font-mono">
                {overview.positions.length}
              </span>
            )}
          </button>
        </div>

        {message && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-[#03b875] dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-300'
            }`}
          >
            {message.type === 'success' ? <Check className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />}
            <span>{message.text}</span>
          </div>
        )}

        {activeTab === 'STAKE' && (
          <div className="space-y-3">
            {/* Pool selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#6b7280] dark:text-[#94a3b8] block">Select Yield Pool</label>
              <div className="grid grid-cols-2 gap-2">
                {overview?.pools.map((pool) => (
                  <button
                    key={pool.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      setSelectedPoolId(pool.id);
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedPoolId === pool.id
                        ? 'bg-blue-50 dark:bg-blue-600/15 border-[#2980fe] shadow-xs'
                        : 'bg-[#f7f8fa] dark:bg-[#0b0e14] border-[#e5e7eb] dark:border-[#1e2433] hover:border-[#2980fe]/40'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-bold text-[#1e2024] dark:text-white truncate max-w-[90px]">{pool.name}</span>
                      <span className="text-[10px] font-mono font-bold text-[#03b875] bg-emerald-50 dark:bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-200 dark:border-emerald-500/20">
                        {pool.apy}%
                      </span>
                    </div>
                    <p className="text-[9px] text-[#6b7280] dark:text-[#94a3b8] line-clamp-1">{pool.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Stake form */}
            <form onSubmit={handleStake} className="space-y-3">
              <div className="bg-[#f7f8fa] dark:bg-[#0b0e14] p-3 rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] space-y-1">
                <div className="flex justify-between items-center text-[10px] text-[#6b7280] dark:text-[#94a3b8]">
                  <span>Stake Amount</span>
                  <span>
                    Available: <strong className="text-[#1e2024] dark:text-white font-mono">{availableBal.toFixed(2)} USDT</strong>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-2/3 bg-transparent text-lg font-mono font-black text-[#1e2024] dark:text-white focus:outline-none"
                    required
                  />
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setStakeAmount(availableBal.toString())}
                      className="px-2 py-1 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/20 text-[#2980fe] dark:text-blue-400 font-bold text-[10px] rounded-lg cursor-pointer"
                    >
                      MAX
                    </button>
                    <span className="text-xs font-bold text-[#1e2024] dark:text-white font-mono">USDT</span>
                  </div>
                </div>
              </div>

              {/* Duration options */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#6b7280] dark:text-[#94a3b8] block">Staking Period & Lock</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {currentPool?.durationOptions.map((d) => (
                    <button
                      key={d.type}
                      type="button"
                      onClick={() => {
                        triggerHaptic();
                        setDuration(d.type);
                      }}
                      className={`py-2 px-1 rounded-xl text-center border transition-all cursor-pointer ${
                        duration === d.type
                          ? 'bg-[#2980fe] text-white border-[#2980fe] shadow-xs'
                          : 'bg-[#f7f8fa] dark:bg-[#0b0e14] text-[#6b7280] dark:text-[#94a3b8] border-[#e5e7eb] dark:border-[#1e2433]'
                      }`}
                    >
                      <span className="block text-xs font-bold">{d.label}</span>
                      <span className="block text-[9px] font-mono opacity-80">
                        {d.bonusApy > 0 ? `+${d.bonusApy}% APY` : 'Standard'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Yield summary */}
              <div className="bg-[#f7f8fa] dark:bg-[#0b0e14] p-3 rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] space-y-1 text-xs font-mono">
                <div className="flex justify-between items-center text-[#6b7280] dark:text-[#94a3b8]">
                  <span className="font-sans text-[11px]">Effective APY:</span>
                  <span className="text-[#03b875] font-black">{effectiveApy.toFixed(2)}% APY</span>
                </div>
                <div className="flex justify-between items-center text-[#6b7280] dark:text-[#94a3b8]">
                  <span className="font-sans text-[11px]">Est. Daily Dividend:</span>
                  <span className="text-[#1e2024] dark:text-white">+{estDaily} USDT</span>
                </div>
                <div className="flex justify-between items-center text-[#6b7280] dark:text-[#94a3b8]">
                  <span className="font-sans text-[11px]">Est. Yearly Return:</span>
                  <span className="text-[#03b875] font-bold">+{estYearly} USDT</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading || numAmt <= 0}
                className="w-full py-3 bg-[#03b875] hover:bg-[#029b63] disabled:opacity-50 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                <span>Deposit & Stake Now</span>
              </button>
            </form>
          </div>
        )}

        {activeTab === 'POSITIONS' && (
          <div className="space-y-3">
            {overview?.positions && overview.positions.length > 0 ? (
              overview.positions.map((pos) => (
                <div key={pos.id} className="p-3 bg-[#f7f8fa] dark:bg-[#0b0e14] rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-[#1e2024] dark:text-white">{pos.poolName}</h4>
                      <p className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] font-mono">
                        {pos.stakedAmount.toFixed(2)} {pos.asset} • {pos.effectiveApy}% APY
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-[#03b875] border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-bold rounded-lg">
                      Active
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-white dark:bg-[#182030] p-2 rounded-xl border border-[#e5e7eb] dark:border-[#1e2433] text-xs">
                    <div>
                      <span className="text-[9px] text-[#6b7280] dark:text-[#94a3b8] block">Accrued Dividends</span>
                      <span className="font-bold text-[#03b875] font-mono">
                        +{(pos.liveAccruedRewards || pos.accruedRewards).toFixed(5)} {pos.asset}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleClaim(pos.id)}
                      disabled={actionLoading || (pos.liveAccruedRewards || 0) < 0.0001}
                      className="px-3 py-1.5 bg-[#03b875] hover:bg-[#029b63] disabled:opacity-40 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Gift className="h-3 w-3" />
                      <span>Claim</span>
                    </button>
                  </div>

                  <div className="flex justify-between items-center pt-1 text-[10px] text-[#6b7280] dark:text-[#94a3b8]">
                    <span>Duration: {pos.duration}</span>
                    <button
                      type="button"
                      onClick={() => handleUnstake(pos.id)}
                      disabled={actionLoading}
                      className="text-rose-600 dark:text-rose-400 hover:underline font-bold cursor-pointer"
                    >
                      Unstake Principal
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-[#9ca3af] space-y-2">
                <Coins className="h-8 w-8 mx-auto opacity-40" />
                <p className="text-xs">No active staking positions yet.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('STAKE')}
                  className="text-xs text-[#2980fe] dark:text-blue-400 hover:underline font-bold cursor-pointer"
                >
                  Explore High APY Pools
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
