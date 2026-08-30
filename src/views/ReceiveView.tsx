import React, { useState, useEffect } from 'react';
import { 
  ArrowDownLeft, Copy, Check, QrCode, Share2, 
  RefreshCw, ShieldCheck, Zap, Info, ArrowLeft,
  DollarSign, Sliders, CheckCircle2, ChevronRight
} from 'lucide-react';
import QRCode from 'qrcode';
import { BlockchainNetwork, NetworkConfig } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { CryptoIcon } from '../components/CryptoIcons';

interface ReceiveViewProps {
  onBack?: () => void;
  isStandalone?: boolean;
}

export const ReceiveView: React.FC<ReceiveViewProps> = ({ onBack, isStandalone = false }) => {
  const { setActiveView, refreshUserData, refreshBalance, triggerHaptic } = useAuth();
  const [selectedNetwork, setSelectedNetwork] = useState<BlockchainNetwork>('TRC20');
  const [addressData, setAddressData] = useState<{
    address: string;
    derivationPath: string;
    qrDataUrl: string;
    networkConfig: NetworkConfig;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set custom invoice amount in QR
  const [customAmount, setCustomAmount] = useState('');
  const [isSettingAmount, setIsSettingAmount] = useState(false);
  const [dynamicQrUrl, setDynamicQrUrl] = useState<string | null>(null);

  // Instant simulator
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSuccessMsg, setSimSuccessMsg] = useState<string | null>(null);
  const [showSimDrawer, setShowSimDrawer] = useState(false);
  const [simAmount, setSimAmount] = useState('500.00');

  const fetchAddress = async (net: BlockchainNetwork) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getAddress(net);
      setAddressData(res);
      setDynamicQrUrl(res.qrDataUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load deposit address');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddress(selectedNetwork);
  }, [selectedNetwork]);

  // Update dynamic QR code if custom amount is specified
  useEffect(() => {
    if (!addressData?.address) return;
    if (customAmount && parseFloat(customAmount) > 0) {
      const payload = `${selectedNetwork.toLowerCase()}:${addressData.address}?amount=${customAmount}`;
      QRCode.toDataURL(payload, { width: 320, margin: 2, color: { dark: '#022c22', light: '#ffffff' } })
        .then((url) => setDynamicQrUrl(url))
        .catch(() => setDynamicQrUrl(addressData.qrDataUrl));
    } else {
      setDynamicQrUrl(addressData.qrDataUrl);
    }
  }, [customAmount, addressData, selectedNetwork]);

  const handleCopy = () => {
    triggerHaptic();
    if (!addressData?.address) return;
    navigator.clipboard.writeText(addressData.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    triggerHaptic();
    if (!addressData?.address) return;
    const shareText = `My ${selectedNetwork} USDT Vault Address:\n${addressData.address}${customAmount ? `\nRequested Amount: ${customAmount} USDT` : ''}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receive USDT (${selectedNetwork})`,
          text: shareText,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleSimulateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic();
    setIsSimulating(true);
    setSimSuccessMsg(null);
    setError(null);
    try {
      const amount = parseFloat(simAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid deposit amount');
      }

      const res = await api.simulateDeposit({
        network: selectedNetwork,
        amount,
      });

      setSimSuccessMsg(res.message);
      await refreshUserData();
      await refreshBalance();
      setTimeout(() => setSimSuccessMsg(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 pb-20 select-none text-[#1e2024] dark:text-white">
      {/* Mobile Top Navigation */}
      <div className="flex items-center justify-between py-1">
        <button
          type="button"
          onClick={onBack || (() => setActiveView('dashboard'))}
          className="flex items-center space-x-1.5 text-xs text-[#6b7280] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white p-1 rounded-lg cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
        <h2 className="text-sm font-bold text-[#1e2024] dark:text-white">Receive USDT</h2>
        <div className="w-8" />
      </div>

      {/* Network Selector Tabs */}
      <div className="flex bg-white dark:bg-[#121620] p-1.5 rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] shadow-xs gap-1.5">
        {(['TRC20', 'ERC20', 'BEP20'] as BlockchainNetwork[]).map((net) => {
          const isSelected = selectedNetwork === net;
          const symbol = net === 'TRC20' ? 'TRX' : net === 'ERC20' ? 'ETH' : 'BNB';
          return (
            <button
              key={net}
              type="button"
              onClick={() => {
                triggerHaptic();
                setSelectedNetwork(net);
              }}
              className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isSelected
                  ? 'bg-[#2980fe] text-white shadow-xs'
                  : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#182030]'
              }`}
            >
              <CryptoIcon symbol={symbol} size={20} />
              <span>{net}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 p-3 text-xs text-rose-600 dark:text-rose-300">
          {error}
        </div>
      )}

      {simSuccessMsg && (
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 p-3 text-xs text-[#03b875] dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[#03b875] shrink-0" />
          <span>{simSuccessMsg}</span>
        </div>
      )}

      {/* QR Card Container */}
      <div className="bg-white dark:bg-[#121620] rounded-3xl border border-[#e5e7eb] dark:border-[#1e2433] p-6 flex flex-col items-center text-center shadow-xs relative">
        {/* Network Badge */}
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#f0fdf4] dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[#03b875] text-xs font-mono font-bold mb-4">
          <span className="h-2 w-2 rounded-full bg-[#03b875] animate-pulse" />
          <span>USDT - {selectedNetwork}</span>
        </div>

        {/* QR Code */}
        {isLoading ? (
          <div className="w-56 h-56 flex flex-col items-center justify-center bg-[#f7f8fa] dark:bg-[#0b0e14] rounded-3xl p-4 border border-[#e5e7eb] dark:border-[#1e2433]">
            <RefreshCw className="h-8 w-8 text-[#2980fe] animate-spin mb-2" />
            <span className="text-[11px] text-[#8a93a6] font-medium">Generating QR...</span>
          </div>
        ) : dynamicQrUrl ? (
          <div className="bg-[#f7f8fa] dark:bg-[#0b0e14] p-4 rounded-3xl border border-[#e5e7eb] dark:border-[#1e2433] relative group">
            <div className="bg-white p-2 rounded-xl">
              <img
                src={dynamicQrUrl}
                alt="Receive Address QR Code"
                className="w-52 h-52 sm:w-56 sm:h-56 object-contain rounded-lg"
              />
            </div>
            {customAmount && parseFloat(customAmount) > 0 && (
              <div className="mt-2 bg-[#f0f4ff] dark:bg-blue-950/40 text-[#2980fe] dark:text-blue-400 border border-blue-200 dark:border-blue-850 px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold">
                Requested: {customAmount} USDT
              </div>
            )}
          </div>
        ) : null}

        {/* Address Display & 1-Tap Copy */}
        <div className="w-full mt-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a93a6] dark:text-[#64748b] block mb-1">
            Deposit Address ({selectedNetwork})
          </span>
          <div
            onClick={handleCopy}
            className="bg-[#f7f8fa] dark:bg-[#0b0e14] border border-[#e5e7eb] dark:border-[#1e2433] rounded-2xl p-3 font-mono text-xs text-[#1e2024] dark:text-white break-all select-all cursor-pointer hover:border-[#2980fe]/40 transition-colors flex items-center justify-between gap-2"
          >
            <span className="text-left font-semibold">
              {addressData?.address || 'Loading address...'}
            </span>
            <button
              type="button"
              className="shrink-0 p-1.5 rounded-xl bg-white dark:bg-[#182030] text-[#6b7280] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white border border-[#e5e7eb] dark:border-[#2a3447] cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4 text-[#03b875]" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Action Buttons: Copy, Set Amount, Share */}
        <div className="grid grid-cols-3 gap-2 w-full mt-4">
          <button
            type="button"
            onClick={handleCopy}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              copied
                ? 'bg-[#03b875] text-white shadow-xs'
                : 'bg-[#2980fe] hover:bg-[#2268d1] text-white shadow-xs'
            }`}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSettingAmount(!isSettingAmount)}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              customAmount
                ? 'bg-[#f0fdf4] dark:bg-emerald-950/40 text-[#03b875] border border-emerald-200 dark:border-emerald-800'
                : 'bg-[#f7f8fa] dark:bg-[#0b0e14] hover:bg-[#e5e7eb] dark:hover:bg-[#182030] text-[#1e2024] dark:text-white border border-[#e5e7eb] dark:border-[#1e2433]'
            }`}
          >
            <DollarSign className="h-3.5 w-3.5 text-[#03b875]" />
            <span>{customAmount ? `${customAmount}` : 'Set Amount'}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="py-2.5 px-3 rounded-xl bg-[#f7f8fa] dark:bg-[#0b0e14] hover:bg-[#e5e7eb] dark:hover:bg-[#182030] text-[#1e2024] dark:text-white border border-[#e5e7eb] dark:border-[#1e2433] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5 text-[#2980fe]" />
            <span>Share</span>
          </button>
        </div>

        {/* Optional Custom Amount Input Drawer */}
        {isSettingAmount && (
          <div className="w-full mt-3 p-3 bg-[#f7f8fa] dark:bg-[#0b0e14] rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] font-medium">Specify Request Amount:</span>
              {customAmount && (
                <button
                  onClick={() => setCustomAmount('')}
                  className="text-[10px] text-rose-500 underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="relative flex items-center">
              <input
                type="number"
                step="0.1"
                min="1"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="e.g. 100.00"
                className="w-full bg-white dark:bg-[#121620] border border-[#e5e7eb] dark:border-[#1e2433] rounded-xl px-3 py-2 text-xs text-[#1e2024] dark:text-white font-mono focus:border-[#2980fe] focus:outline-none"
              />
              <span className="absolute right-3 text-xs text-[#8a93a6] font-bold">USDT</span>
            </div>
          </div>
        )}
      </div>

      {/* Network Specs Note */}
      <div className="bg-white dark:bg-[#121620] rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] p-3.5 space-y-1.5 text-xs text-[#6b7280] dark:text-[#94a3b8] shadow-xs">
        <div className="flex justify-between items-center text-[#1e2024] dark:text-white">
          <span className="text-[11px] text-[#8a93a6] dark:text-[#64748b]">Minimum Deposit</span>
          <span className="font-mono font-bold text-[#1e2024] dark:text-white">
            {addressData?.networkConfig.minDeposit || 1.0} USDT
          </span>
        </div>
        <div className="flex justify-between items-center text-[#1e2024] dark:text-white">
          <span className="text-[11px] text-[#8a93a6] dark:text-[#64748b]">Expected Confirmations</span>
          <span className="font-mono font-bold text-[#1e2024] dark:text-white">
            {addressData?.networkConfig.confirmationsRequired || 1} Block Confirmations
          </span>
        </div>
        <div className="pt-1 text-[11px] text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
          <span>
            Please only send <strong>USDT-{selectedNetwork}</strong> to this address. Cross-chain sends will be lost.
          </span>
        </div>
      </div>

      {/* Test Deposit Simulator Button */}
      <div className="border-t border-[#f3f4f6] dark:border-[#182030] pt-3">
        <button
          type="button"
          onClick={() => setShowSimDrawer(!showSimDrawer)}
          className="w-full py-2.5 px-4 rounded-2xl bg-white dark:bg-[#121620] border border-[#e5e7eb] dark:border-[#1e2433] text-xs font-bold text-[#1e2024] dark:text-white hover:bg-[#f7f8fa] dark:hover:bg-[#181f2e] flex items-center justify-between transition-colors shadow-xs cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-[#03b875]" />
            <span>Test Incoming Deposit Simulation</span>
          </div>
          <ChevronRight className={`h-4 w-4 text-[#8a93a6] transition-transform ${showSimDrawer ? 'rotate-90' : ''}`} />
        </button>

        {showSimDrawer && (
          <form onSubmit={handleSimulateDeposit} className="mt-2 bg-white dark:bg-[#121620] p-3.5 rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] space-y-3 animate-in fade-in shadow-xs">
            <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
              Instantly simulates an on-chain deposit of test USDT into this address. The double-entry ledger will confirm and update your balance.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="1"
                min="1"
                value={simAmount}
                onChange={(e) => setSimAmount(e.target.value)}
                className="flex-1 bg-[#f7f8fa] dark:bg-[#0b0e14] border border-[#e5e7eb] dark:border-[#1e2433] rounded-xl px-3 py-2 text-xs text-[#1e2024] dark:text-white font-mono focus:border-[#2980fe] focus:outline-none"
                placeholder="500"
                required
              />
              <button
                type="submit"
                disabled={isSimulating}
                className="px-4 py-2 bg-[#03b875] hover:bg-[#029b63] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isSimulating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                <span>Receive</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
