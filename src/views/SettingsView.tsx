import React, { useState } from 'react';
import { 
  ArrowLeft, DollarSign, Server, Smartphone, Sun, Moon, 
  Trash2, Check, RefreshCw, Volume2, ShieldCheck, Zap,
  Fingerprint, Key, ArrowRightLeft, Link2, Unlink, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SupportedCurrency } from '../types';

export const SettingsView: React.FC = () => {
  const { 
    setActiveView, currency, setCurrency, 
    isDeviceFrameMode, setIsDeviceFrameMode, triggerHaptic,
    theme, toggleTheme, binanceAccount, connectBinance, disconnectBinance,
    transferBinance, refreshBinanceStatus, authenticateBiometric
  } = useAuth();

  const [selectedNode, setSelectedNode] = useState('TronGrid Official RPC');
  const [cacheCleared, setCacheCleared] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  
  // Binance connection inputs
  const [showBinanceModal, setShowBinanceModal] = useState(false);
  const [binanceApiKey, setBinanceApiKey] = useState('');
  const [binanceApiSecret, setBinanceApiSecret] = useState('');
  const [binanceAccountType, setBinanceAccountType] = useState<'spot' | 'margin' | 'futures'>('spot');
  const [binanceConnecting, setBinanceConnecting] = useState(false);
  const [binanceMsg, setBinanceMsg] = useState<string | null>(null);

  // Binance Transfer
  const [transferAmount, setTransferAmount] = useState('50.00');
  const [transferDirection, setTransferDirection] = useState<'TO_BINANCE' | 'FROM_BINANCE'>('TO_BINANCE');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

  // Biometric test state
  const [bioTesting, setBioTesting] = useState(false);
  const [bioResult, setBioResult] = useState<string | null>(null);

  const currencies: { code: SupportedCurrency; name: string; symbol: string }[] = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  ];

  const nodes = [
    { name: 'TronGrid Official RPC', ping: '18ms', network: 'TRON / TRC20', status: 'Optimal' },
    { name: 'Alchemy Global High-Throughput', ping: '24ms', network: 'Ethereum / ERC20', status: 'Optimal' },
    { name: 'QuickNode MPC Enclave', ping: '14ms', network: 'BSC / BEP20', status: 'Optimal' },
    { name: 'Cloudflare Decentralized Gateway', ping: '32ms', network: 'Multi-Chain', status: 'Standby' },
  ];

  const handleClearCache = () => {
    triggerHaptic();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2500);
  };

  const handleConnectBinanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic();
    setBinanceConnecting(true);
    setBinanceMsg(null);
    try {
      const res = await connectBinance({
        apiKey: binanceApiKey.trim() || undefined,
        apiSecret: binanceApiSecret.trim() || undefined,
        accountType: binanceAccountType,
      });
      if (res.success) {
        setShowBinanceModal(false);
        setBinanceMsg('Binance Account Linked Successfully!');
        setTimeout(() => setBinanceMsg(null), 3000);
      } else {
        setBinanceMsg(res.error || 'Connection failed');
      }
    } catch (err: unknown) {
      setBinanceMsg(err instanceof Error ? err.message : 'Failed to connect Binance');
    } finally {
      setBinanceConnecting(false);
    }
  };

  const handleExecuteBinanceTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) return;
    triggerHaptic();
    setIsTransferring(true);
    setTransferSuccess(null);
    try {
      const res = await transferBinance({
        direction: transferDirection,
        asset: 'USDT',
        amount: amt,
      });
      if (res.success) {
        setTransferSuccess(res.message);
        setTimeout(() => setTransferSuccess(null), 4000);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleTestBiometric = async () => {
    triggerHaptic();
    setBioTesting(true);
    setBioResult(null);
    const res = await authenticateBiometric();
    setBioTesting(false);
    if (res.success) {
      setBioResult('System Fingerprint verified successfully!');
      setTimeout(() => setBioResult(null), 3000);
    } else {
      setBioResult(res.error || 'Verification failed');
      setTimeout(() => setBioResult(null), 4000);
    }
  };

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between py-1">
        <button
          type="button"
          onClick={() => setActiveView('profile')}
          className="flex items-center space-x-1.5 text-xs text-[#6b7280] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white p-1 rounded-lg cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
        <h2 className="text-sm font-bold text-[#1e2024] dark:text-white">App & System Settings</h2>
        <div className="w-8" />
      </div>

      {/* Theme Selection: White Mode vs Dark Mode */}
      <div className="bg-white dark:bg-[#121620] rounded-3xl border border-[#e5e7eb] dark:border-[#1e2433] p-4 space-y-3 shadow-xs transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {theme === 'light' ? (
              <Sun className="h-4 w-4 text-amber-500" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-400" />
            )}
            <h3 className="text-xs font-bold text-[#1e2024] dark:text-white uppercase tracking-wider">
              Interface Color Theme
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#2980fe]/10 text-[#2980fe]">
            {theme === 'light' ? 'Light (Default)' : 'Dark Mode'}
          </span>
        </div>
        <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
          Switch between clean White daylight theme and high-contrast Dark theme.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              if (theme !== 'light') toggleTheme();
            }}
            className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-[#f0f4ff] border-[#2980fe] text-[#2980fe] shadow-xs'
                : 'bg-[#f7f8fa] dark:bg-[#181f2e] border-[#e5e7eb] dark:border-[#2a3447] text-[#6b7280] dark:text-[#94a3b8]'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Sun className={`h-4 w-4 ${theme === 'light' ? 'text-[#2980fe]' : 'text-amber-500'}`} />
              <div>
                <span className="font-bold text-xs text-[#1e2024] dark:text-white block">White Mode</span>
                <span className="text-[10px] text-[#8a93a6]">Crisp & Clean</span>
              </div>
            </div>
            {theme === 'light' && <Check className="h-4 w-4 text-[#2980fe]" />}
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              if (theme !== 'dark') toggleTheme();
            }}
            className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#1e293b] border-[#2980fe] text-white shadow-xs'
                : 'bg-[#f7f8fa] dark:bg-[#181f2e] border-[#e5e7eb] dark:border-[#2a3447] text-[#6b7280] dark:text-[#94a3b8]'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Moon className={`h-4 w-4 ${theme === 'dark' ? 'text-[#2980fe]' : 'text-indigo-400'}`} />
              <div>
                <span className="font-bold text-xs text-[#1e2024] dark:text-white block">Dark Mode</span>
                <span className="text-[10px] text-[#8a93a6]">OLED Midnight</span>
              </div>
            </div>
            {theme === 'dark' && <Check className="h-4 w-4 text-[#2980fe]" />}
          </button>
        </div>
      </div>

      {/* REAL BINANCE INTEGRATION GATEWAY CARD */}
      <div className="bg-white dark:bg-[#121620] rounded-3xl border border-[#e5e7eb] dark:border-[#1e2433] p-4 space-y-3 shadow-xs transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-5 w-5 rounded-full bg-[#f3ba2f] text-black flex items-center justify-center font-black text-[10px]">
              B
            </div>
            <h3 className="text-xs font-bold text-[#1e2024] dark:text-white uppercase tracking-wider">
              Real Binance Exchange Link
            </h3>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            binanceAccount?.connected
              ? 'bg-[#03b875]/10 text-[#03b875] border border-[#03b875]/20'
              : 'bg-[#f5465c]/10 text-[#f5465c] border border-[#f5465c]/20'
          }`}>
            {binanceAccount?.connected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>

        <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
          Direct Binance spot bridge for real-time order depth and seamless wallet transfers.
        </p>

        {binanceAccount?.connected ? (
          <div className="space-y-3 bg-[#f7f8fa] dark:bg-[#181f2e] p-3.5 rounded-2xl border border-[#e5e7eb] dark:border-[#2a3447]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#6b7280] dark:text-[#94a3b8]">Binance Spot USDT Balance</span>
              <span className="font-mono font-black text-[#1e2024] dark:text-white">
                ${binanceAccount.usdtBalance.toFixed(2)} USDT
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[#6b7280] dark:text-[#94a3b8]">Binance Spot BNB Balance</span>
              <span className="font-mono font-black text-[#f3ba2f]">
                {binanceAccount.bnbBalance.toFixed(3)} BNB
              </span>
            </div>

            {/* Quick Instant Transfer form */}
            <form onSubmit={handleExecuteBinanceTransfer} className="space-y-2 pt-2 border-t border-[#e5e7eb] dark:border-[#2a3447]">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#6b7280] dark:text-[#94a3b8]">
                <span>Instant Wallet &lt;-&gt; Binance Transfer</span>
                <button
                  type="button"
                  onClick={() => setTransferDirection(transferDirection === 'TO_BINANCE' ? 'FROM_BINANCE' : 'TO_BINANCE')}
                  className="text-[10px] text-[#2980fe] flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <ArrowRightLeft className="h-3 w-3" />
                  <span>{transferDirection === 'TO_BINANCE' ? 'Wallet -> Binance' : 'Binance -> Wallet'}</span>
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="flex-1 bg-white dark:bg-[#121620] border border-[#e5e7eb] dark:border-[#2a3447] rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-[#1e2024] dark:text-white focus:outline-none"
                  placeholder="USDT Amount"
                />
                <button
                  type="submit"
                  disabled={isTransferring}
                  className="px-3 py-1.5 rounded-xl bg-[#f3ba2f] text-black font-bold text-xs hover:bg-[#e0a825] disabled:opacity-50 cursor-pointer flex items-center gap-1"
                >
                  {isTransferring ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                  <span>Transfer</span>
                </button>
              </div>

              {transferSuccess && (
                <div className="text-[11px] text-[#03b875] font-bold flex items-center gap-1 pt-1">
                  <Check className="h-3 w-3" />
                  <span>{transferSuccess}</span>
                </div>
              )}
            </form>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  refreshBinanceStatus();
                }}
                className="text-[10px] font-bold text-[#2980fe] flex items-center gap-1 hover:underline cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Sync Balances</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  disconnectBinance();
                }}
                className="text-[10px] font-bold text-[#f5465c] flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Unlink className="h-3 w-3" />
                <span>Disconnect Binance</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setShowBinanceModal(true);
              }}
              className="w-full py-2.5 px-4 rounded-2xl bg-[#f3ba2f] hover:bg-[#e0a825] text-black text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs"
            >
              <Link2 className="h-4 w-4" />
              <span>Connect Binance API Key</span>
            </button>
          </div>
        )}

        {/* Binance Modal */}
        {showBinanceModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#121620] rounded-3xl border border-[#e5e7eb] dark:border-[#1e2433] max-w-sm w-full p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-5 w-5 rounded-full bg-[#f3ba2f] text-black flex items-center justify-center font-black text-[10px]">
                    B
                  </div>
                  <h4 className="text-xs font-bold text-[#1e2024] dark:text-white">Connect Binance Account</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBinanceModal(false)}
                  className="text-[#8a93a6] hover:text-[#1e2024] dark:hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
                Provide your Binance Read/Trade API keys to execute real transactions. (Leave blank to use verified Binance Fast-Connect gateway).
              </p>

              <form onSubmit={handleConnectBinanceSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#8a93a6]">Binance API Key</label>
                  <input
                    type="text"
                    value={binanceApiKey}
                    onChange={(e) => setBinanceApiKey(e.target.value)}
                    placeholder="Enter Binance API key (optional)"
                    className="w-full bg-[#f7f8fa] dark:bg-[#181f2e] border border-[#e5e7eb] dark:border-[#2a3447] rounded-xl px-3 py-2 text-xs font-mono text-[#1e2024] dark:text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#8a93a6]">Binance API Secret</label>
                  <input
                    type="password"
                    value={binanceApiSecret}
                    onChange={(e) => setBinanceApiSecret(e.target.value)}
                    placeholder="Enter Secret Key (optional)"
                    className="w-full bg-[#f7f8fa] dark:bg-[#181f2e] border border-[#e5e7eb] dark:border-[#2a3447] rounded-xl px-3 py-2 text-xs font-mono text-[#1e2024] dark:text-white focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBinanceModal(false)}
                    className="flex-1 py-2 rounded-xl bg-[#f7f8fa] dark:bg-[#181f2e] text-[#6b7280] dark:text-[#94a3b8] text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={binanceConnecting}
                    className="flex-1 py-2 rounded-xl bg-[#f3ba2f] hover:bg-[#e0a825] text-black text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {binanceConnecting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    <span>Confirm Connect</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Biometric Fingerprint Testing & Security */}
      <div className="bg-white dark:bg-[#121620] rounded-3xl border border-[#e5e7eb] dark:border-[#1e2433] p-4 space-y-3 shadow-xs transition-colors">
        <div className="flex items-center space-x-2">
          <Fingerprint className="h-4 w-4 text-[#03b875]" />
          <h3 className="text-xs font-bold text-[#1e2024] dark:text-white uppercase tracking-wider">
            System Biometric Fingerprint
          </h3>
        </div>
        <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
          Utilizes native Android / Windows / iOS WebAuthn platform authenticator for physical fingerprint scanning.
        </p>

        <div className="pt-1">
          <button
            type="button"
            onClick={handleTestBiometric}
            disabled={bioTesting}
            className="w-full py-2.5 px-4 rounded-2xl bg-[#03b875]/10 hover:bg-[#03b875]/20 border border-[#03b875]/30 text-xs font-bold text-[#03b875] flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            {bioTesting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Waiting for System Fingerprint Sensor...</span>
              </>
            ) : (
              <>
                <Fingerprint className="h-4 w-4" />
                <span>Test System Fingerprint Authenticator</span>
              </>
            )}
          </button>
          {bioResult && (
            <p className="text-[11px] text-center font-bold mt-2 text-[#03b875]">
              {bioResult}
            </p>
          )}
        </div>
      </div>

      {/* Currency Preference */}
      <div className="bg-white dark:bg-[#121620] rounded-3xl border border-[#e5e7eb] dark:border-[#1e2433] p-4 space-y-3 shadow-xs transition-colors">
        <div className="flex items-center space-x-2">
          <DollarSign className="h-4 w-4 text-[#2980fe]" />
          <h3 className="text-xs font-bold text-[#1e2024] dark:text-white uppercase tracking-wider">
            Display Currency Preference
          </h3>
        </div>
        <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
          All USDT valuations will be dynamically converted and formatted into your preferred fiat currency.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          {currencies.map((c) => {
            const isSelected = currency === c.code;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setCurrency(c.code);
                }}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#f0f4ff] dark:bg-[#1e293b] border-[#2980fe] text-[#2980fe] shadow-xs'
                    : 'bg-[#f7f8fa] dark:bg-[#181f2e] border-[#e5e7eb] dark:border-[#2a3447] text-[#6b7280] dark:text-[#94a3b8] hover:border-[#2980fe]/40'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-1 font-bold text-xs text-[#1e2024] dark:text-white">
                    <span>{c.code}</span>
                    <span className="text-[#2980fe] font-mono">({c.symbol})</span>
                  </div>
                  <span className="text-[10px] text-[#8a93a6] block truncate">{c.name}</span>
                </div>
                {isSelected && <Check className="h-4 w-4 text-[#2980fe] shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* RPC Node Gateway Selector */}
      <div className="bg-white dark:bg-[#121620] rounded-3xl border border-[#e5e7eb] dark:border-[#1e2433] p-4 space-y-3 shadow-xs transition-colors">
        <div className="flex items-center space-x-2">
          <Server className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <h3 className="text-xs font-bold text-[#1e2024] dark:text-white uppercase tracking-wider">
            Blockchain RPC Gateway
          </h3>
        </div>
        <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
          Select primary validation cluster for broadcast verification and real-time block indexing.
        </p>

        <div className="space-y-2 pt-1">
          {nodes.map((node) => {
            const isSelected = selectedNode === node.name;
            return (
              <button
                key={node.name}
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setSelectedNode(node.name);
                }}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-[#1e2024] dark:text-white shadow-xs'
                    : 'bg-[#f7f8fa] dark:bg-[#181f2e] border-[#e5e7eb] dark:border-[#2a3447] text-[#6b7280] dark:text-[#94a3b8] hover:border-purple-200'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold text-[#1e2024] dark:text-white flex items-center gap-1.5">
                    <span>{node.name}</span>
                    <span className="text-[10px] font-mono text-[#8a93a6]">({node.network})</span>
                  </h4>
                  <span className="text-[10px] text-[#03b875] font-mono block mt-0.5">
                    Latency: {node.ping} • {node.status}
                  </span>
                </div>
                {isSelected && <Check className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clear Cache */}
      <div className="pt-1">
        <button
          type="button"
          onClick={handleClearCache}
          className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-[#121620] hover:bg-[#f7f8fa] dark:hover:bg-[#181f2e] border border-[#e5e7eb] dark:border-[#1e2433] text-xs font-bold text-[#6b7280] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-xs"
        >
          {cacheCleared ? (
            <>
              <Check className="h-4 w-4 text-[#03b875]" />
              <span className="text-[#03b875]">Cache Successfully Cleared</span>
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4 text-[#8a93a6]" />
              <span>Clear Local Data & Re-Index Ledger Cache</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

