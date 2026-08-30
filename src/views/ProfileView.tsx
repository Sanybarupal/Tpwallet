import React, { useState } from 'react';
import { 
  User, ShieldCheck, ShieldAlert, Key, BookOpen, Settings, 
  HelpCircle, LogOut, ChevronRight, Copy, Check, 
  DollarSign, Globe, Server, UserCheck, Shield, Gift,
  Award, Sparkles, Database, Trash2, Cpu, ExternalLink,
  Lock, Share2, BellRing
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { InviteRewardsModal } from '../components/InviteRewardsModal';
import { KeyringBackupModal } from '../components/KeyringBackupModal';

export const ProfileView: React.FC = () => {
  const { 
    user, logout, setActiveView, setViewMode, 
    setIsAddressBookOpen, currency, triggerHaptic,
    setIsWalletDrawerOpen, activeNetwork
  } = useAuth();

  const [copied, setCopied] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === 'super_admin' || user.role === 'finance_manager' || user.role === 'compliance';

  // Calculate Security Score
  let securityScore = 50;
  if (user.twoFactorEnabled) securityScore += 25;
  if (user.kycTier >= 1) securityScore += 25;

  const handleCopyUserId = () => {
    triggerHaptic();
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyInviteCode = () => {
    triggerHaptic();
    const code = `TP-${user.id.slice(0, 6).toUpperCase()}`;
    navigator.clipboard.writeText(code);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const handleClearCache = () => {
    triggerHaptic();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2500);
  };

  const navItems = [
    {
      id: 'backup',
      label: 'HD Keyring & Seed Backup',
      sub: 'Export encrypted seed phrase & keys',
      icon: Key,
      iconColor: 'text-amber-400 bg-amber-500/10',
      badge: 'Protected',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      action: () => {
        triggerHaptic();
        setIsBackupOpen(true);
      },
    },
    {
      id: 'kyc',
      label: 'Identity Verification (KYC)',
      sub: user.kycTier === 2 ? 'Tier 2 (Enterprise Unlimited)' : user.kycTier === 1 ? 'Tier 1 (Verified)' : 'Tier 0 (Unverified)',
      icon: ShieldCheck,
      iconColor: user.kycTier > 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10',
      badge: `Tier ${user.kycTier}`,
      badgeColor: user.kycTier > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      action: () => {
        triggerHaptic();
        setActiveView('kyc');
      },
    },
    {
      id: 'security',
      label: 'Security & 2FA Center',
      sub: user.twoFactorEnabled ? 'Google Authenticator Active' : '2FA Protection Recommended',
      icon: Shield,
      iconColor: user.twoFactorEnabled ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10',
      badge: user.twoFactorEnabled ? '2FA ON' : '2FA OFF',
      badgeColor: user.twoFactorEnabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      action: () => {
        triggerHaptic();
        setActiveView('security');
      },
    },
    {
      id: 'address-book',
      label: 'Address Book & Contacts',
      sub: 'Manage trusted recipient addresses',
      icon: BookOpen,
      iconColor: 'text-blue-400 bg-blue-500/10',
      action: () => {
        triggerHaptic();
        setIsAddressBookOpen(true);
      },
    },
    {
      id: 'settings',
      label: 'Currency & Node Settings',
      sub: `Display: ${currency} • RPC Nodes Active`,
      icon: Settings,
      iconColor: 'text-purple-400 bg-purple-500/10',
      badge: currency,
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      action: () => {
        triggerHaptic();
        setActiveView('settings');
      },
    },
    {
      id: 'support',
      label: 'Help Center & 24/7 AI Desk',
      sub: 'Searchable FAQ, guides & instant AI desk',
      icon: HelpCircle,
      iconColor: 'text-teal-400 bg-teal-500/10',
      action: () => {
        triggerHaptic();
        setActiveView('support');
      },
    },
  ];

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* User Header Profile Card */}
      <div className="bg-white dark:bg-[#121620] rounded-3xl border border-[#e5e7eb] dark:border-[#1e2433] p-5 shadow-xs space-y-4 transition-colors">
        <div className="flex items-center space-x-3.5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2980fe] text-white font-black text-xl shadow-md shadow-blue-500/20">
            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-[#1e2024] dark:text-white truncate">
                {user.firstName} {user.lastName}
              </h3>
              <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                VIP 1
              </span>
            </div>
            <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] truncate">{user.email}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-mono font-bold bg-[#f7f8fa] dark:bg-[#181f2e] text-[#1e2024] dark:text-white px-2 py-0.5 rounded-full border border-[#e5e7eb] dark:border-[#2a3447] uppercase">
                {user.role.replace('_', ' ')}
              </span>
              <span className="text-[10px] font-mono text-[#03b875] bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 font-bold">
                KYC Level {user.kycTier}
              </span>
            </div>
          </div>
        </div>

        {/* Security Health Score Bar */}
        <div className="bg-[#f7f8fa] dark:bg-[#181f2e] p-3 rounded-2xl border border-[#e5e7eb] dark:border-[#2a3447] space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-[#1e2024] dark:text-white flex items-center gap-1.5">
              <Shield className={`h-3.5 w-3.5 ${securityScore === 100 ? 'text-[#03b875]' : 'text-amber-500'}`} />
              Security Health
            </span>
            <span className={`font-mono ${securityScore === 100 ? 'text-[#03b875]' : 'text-amber-600 dark:text-amber-400'}`}>
              {securityScore}/100 {securityScore === 100 ? '(Excellent)' : '(Needs Action)'}
            </span>
          </div>
          <div className="w-full bg-[#e5e7eb] dark:bg-[#2a3447] h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${securityScore === 100 ? 'bg-[#03b875]' : 'bg-amber-500'}`}
              style={{ width: `${securityScore}%` }}
            />
          </div>
        </div>

        {/* User ID & Invite Code 1-Tap Copy */}
        <div className="grid grid-cols-2 gap-2">
          <div
            onClick={handleCopyUserId}
            className="flex items-center justify-between bg-[#f7f8fa] dark:bg-[#181f2e] p-2.5 rounded-2xl border border-[#e5e7eb] dark:border-[#2a3447] cursor-pointer hover:border-[#2980fe]/40 transition-colors"
          >
            <div className="min-w-0">
              <span className="text-[#8a93a6] font-sans text-[10px] block">User UID:</span>
              <span className="text-[#1e2024] dark:text-white font-mono text-xs font-semibold truncate block">
                {user.id.slice(0, 8)}...
              </span>
            </div>
            <button
              type="button"
              className="text-xs text-[#2980fe] font-semibold p-1 cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>

          <div
            onClick={handleCopyInviteCode}
            className="flex items-center justify-between bg-[#f7f8fa] dark:bg-[#181f2e] p-2.5 rounded-2xl border border-[#e5e7eb] dark:border-[#2a3447] cursor-pointer hover:border-purple-500/40 transition-colors"
          >
            <div className="min-w-0">
              <span className="text-[#8a93a6] font-sans text-[10px] block">Invite Code:</span>
              <span className="text-purple-600 dark:text-purple-400 font-mono text-xs font-semibold truncate block">
                TP-{user.id.slice(0, 6).toUpperCase()}
              </span>
            </div>
            <button
              type="button"
              className="text-xs text-purple-600 dark:text-purple-400 font-semibold p-1 cursor-pointer"
            >
              {copiedInvite ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Invite & Rewards Banner */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic();
          setIsInviteOpen(true);
        }}
        className="w-full p-4 rounded-3xl bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50/40 dark:from-purple-950/30 dark:via-indigo-950/30 dark:to-purple-950/20 border border-purple-200 dark:border-purple-800/60 flex items-center justify-between text-left hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-all shadow-xs group cursor-pointer"
      >
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-[#1e2024] dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                Invite Friends & Earn 15% Rebate
              </h4>
              <span className="text-[9px] font-mono font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded">
                PROMO
              </span>
            </div>
            <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">Share referral link & receive automatic USDT rewards</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-purple-600 dark:text-purple-400 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Admin Suite Fast Jump (If admin role) */}
      {isAdmin && (
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setViewMode('admin');
            setActiveView('admin');
          }}
          className="w-full p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-left hover:bg-amber-100/60 dark:hover:bg-amber-900/30 transition-all shadow-xs group cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">Admin & Compliance Suite</h4>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">Ledger balance, freeze users, approvals & audits</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-amber-700 dark:text-amber-300 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* Navigation List */}
      <div className="bg-white dark:bg-[#121620] rounded-3xl border border-[#e5e7eb] dark:border-[#1e2433] divide-y divide-[#f5f6f8] dark:divide-[#1a202c] overflow-hidden shadow-xs">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.action}
              className="w-full p-3.5 flex items-center justify-between hover:bg-[#f7f8fa] dark:hover:bg-[#181f2e] transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.iconColor}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1e2024] dark:text-white group-hover:text-[#2980fe] transition-colors">
                    {item.label}
                  </h4>
                  <p className="text-[10px] text-[#8a93a6]">{item.sub}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {item.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-[#9ca3af] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>

      {/* System Diagnostic / Cache Cleaner */}
      <div className="bg-white dark:bg-[#121620] rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] p-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-2.5">
          <Database className="h-4 w-4 text-[#8a93a6]" />
          <div>
            <h5 className="text-xs font-bold text-[#1e2024] dark:text-white">Local RPC Cache</h5>
            <p className="text-[10px] text-[#8a93a6]">12.4 MB stored block headers</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClearCache}
          className="px-3 py-1 bg-[#f7f8fa] dark:bg-[#181f2e] hover:bg-[#e5e7eb] dark:hover:bg-[#2a3447] text-[#1e2024] dark:text-white font-bold text-[11px] rounded-xl flex items-center gap-1 transition-colors border border-[#e5e7eb] dark:border-[#2a3447] cursor-pointer"
        >
          {cacheCleared ? <Check className="h-3 w-3 text-[#03b875]" /> : <Trash2 className="h-3 w-3" />}
          <span>{cacheCleared ? 'Cleared' : 'Clean'}</span>
        </button>
      </div>

      {/* Logout Action */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            logout();
          }}
          className="w-full py-3 px-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out of Account</span>
        </button>
      </div>

      {/* App Metadata / Build info */}
      <div className="text-center text-[10px] text-[#9ca3af] font-mono pt-2">
        TokenPocket Multi-Chain APK • v2.5.0 • MPC Enclave Active
      </div>

      {/* Invite Rewards Modal */}
      <InviteRewardsModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />

      {/* Keyring Backup Modal */}
      <KeyringBackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
      />
    </div>
  );
};
