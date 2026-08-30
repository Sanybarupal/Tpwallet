import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, AlertTriangle, Check, ShieldCheck, 
  RefreshCw, Info, Lock, X, Zap, ShieldAlert, QrCode, BookOpen
} from 'lucide-react';
import { BlockchainNetwork, NetworkConfig } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { CryptoIcon } from './CryptoIcons';

interface WithdrawModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  isStandalone?: boolean;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen = true,
  onClose,
  isStandalone = false,
}) => {
  const { 
    user, balance, refreshUserData, refreshBalance, 
    selectedWithdrawalPrefill, setSelectedWithdrawalPrefill,
    openQRScanner, setIsAddressBookOpen, triggerHaptic 
  } = useAuth();

  const [networks, setNetworks] = useState<NetworkConfig[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<BlockchainNetwork>('TRC20');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [addressValidationMsg, setAddressValidationMsg] = useState<{ isValid: boolean; message?: string } | null>(null);

  useEffect(() => {
    api.getNetworks()
      .then((res) => setNetworks(res.networks))
      .catch(console.error);
  }, []);

  // Handle prefilled state from QR scanner or Address Book
  useEffect(() => {
    if (selectedWithdrawalPrefill) {
      if (selectedWithdrawalPrefill.network) {
        setSelectedNetwork(selectedWithdrawalPrefill.network as BlockchainNetwork);
      }
      if (selectedWithdrawalPrefill.address) {
        setDestinationAddress(selectedWithdrawalPrefill.address);
      }
      if (selectedWithdrawalPrefill.amount) {
        setAmount(selectedWithdrawalPrefill.amount);
      }
      // Clear after applying
      setSelectedWithdrawalPrefill(undefined);
    }
  }, [selectedWithdrawalPrefill, setSelectedWithdrawalPrefill]);

  const activeConfig = networks.find((n) => n.network === selectedNetwork) || {
    network: selectedNetwork,
    name: selectedNetwork,
    symbol: `USDT-${selectedNetwork}`,
    minWithdrawal: 10,
    withdrawalFee: selectedNetwork === 'TRC20' ? 1.0 : selectedNetwork === 'ERC20' ? 3.5 : 0.8,
    confirmationsRequired: 1,
  };

  // Real-time address validation
  useEffect(() => {
    if (!destinationAddress) {
      setAddressValidationMsg(null);
      return;
    }

    const trimmed = destinationAddress.trim();
    if (selectedNetwork === 'TRC20') {
      const tronRegex = /^T[a-km-zA-HJ-NP-Z1-9]{33}$/;
      if (tronRegex.test(trimmed)) {
        setAddressValidationMsg({ isValid: true, message: 'Valid TRC-20 Tron address format' });
      } else {
        setAddressValidationMsg({ isValid: false, message: 'Invalid Tron address (starts with "T", 34 chars)' });
      }
    } else if (selectedNetwork === 'SOLANA') {
      const solRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
      if (solRegex.test(trimmed)) {
        setAddressValidationMsg({ isValid: true, message: 'Valid Solana Base58 address format' });
      } else {
        setAddressValidationMsg({ isValid: false, message: 'Invalid Solana address (Base58, 32-44 chars)' });
      }
    } else {
      // ERC20 / BEP20 / POLYGON
      const evmRegex = /^0x[a-fA-F0-9]{40}$/;
      if (evmRegex.test(trimmed)) {
        setAddressValidationMsg({ isValid: true, message: `Valid ${selectedNetwork} EVM hexadecimal address` });
      } else {
        setAddressValidationMsg({ isValid: false, message: `Invalid ${selectedNetwork} format (starts with 0x, 40 hex chars)` });
      }
    }
  }, [destinationAddress, selectedNetwork]);

  const numAmount = parseFloat(amount) || 0;
  const fee = activeConfig.withdrawalFee || 1.0;
  const netReceive = Math.max(0, Number((numAmount - fee).toFixed(4)));
  const availableBal = balance?.availableBalance || 0;

  const handlePercentage = (percent: number) => {
    triggerHaptic();
    if (availableBal <= 0) return;
    const calc = Number(((availableBal * percent) / 100).toFixed(2));
    setAmount(calc.toString());
  };

  const handleScanQR = () => {
    triggerHaptic();
    openQRScanner((scanned) => {
      setDestinationAddress(scanned);
    });
  };

  const handleOpenAddressBook = () => {
    triggerHaptic();
    setIsAddressBookOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic();
    setError(null);
    setSuccessMessage(null);

    if (!destinationAddress) {
      setError('Please enter a valid destination address.');
      return;
    }

    if (addressValidationMsg && !addressValidationMsg.isValid) {
      setError(addressValidationMsg.message || 'Invalid address format');
      return;
    }

    if (numAmount < activeConfig.minWithdrawal) {
      setError(`Minimum withdrawal is ${activeConfig.minWithdrawal} USDT for ${activeConfig.name}.`);
      return;
    }

    if (numAmount > availableBal) {
      setError(`Insufficient available balance. You have ${availableBal.toFixed(2)} USDT.`);
      return;
    }

    if (user?.twoFactorEnabled && !totpCode) {
      setError('Please enter your 6-digit 2FA code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.withdraw({
        network: selectedNetwork,
        destinationAddress: destinationAddress.trim(),
        amount: numAmount,
        totpCode: totpCode || undefined,
      });

      setSuccessMessage(res.message);
      setDestinationAddress('');
      setAmount('');
      setTotpCode('');
      await refreshUserData();
      await refreshBalance();
      setTimeout(() => {
        if (!isStandalone && onClose) {
          onClose();
        }
      }, 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Withdrawal failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen && !isStandalone) return null;

  const content = (
    <div className={`w-full ${isStandalone ? 'max-w-4xl mx-auto' : 'max-w-xl'} bg-white dark:bg-[#121620] rounded-3xl border border-[#e5e7eb] dark:border-[#1e2433] p-5 sm:p-6 shadow-2xl relative select-none text-[#1e2024] dark:text-white`}>
      {!isStandalone && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#9ca3af] hover:text-[#1e2024] dark:hover:text-white p-2 rounded-full hover:bg-[#f7f8fa] dark:hover:bg-[#182030] transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      {/* Header */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400">
          <ArrowUpRight className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#1e2024] dark:text-white">Send / Withdraw USDT</h2>
          <p className="text-xs text-[#6b7280] dark:text-[#94a3b8]">On-chain withdrawal with real-time fee calculation</p>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-3 text-xs text-rose-600 dark:text-rose-400 flex items-start space-x-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-3 text-xs text-emerald-700 dark:text-emerald-400 flex items-start space-x-2">
          <Check className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Network Selection */}
        <div>
          <label className="block text-xs font-semibold text-[#6b7280] dark:text-[#94a3b8] uppercase tracking-wider mb-1.5">
            Select Network
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {(networks.length > 0 ? networks.map(n => n.network) : (['TRC20', 'ERC20', 'BEP20', 'POLYGON', 'SOLANA'] as BlockchainNetwork[])).map((net) => {
              const isSelected = selectedNetwork === net;
              const netFee = networks.find(n => n.network === net)?.withdrawalFee || (net === 'TRC20' ? 1.0 : net === 'ERC20' ? 3.5 : 0.8);
              const symbol = net === 'TRC20' ? 'TRX' : net === 'ERC20' ? 'ETH' : net === 'BEP20' ? 'BNB' : net === 'POLYGON' ? 'POL' : 'SOL';
              return (
                <button
                  key={net}
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    setSelectedNetwork(net);
                  }}
                  className={`flex flex-col items-start p-2.5 rounded-2xl border transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'border-[#03b875] bg-emerald-50/50 dark:bg-emerald-500/10 text-[#1e2024] dark:text-white shadow-xs'
                      : 'border-[#e5e7eb] dark:border-[#1e2433] bg-[#f7f8fa] dark:bg-[#0b0e14] text-[#6b7280] dark:text-[#94a3b8] hover:border-[#03b875]/50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-1.5">
                      <CryptoIcon symbol={symbol} size={18} />
                      <span className="font-bold text-xs">{net}</span>
                    </div>
                    {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-[#03b875]"></span>}
                  </div>
                  <span className="text-[9px] text-[#03b875] font-mono mt-0.5 font-bold">{netFee} Fee</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Destination Address with QR and Address Book triggers */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[#6b7280] dark:text-[#94a3b8] uppercase tracking-wider">
              Recipient Address
            </label>
            <div className="flex items-center space-x-2 text-xs">
              <button
                type="button"
                onClick={handleScanQR}
                className="text-[#03b875] dark:text-emerald-400 hover:text-[#029b63] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>Scan</span>
              </button>
              <span className="text-[#9ca3af]">•</span>
              <button
                type="button"
                onClick={handleOpenAddressBook}
                className="text-[#2980fe] dark:text-blue-400 hover:text-[#1e58e6] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Contacts</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              placeholder={
                selectedNetwork === 'TRC20'
                  ? 'Paste TRON address (starts with T...)'
                  : 'Paste 0x address (0x71C83638b1805847F4094572424294b0525287f3)'
              }
              className={`w-full bg-[#f7f8fa] dark:bg-[#0b0e14] border rounded-2xl px-3.5 py-2.5 text-xs text-[#1e2024] dark:text-white font-mono focus:outline-none transition-colors ${
                addressValidationMsg
                  ? addressValidationMsg.isValid
                    ? 'border-[#03b875] focus:border-[#03b875]'
                    : 'border-rose-500 focus:border-rose-500'
                  : 'border-[#e5e7eb] dark:border-[#1e2433] focus:border-[#03b875]'
              }`}
              required
            />
          </div>
          {addressValidationMsg && (
            <p className={`text-[10px] mt-1 ${addressValidationMsg.isValid ? 'text-[#03b875] dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {addressValidationMsg.message}
            </p>
          )}
        </div>

        {/* Amount Input & Percentage Buttons */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[#6b7280] dark:text-[#94a3b8] uppercase tracking-wider">
              Amount (USDT)
            </label>
            <div className="text-xs text-[#6b7280] dark:text-[#94a3b8]">
              <span>Avail: </span>
              <span className="font-mono text-[#03b875] dark:text-emerald-400 font-bold">{availableBal.toFixed(2)} USDT</span>
            </div>
          </div>

          <div className="relative flex items-center">
            <input
              type="number"
              step="0.01"
              min={activeConfig.minWithdrawal}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Min ${activeConfig.minWithdrawal}.00`}
              className="w-full bg-[#f7f8fa] dark:bg-[#0b0e14] border border-[#e5e7eb] dark:border-[#1e2433] rounded-2xl px-3.5 py-2.5 text-xs text-[#1e2024] dark:text-white font-mono focus:border-[#03b875] focus:outline-none pr-16"
              required
            />
            <span className="absolute right-3.5 text-xs font-bold text-[#6b7280] dark:text-[#94a3b8]">USDT</span>
          </div>

          {/* 25%, 50%, 75%, 100% Quick Chips */}
          <div className="grid grid-cols-4 gap-1.5 mt-2">
            {[25, 50, 75, 100].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePercentage(p)}
                className="py-1.5 rounded-xl bg-[#f7f8fa] dark:bg-[#182030] hover:bg-emerald-50 dark:hover:bg-[#1e2433] border border-[#e5e7eb] dark:border-[#1e2433] text-[10px] font-bold text-[#1e2024] dark:text-white transition-colors cursor-pointer"
              >
                {p === 100 ? 'MAX' : `${p}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Breakdown Card: Network Fee, Net Receive */}
        <div className="bg-[#f7f8fa] dark:bg-[#0b0e14] rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] p-3.5 space-y-1.5 text-xs">
          <div className="flex justify-between items-center text-[#6b7280] dark:text-[#94a3b8]">
            <span>Network Mining Gas Fee</span>
            <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{fee.toFixed(2)} USDT</span>
          </div>
          <div className="flex justify-between items-center text-[#6b7280] dark:text-[#94a3b8]">
            <span>Minimum Allowed Withdrawal</span>
            <span className="font-mono text-[#1e2024] dark:text-white">{activeConfig.minWithdrawal} USDT</span>
          </div>
          <div className="pt-1.5 border-t border-[#e5e7eb] dark:border-[#1e2433] flex justify-between items-center">
            <span className="font-bold text-[#1e2024] dark:text-white">Net Receive Amount</span>
            <span className="font-mono text-[#03b875] dark:text-emerald-400 font-black text-sm">
              {netReceive.toFixed(2)} USDT
            </span>
          </div>
        </div>

        {/* 2FA Input if user has 2FA enabled */}
        {user?.twoFactorEnabled && (
          <div>
            <label className="block text-xs font-semibold text-[#6b7280] dark:text-[#94a3b8] uppercase tracking-wider mb-1.5">
              Google Authenticator (2FA TOTP)
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 h-4 w-4 text-[#03b875]" />
              <input
                type="text"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit code from Authenticator"
                className="w-full bg-[#f7f8fa] dark:bg-[#0b0e14] border border-[#e5e7eb] dark:border-[#1e2433] rounded-2xl pl-10 pr-3.5 py-2.5 text-xs text-[#1e2024] dark:text-white font-mono tracking-widest focus:border-[#03b875] focus:outline-none text-center"
                required
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || (numAmount <= 0) || (numAmount > availableBal)}
          className="w-full py-3 px-4 rounded-2xl bg-[#03b875] hover:bg-[#029b63] disabled:opacity-50 text-white font-bold text-xs shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Broadcasting to {selectedNetwork}...</span>
            </>
          ) : (
            <>
              <ArrowUpRight className="h-4 w-4" />
              <span>Authorize & Send {numAmount > 0 ? `${numAmount} USDT` : ''}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );

  if (isStandalone) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl">
        {content}
      </div>
    </div>
  );
};
