import React, { useState, useEffect } from 'react';
import { 
  ArrowDownLeft, Copy, Check, QrCode, AlertTriangle, 
  RefreshCw, ShieldCheck, Zap, ExternalLink, Info, X
} from 'lucide-react';
import { BlockchainNetwork, NetworkConfig } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { CryptoIcon } from './CryptoIcons';

interface DepositModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  isStandalone?: boolean;
}

export const DepositModal: React.FC<DepositModalProps> = ({ 
  isOpen = true, 
  onClose, 
  isStandalone = false 
}) => {
  const { refreshUserData, refreshBalance } = useAuth();
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

  // Testnet Ingest simulator state
  const [showSimulator, setShowSimulator] = useState(false);
  const [simAmount, setSimAmount] = useState('250.00');
  const [simFromAddr, setSimFromAddr] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSuccessMsg, setSimSuccessMsg] = useState<string | null>(null);

  const fetchAddress = async (net: BlockchainNetwork) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getAddress(net);
      setAddressData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load deposit address');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddress(selectedNetwork);
  }, [selectedNetwork]);

  const handleCopy = () => {
    if (!addressData?.address) return;
    navigator.clipboard.writeText(addressData.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        fromAddress: simFromAddr || undefined,
      });

      setSimSuccessMsg(res.message);
      await refreshUserData();
      await refreshBalance();
      setTimeout(() => setSimSuccessMsg(null), 6000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  if (!isOpen && !isStandalone) return null;

  const content = (
    <div className={`w-full ${isStandalone ? 'max-w-4xl mx-auto' : 'max-w-xl'} bg-white dark:bg-[#121620] rounded-3xl border border-[#e5e7eb] dark:border-[#1e2433] p-6 shadow-2xl relative text-[#1e2024] dark:text-white`}>
      {!isStandalone && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#9ca3af] hover:text-[#1e2024] dark:hover:text-white p-1 rounded-xl hover:bg-[#f7f8fa] dark:hover:bg-[#182030] transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-[#03b875] dark:text-emerald-400">
          <ArrowDownLeft className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#1e2024] dark:text-white">Deposit USDT</h2>
          <p className="text-xs text-[#6b7280] dark:text-[#94a3b8]">Select blockchain network and scan or copy your dedicated deposit address</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-3 text-xs text-rose-600 dark:text-rose-400 flex items-start space-x-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {simSuccessMsg && (
        <div className="mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-3 text-xs text-emerald-700 dark:text-emerald-400 flex items-start space-x-2">
          <Check className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{simSuccessMsg}</span>
        </div>
      )}

      {/* Network Selector Tabs */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-[#6b7280] dark:text-[#94a3b8] uppercase tracking-wider mb-2">
          Choose Network
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['TRC20', 'ERC20', 'BEP20'] as BlockchainNetwork[]).map((net) => {
            const isSelected = selectedNetwork === net;
            const symbol = net === 'TRC20' ? 'TRX' : net === 'ERC20' ? 'ETH' : 'BNB';
            return (
              <button
                key={net}
                type="button"
                onClick={() => setSelectedNetwork(net)}
                className={`flex flex-col items-start p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                  isSelected
                    ? 'border-[#03b875] bg-emerald-50/50 dark:bg-emerald-500/10 text-[#1e2024] dark:text-white shadow-xs'
                    : 'border-[#e5e7eb] dark:border-[#1e2433] bg-[#f7f8fa] dark:bg-[#0b0e14] text-[#6b7280] dark:text-[#94a3b8] hover:border-[#03b875]/50 hover:text-[#1e2024] dark:hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5">
                    <CryptoIcon symbol={symbol} size={20} />
                    <span className="font-bold text-xs">{net}</span>
                  </div>
                  {isSelected && <span className="h-2 w-2 rounded-full bg-[#03b875]"></span>}
                </div>
                <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8]">
                  {net === 'TRC20' ? 'Tron Network' : net === 'ERC20' ? 'Ethereum' : 'BNB Chain'}
                </span>
                <span className="text-[9px] text-[#9ca3af] mt-0.5 font-mono">
                  {net === 'TRC20' ? '~1 min (Fast)' : net === 'ERC20' ? '~3 min' : '~1 min'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* QR Code & Address Display */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-[#f7f8fa] dark:bg-[#0b0e14] rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433]">
          <RefreshCw className="h-8 w-8 text-[#03b875] animate-spin mb-3" />
          <p className="text-xs text-[#6b7280] dark:text-[#94a3b8]">Deriving secure MPC vault address...</p>
        </div>
      ) : addressData ? (
        <div className="bg-[#f7f8fa] dark:bg-[#0b0e14] rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            
            {/* QR Code */}
            <div className="flex flex-col items-center bg-white p-3 rounded-2xl shadow-xs border border-[#e5e7eb] shrink-0">
              <img
                src={addressData.qrDataUrl}
                alt="Deposit Address QR Code"
                className="h-40 w-40 object-contain rounded-xl"
              />
              <span className="text-[10px] text-[#6b7280] font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1">
                <QrCode className="h-3 w-3 text-[#03b875]" /> Scan with wallet
              </span>
            </div>

            {/* Address Details */}
            <div className="flex-1 w-full space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#6b7280] dark:text-[#94a3b8] uppercase tracking-wider mb-1">
                  Your Dedicated {selectedNetwork} Deposit Address
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white dark:bg-[#182030] border border-[#e5e7eb] dark:border-[#1e2433] rounded-xl px-3.5 py-2.5 font-mono text-xs text-[#03b875] dark:text-emerald-400 break-all select-all font-bold">
                    {addressData.address}
                  </div>
                  <button
                    onClick={handleCopy}
                    className={`flex items-center justify-center h-10 px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      copied
                        ? 'bg-[#03b875] text-white shadow-xs'
                        : 'bg-white dark:bg-[#182030] border border-[#e5e7eb] dark:border-[#1e2433] text-[#1e2024] dark:text-white hover:bg-emerald-50'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Specs Breakdown */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="bg-white dark:bg-[#182030] p-2.5 rounded-xl border border-[#e5e7eb] dark:border-[#1e2433]">
                  <span className="text-[#6b7280] dark:text-[#94a3b8] text-[10px] block">Minimum Deposit</span>
                  <span className="font-semibold text-[#1e2024] dark:text-white text-xs">
                    {addressData.networkConfig.minDeposit} USDT
                  </span>
                </div>
                <div className="bg-white dark:bg-[#182030] p-2.5 rounded-xl border border-[#e5e7eb] dark:border-[#1e2433]">
                  <span className="text-[#6b7280] dark:text-[#94a3b8] text-[10px] block">Confirmations</span>
                  <span className="font-semibold text-[#1e2024] dark:text-white text-xs">
                    {addressData.networkConfig.confirmationsRequired} Blocks
                  </span>
                </div>
                <div className="bg-white dark:bg-[#182030] p-2.5 rounded-xl border border-[#e5e7eb] dark:border-[#1e2433] col-span-2">
                  <span className="text-[#6b7280] dark:text-[#94a3b8] text-[10px] block">USDT Smart Contract</span>
                  <span className="font-mono text-[10px] text-[#1e2024] dark:text-white truncate block">
                    {addressData.networkConfig.contractAddress}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Instruction Note */}
          <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3 text-[11px] text-amber-800 dark:text-amber-300 flex items-start space-x-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              Send only <strong>USDT ({selectedNetwork})</strong> to this address. Sending any other asset or sending across incompatible networks may result in permanent loss.
            </div>
          </div>
        </div>
      ) : null}

      {/* Testnet & Live Deposit Simulator Trigger */}
      <div className="mt-5 border-t border-[#e5e7eb] dark:border-[#1e2433] pt-4">
        <button
          type="button"
          onClick={() => setShowSimulator(!showSimulator)}
          className="flex items-center justify-between w-full text-xs font-semibold text-[#6b7280] dark:text-[#94a3b8] hover:text-[#03b875] transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-1.5">
            <Zap className="h-4 w-4 text-[#03b875]" />
            <span>Test On-Chain Deposit Detection & Confirmations</span>
          </div>
          <span className="text-[11px] underline">
            {showSimulator ? 'Hide Tester' : 'Open Tester'}
          </span>
        </button>

        {showSimulator && (
          <form onSubmit={handleSimulateDeposit} className="mt-3 bg-[#f7f8fa] dark:bg-[#0b0e14] p-4 rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] space-y-3">
            <p className="text-xs text-[#6b7280] dark:text-[#94a3b8]">
              Broadcast an incoming deposit event into the custody mempool. The confirmation engine will track network blocks (1/{addressData?.networkConfig.confirmationsRequired || 1}) and automatically post double-entry ledger credits.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[#6b7280] dark:text-[#94a3b8] mb-1">Amount (USDT)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                  className="w-full bg-white dark:bg-[#182030] border border-[#e5e7eb] dark:border-[#1e2433] rounded-xl px-3 py-2 text-xs text-[#1e2024] dark:text-white font-mono focus:border-[#03b875] focus:outline-none"
                  placeholder="250.00"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#6b7280] dark:text-[#94a3b8] mb-1">Sender External Address (Optional)</label>
                <input
                  type="text"
                  value={simFromAddr}
                  onChange={(e) => setSimFromAddr(e.target.value)}
                  className="w-full bg-white dark:bg-[#182030] border border-[#e5e7eb] dark:border-[#1e2433] rounded-xl px-3 py-2 text-xs text-[#1e2024] dark:text-white font-mono focus:border-[#03b875] focus:outline-none"
                  placeholder={selectedNetwork === 'TRC20' ? 'TWa8mE2oE8cE4n4X6z3B1jK9w8L2pM5q7R' : '0x388C818CA8B9251b393131C08a73683246A16638'}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSimulating}
              className="w-full bg-[#03b875] hover:bg-[#029b63] text-white font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Broadcasting to Mempool...</span>
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5" />
                  <span>Broadcast Test Deposit ({simAmount} USDT)</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );

  if (isStandalone) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      {content}
    </div>
  );
};
