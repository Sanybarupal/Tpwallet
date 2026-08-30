import React, { useState } from 'react';
import { 
  Send, Check, AlertTriangle, RefreshCw, 
  Lock, X, User, Zap, Info, ShieldCheck
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { CryptoIcon } from './CryptoIcons';

interface TransferModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  isStandalone?: boolean;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen = true,
  onClose,
  isStandalone = false,
}) => {
  const { user, balance, refreshUserData, refreshBalance } = useAuth();
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const availableBal = balance?.availableBalance || 0;
  const numAmount = parseFloat(amount) || 0;

  const handleMaxClick = () => {
    if (availableBal > 0) {
      setAmount(availableBal.toString());
    }
  };

  const handleQuickSelectRecipient = (email: string) => {
    setRecipientEmail(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanEmail = recipientEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter the recipient email.');
      return;
    }

    if (cleanEmail === user?.email.toLowerCase()) {
      setError('Cannot transfer funds to your own account.');
      return;
    }

    if (numAmount <= 0) {
      setError('Transfer amount must be greater than zero.');
      return;
    }

    if (numAmount > availableBal) {
      setError(`Insufficient available balance. You have ${availableBal.toFixed(2)} USDT.`);
      return;
    }

    if (user?.twoFactorEnabled && !totpCode) {
      setError('Please provide your 6-digit 2FA code to authorize transfer.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.transfer({
        recipientEmail: cleanEmail,
        amount: numAmount,
        note: note || undefined,
        totpCode: totpCode || undefined,
      });

      setSuccessMessage(res.message);
      setRecipientEmail('');
      setAmount('');
      setNote('');
      setTotpCode('');
      await refreshUserData();
      await refreshBalance();
      setTimeout(() => {
        if (!isStandalone && onClose) {
          onClose();
        }
      }, 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setIsSubmitting(false);
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
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-[#2980fe] dark:text-blue-400">
          <Send className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#1e2024] dark:text-white">Internal USDT Transfer</h2>
          <p className="text-xs text-[#6b7280] dark:text-[#94a3b8]">Instant off-chain atomic ledger transfer with 0% network gas fee</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-3 text-xs text-rose-600 dark:text-rose-400 flex items-start space-x-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-3 text-xs text-emerald-700 dark:text-emerald-400 flex items-start space-x-2">
          <Check className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Counterparty Quick Picks */}
      <div className="mb-4 bg-[#f7f8fa] dark:bg-[#0b0e14] p-3 rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433]">
        <span className="text-[11px] font-semibold text-[#6b7280] dark:text-[#94a3b8] block mb-2">
          Quick Select Counterparty Account:
        </span>
        <div className="flex flex-wrap gap-2">
          {user?.email !== 'bob@trader.io' && (
            <button
              type="button"
              onClick={() => handleQuickSelectRecipient('bob@trader.io')}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-[#182030] border border-[#e5e7eb] dark:border-[#1e2433] text-xs text-[#1e2024] dark:text-white hover:border-[#2980fe] hover:text-[#2980fe] transition-colors cursor-pointer shadow-xs"
            >
              <User className="h-3.5 w-3.5 text-[#2980fe]" />
              <span>bob@trader.io</span>
            </button>
          )}
          {user?.email !== 'alice@crypto.io' && (
            <button
              type="button"
              onClick={() => handleQuickSelectRecipient('alice@crypto.io')}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-[#182030] border border-[#e5e7eb] dark:border-[#1e2433] text-xs text-[#1e2024] dark:text-white hover:border-[#2980fe] hover:text-[#2980fe] transition-colors cursor-pointer shadow-xs"
            >
              <User className="h-3.5 w-3.5 text-[#2980fe]" />
              <span>alice@crypto.io</span>
            </button>
          )}
          {user?.email !== 'admin@usdtvault.io' && (
            <button
              type="button"
              onClick={() => handleQuickSelectRecipient('admin@usdtvault.io')}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-[#182030] border border-[#e5e7eb] dark:border-[#1e2433] text-xs text-[#1e2024] dark:text-white hover:border-[#2980fe] hover:text-[#2980fe] transition-colors cursor-pointer shadow-xs"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
              <span>admin@usdtvault.io</span>
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Recipient Email */}
        <div>
          <label className="block text-xs font-semibold text-[#6b7280] dark:text-[#94a3b8] uppercase tracking-wider mb-1.5">
            Recipient Account Email
          </label>
          <div className="relative flex items-center">
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="e.g. bob@trader.io"
              className="w-full bg-[#f7f8fa] dark:bg-[#0b0e14] border border-[#e5e7eb] dark:border-[#1e2433] rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-[#1e2024] dark:text-white placeholder-[#9ca3af] focus:border-[#2980fe] focus:outline-none"
              required
            />
            <User className="absolute right-3.5 h-4 w-4 text-[#9ca3af]" />
          </div>
        </div>

        {/* Transfer Amount */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[#6b7280] dark:text-[#94a3b8] uppercase tracking-wider">
              Transfer Amount
            </label>
            <div className="flex items-center space-x-1.5 text-xs text-[#6b7280] dark:text-[#94a3b8]">
              <span>Available:</span>
              <span className="font-mono font-bold text-[#1e2024] dark:text-white">
                {availableBal.toFixed(2)} USDT
              </span>
            </div>
          </div>
          <div className="relative flex items-center">
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={availableBal}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[#f7f8fa] dark:bg-[#0b0e14] border border-[#e5e7eb] dark:border-[#1e2433] rounded-xl pl-3.5 pr-20 py-2.5 text-sm text-[#1e2024] dark:text-white font-mono focus:border-[#2980fe] focus:outline-none"
              required
            />
            <div className="absolute right-2 flex items-center space-x-1.5">
              <button
                type="button"
                onClick={handleMaxClick}
                className="px-2 py-1 bg-white dark:bg-[#182030] hover:bg-blue-50 text-[#2980fe] text-[10px] font-bold rounded-md border border-[#e5e7eb] dark:border-[#1e2433] transition-colors cursor-pointer"
              >
                MAX
              </button>
              <div className="flex items-center space-x-1 pl-1">
                <CryptoIcon symbol="USDT" size={20} />
                <span className="text-xs text-[#1e2024] dark:text-white font-bold">USDT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transfer Note / Memo */}
        <div>
          <label className="block text-xs font-semibold text-[#6b7280] dark:text-[#94a3b8] uppercase tracking-wider mb-1.5">
            Transaction Note / Memo (Optional)
          </label>
          <input
            type="text"
            maxLength={100}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Invoice payment #1042"
            className="w-full bg-[#f7f8fa] dark:bg-[#0b0e14] border border-[#e5e7eb] dark:border-[#1e2433] rounded-xl px-3.5 py-2.5 text-xs text-[#1e2024] dark:text-white placeholder-[#9ca3af] focus:border-[#2980fe] focus:outline-none"
          />
        </div>

        {/* Fee & Speed Badge */}
        <div className="bg-[#f7f8fa] dark:bg-[#0b0e14] rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] p-3.5 space-y-2 text-xs">
          <div className="flex justify-between text-[#6b7280] dark:text-[#94a3b8]">
            <span>Settlement Type</span>
            <span className="text-[#03b875] dark:text-emerald-400 font-semibold flex items-center gap-1">
              <Zap className="h-3.5 w-3.5" /> Instant Atomic Settlement
            </span>
          </div>
          <div className="flex justify-between text-[#6b7280] dark:text-[#94a3b8]">
            <span>Transfer Fee</span>
            <span className="text-[#03b875] dark:text-emerald-400 font-mono font-bold">0.00 USDT (FREE)</span>
          </div>
          <div className="border-t border-[#e5e7eb] dark:border-[#1e2433] pt-2 flex justify-between font-semibold">
            <span className="text-[#1e2024] dark:text-white">Recipient Receives</span>
            <span className="font-mono text-[#1e2024] dark:text-white text-sm">{numAmount.toFixed(2)} USDT</span>
          </div>
        </div>

        {/* 2FA Input (If Enabled) */}
        {user?.twoFactorEnabled && (
          <div>
            <label className="block text-xs font-semibold text-[#6b7280] dark:text-[#94a3b8] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-[#03b875]" />
              Two-Factor Authentication (2FA) Code
            </label>
            <input
              type="text"
              maxLength={8}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              placeholder="Enter 6-digit code"
              className="w-full bg-[#f7f8fa] dark:bg-[#0b0e14] border border-[#e5e7eb] dark:border-[#1e2433] rounded-xl px-3.5 py-2.5 text-xs text-[#1e2024] dark:text-white font-mono tracking-widest text-center focus:border-[#03b875] focus:outline-none"
              required
            />
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || numAmount <= 0 || numAmount > availableBal}
          className={`w-full font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            numAmount <= 0 || numAmount > availableBal
              ? 'bg-[#f7f8fa] dark:bg-[#182030] text-[#9ca3af] border border-[#e5e7eb] dark:border-[#1e2433] cursor-not-allowed'
              : 'bg-[#2980fe] hover:bg-[#1e58e6] text-white shadow-xs'
          }`}
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Executing Atomic Transfer...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Send {numAmount > 0 ? `${numAmount.toFixed(2)} USDT` : ''} Instantly</span>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      {content}
    </div>
  );
};
