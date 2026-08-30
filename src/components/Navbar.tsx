import React, { useState } from 'react';
import { 
  ShieldCheck, Wallet, ArrowDownLeft, ArrowUpRight, 
  Send, History, UserCheck, Lock, Bell, LogOut, 
  ChevronDown, LayoutDashboard, Settings, Activity, 
  ShieldAlert, CheckCircle2
} from 'lucide-react';
import { useAuth, AppView } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { 
    user, balance, unreadNotifications, activeView, 
    setActiveView, viewMode, setViewMode, logout,
    setIsDepositModalOpen, setIsWithdrawModalOpen, 
    setIsTransferModalOpen, setIsNotificationCenterOpen
  } = useAuth();

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  if (!user) return null;

  const isAdminRole = user.role === 'super_admin' || user.role === 'finance_manager' || user.role === 'compliance';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo & Switcher */}
        <div className="flex items-center space-x-6">
          <button 
            onClick={() => {
              if (viewMode === 'admin') setActiveView('admin');
              else setActiveView('dashboard');
            }}
            className="flex items-center space-x-2.5 text-left group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:border-emerald-500/40 transition-colors">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold tracking-tight text-white text-base">USDT</span>
                <span className="font-light text-slate-400 text-base">Vault</span>
                <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                  MPC CUSTODY
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-none">Enterprise Ledger Engine</p>
            </div>
          </button>

          {/* Role Mode Toggle (For Admin Users) */}
          {isAdminRole && (
            <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-medium">
              <button
                onClick={() => {
                  setViewMode('user');
                  if (activeView === 'admin') setActiveView('dashboard');
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
                  viewMode === 'user'
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wallet className="h-3.5 w-3.5" />
                <span>User Portal</span>
              </button>
              <button
                onClick={() => {
                  setViewMode('admin');
                  setActiveView('admin');
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
                  viewMode === 'admin'
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Admin Suite</span>
              </button>
            </div>
          )}
        </div>

        {/* Center Nav Links (For User Mode) */}
        {viewMode === 'user' && (
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeView === 'dashboard'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveView('deposit')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeView === 'deposit'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
              <span>Deposit</span>
            </button>

            <button
              onClick={() => setActiveView('withdraw')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeView === 'withdraw'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ArrowUpRight className="h-4 w-4 text-amber-400" />
              <span>Withdraw</span>
            </button>

            <button
              onClick={() => setActiveView('transfer')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeView === 'transfer'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Send className="h-4 w-4 text-blue-400" />
              <span>Transfer</span>
            </button>

            <button
              onClick={() => setActiveView('transactions')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeView === 'transactions'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <History className="h-4 w-4" />
              <span>Ledger</span>
            </button>

            <button
              onClick={() => setActiveView('kyc')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeView === 'kyc'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <UserCheck className="h-4 w-4" />
              <span>KYC</span>
              {user.kycTier > 0 && (
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 rounded-full font-bold">
                  T{user.kycTier}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveView('security')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeView === 'security'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Lock className="h-4 w-4" />
              <span>Security</span>
              {user.twoFactorEnabled && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              )}
            </button>
          </nav>
        )}

        {/* Right Section: Node status, Notification Bell & Profile Dropdown */}
        <div className="flex items-center space-x-3">
          {/* Live Network Health Status */}
          <div className="hidden lg:flex items-center space-x-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[11px] text-slate-300">TRC20 • ERC20 • BEP20</span>
          </div>

          {/* Quick Balance Preview */}
          {balance && (
            <div className="hidden sm:flex flex-col text-right pr-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Available</span>
              <span className="font-mono font-bold text-white text-sm">
                {balance.availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                <span className="text-emerald-400 text-xs">USDT</span>
              </span>
            </div>
          )}

          {/* Notification Button */}
          <button
            onClick={() => setIsNotificationCenterOpen(true)}
            className="relative rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-slate-950">
                {unreadNotifications}
              </span>
            )}
          </button>

          {/* Profile Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-700">
                {user.firstName[0]?.toUpperCase() || 'U'}
              </div>
              <span className="hidden sm:inline font-medium max-w-[120px] truncate">{user.email}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {isProfileOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsProfileOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="border-b border-slate-800 px-3 py-2.5">
                    <p className="text-xs font-semibold text-white truncate">{user.firstName} {user.lastName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-700 uppercase">
                        {user.role.replace('_', ' ')}
                      </span>
                      <span className={`rounded px-2 py-0.5 text-[10px] font-medium border ${
                        user.kycTier >= 2 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : user.kycTier === 1 
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        KYC Tier {user.kycTier}
                      </span>
                      {user.twoFactorEnabled && (
                        <span className="rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium">
                          2FA Active
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setActiveView('dashboard');
                        setViewMode('user');
                        setIsProfileOpen(false);
                      }}
                      className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Wallet Dashboard</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveView('security');
                        setIsProfileOpen(false);
                      }}
                      className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <Lock className="h-4 w-4" />
                      <span>Security & 2FA</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveView('kyc');
                        setIsProfileOpen(false);
                      }}
                      className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <UserCheck className="h-4 w-4" />
                      <span>Identity Verification</span>
                    </button>

                    {isAdminRole && (
                      <button
                        onClick={() => {
                          setViewMode('admin');
                          setActiveView('admin');
                          setIsProfileOpen(false);
                        }}
                        className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-xs text-amber-400 hover:bg-amber-500/10"
                      >
                        <ShieldAlert className="h-4 w-4" />
                        <span>Admin Backoffice Suite</span>
                      </button>
                    )}
                  </div>

                  <div className="border-t border-slate-800 pt-1">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
