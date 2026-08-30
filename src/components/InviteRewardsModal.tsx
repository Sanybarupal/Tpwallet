import React, { useState } from 'react';
import { X, Users, Gift, Copy, Check, Share2, Award, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface InviteRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteRewardsModal: React.FC<InviteRewardsModalProps> = ({ isOpen, onClose }) => {
  const { user, triggerHaptic } = useAuth();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !user) return null;

  const referralCode = `TP-${user.id.slice(0, 6).toUpperCase()}`;
  const referralLink = `https://tokenpocket.pro/join?ref=${referralCode}`;

  const handleCopyCode = () => {
    triggerHaptic();
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    triggerHaptic();
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in select-none">
      <div className="w-full max-w-md bg-white dark:bg-[#121620] border border-[#e5e7eb] dark:border-[#1e2433] rounded-3xl p-5 shadow-2xl space-y-4 text-[#1e2024] dark:text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f5f6f8] dark:border-[#182030] pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">
              <Gift className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#1e2024] dark:text-white">Invite & Earn 15% Rebate</h3>
              <p className="text-[10px] text-[#6b7280] dark:text-[#94a3b8]">TokenPocket VIP Partner Program</p>
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

        {/* Promo Hero */}
        <div className="p-4 bg-gradient-to-br from-purple-50 via-indigo-50/50 to-white dark:from-purple-900/40 dark:via-indigo-950/30 dark:to-slate-950 rounded-2xl border border-purple-200 dark:border-purple-500/30 text-center space-y-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
            <Sparkles className="h-3 w-3" /> Tier 1 Ambassador Status
          </span>
          <h4 className="text-lg font-black text-[#1e2024] dark:text-white">Earn USDT on Every Trade</h4>
          <p className="text-xs text-[#6b7280] dark:text-slate-300 max-w-xs mx-auto">
            Invite friends to deposit and transfer USDT. Receive instant 15% gas fee cashback into your multi-chain vault.
          </p>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-purple-200 dark:border-purple-500/20 text-center">
            <div>
              <span className="text-[10px] text-[#6b7280] dark:text-slate-400 block font-sans">Friends Invited</span>
              <span className="text-sm font-bold font-mono text-[#1e2024] dark:text-white">12</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6b7280] dark:text-slate-400 block font-sans">Commission Rate</span>
              <span className="text-sm font-bold font-mono text-purple-600 dark:text-purple-400">15.0%</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6b7280] dark:text-slate-400 block font-sans">Total Earned</span>
              <span className="text-sm font-bold font-mono text-[#03b875]">48.50 USDT</span>
            </div>
          </div>
        </div>

        {/* Referral Code / Link Boxes */}
        <div className="space-y-2.5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#6b7280] dark:text-[#94a3b8] block">Your Exclusive Referral Code</label>
            <div className="flex items-center justify-between bg-[#f7f8fa] dark:bg-[#0b0e14] p-2.5 rounded-xl border border-[#e5e7eb] dark:border-[#1e2433]">
              <span className="text-xs font-mono font-black text-purple-700 dark:text-purple-300 tracking-wider">
                {referralCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center space-x-1 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-bold px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-500/10 cursor-pointer"
              >
                {copiedCode ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#6b7280] dark:text-[#94a3b8] block">Invite URL</label>
            <div className="flex items-center justify-between bg-[#f7f8fa] dark:bg-[#0b0e14] p-2.5 rounded-xl border border-[#e5e7eb] dark:border-[#1e2433]">
              <span className="text-[11px] font-mono text-[#6b7280] dark:text-[#94a3b8] truncate max-w-[200px]">
                {referralLink}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center space-x-1 text-xs text-[#2980fe] dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 font-bold px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 cursor-pointer"
              >
                {copiedLink ? <Check className="h-3 w-3" /> : <Share2 className="h-3 w-3" />}
                <span>{copiedLink ? 'Copied' : 'Share'}</span>
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyLink}
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
        >
          <Share2 className="h-4 w-4" />
          <span>Share Invitation Link</span>
        </button>
      </div>
    </div>
  );
};
