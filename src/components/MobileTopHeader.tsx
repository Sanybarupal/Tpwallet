import React from 'react';
import { 
  QrCode, Bell, 
  ChevronDown, Sun, Moon,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CryptoIcon } from './CryptoIcons';

export const MobileTopHeader: React.FC = () => {
  const { 
    user, unreadNotifications, setActiveView, 
    openQRScanner, 
    triggerHaptic, activeNetwork, setIsWalletDrawerOpen,
    theme, toggleTheme
  } = useAuth();

  if (!user) return null;

  const networkBadges: Record<string, { label: string; tag: string; symbol: string }> = {
    TRC20: { label: 'TRON-1', tag: 'TRC20', symbol: 'TRX' },
    ERC20: { label: 'ETH-1', tag: 'ERC20', symbol: 'ETH' },
    BEP20: { label: 'BSC-1', tag: 'BEP20', symbol: 'BNB' },
  };

  const currentNet = networkBadges[activeNetwork] || networkBadges.TRC20;

  return (
    <header className="w-full bg-white dark:bg-[#121620] border-b border-[#f0f2f5] dark:border-[#1e2433] px-3.5 py-2.5 flex items-center justify-between z-30 shrink-0 select-none shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-colors">
      {/* Left: TokenPocket Signature Network & Wallet Switcher Pill */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic();
          setIsWalletDrawerOpen(true);
        }}
        className="flex items-center space-x-2 text-left p-1 pr-2.5 rounded-2xl bg-[#f7f8fa] dark:bg-[#181f2e] border border-[#e5e7eb] dark:border-[#2a3447] hover:border-[#2980fe]/50 hover:bg-[#eff6ff] dark:hover:bg-[#1e293b] transition-all shadow-xs cursor-pointer"
      >
        <CryptoIcon symbol={currentNet.symbol} size={28} />
        <div className="pr-1">
          <div className="flex items-center space-x-1">
            <span className="font-bold text-xs text-[#1e2024] dark:text-[#e2e8f0] leading-none">
              {currentNet.label}
            </span>
            <ChevronDown className="h-3 w-3 text-[#8a93a6]" />
          </div>
          <div className="flex items-center space-x-1 text-[9px] text-[#8a93a6] mt-0.5 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-[#03b875] inline-block animate-pulse" />
            <span className="truncate max-w-[100px]">{user.firstName || 'My'}'s Vault</span>
          </div>
        </div>
      </button>

      {/* Right Controls: Theme Switcher, QR Scanner, Wallet Drawer, Notification Bell, APK Toggle */}
      <div className="flex items-center space-x-1.5">
        {/* Theme Toggle (Light / Dark Mode Switch) */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            toggleTheme();
          }}
          className="p-2 rounded-xl bg-[#f7f8fa] dark:bg-[#181f2e] hover:bg-[#edf0f5] dark:hover:bg-[#20293a] text-[#4b5563] dark:text-[#cbd5e1] border border-[#e5e7eb] dark:border-[#2a3447] transition-colors cursor-pointer"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? (
            <Moon className="h-4 w-4 text-[#64748b] hover:text-[#2980fe]" />
          ) : (
            <Sun className="h-4 w-4 text-[#fbbf24]" />
          )}
        </button>

        {/* QR Scanner Trigger */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            openQRScanner();
          }}
          className="p-2 rounded-xl bg-[#f7f8fa] dark:bg-[#181f2e] hover:bg-[#edf0f5] dark:hover:bg-[#20293a] text-[#4b5563] dark:text-[#cbd5e1] border border-[#e5e7eb] dark:border-[#2a3447] transition-colors cursor-pointer"
          title="Scan QR Code"
        >
          <QrCode className="h-4 w-4 text-[#2980fe]" />
        </button>

        {/* Multi-Wallet Switcher Drawer Trigger */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setIsWalletDrawerOpen(true);
          }}
          className="p-2 rounded-xl bg-[#f7f8fa] dark:bg-[#181f2e] hover:bg-[#edf0f5] dark:hover:bg-[#20293a] text-[#4b5563] dark:text-[#cbd5e1] border border-[#e5e7eb] dark:border-[#2a3447] transition-colors cursor-pointer"
          title="Multi-Chain Wallet Drawer"
        >
          <Layers className="h-4 w-4 text-[#4b5563] dark:text-[#94a3b8]" />
        </button>

        {/* Notification Alert Bell */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setActiveView('notifications');
          }}
          className="p-2 rounded-xl bg-[#f7f8fa] dark:bg-[#181f2e] hover:bg-[#edf0f5] dark:hover:bg-[#20293a] text-[#4b5563] dark:text-[#cbd5e1] border border-[#e5e7eb] dark:border-[#2a3447] transition-colors relative cursor-pointer"
          title="Notifications"
        >
          <Bell className="h-4 w-4 text-[#4b5563] dark:text-[#94a3b8]" />
          {unreadNotifications > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#f5465c] px-1 text-[9px] font-bold text-white shadow-sm">
              {unreadNotifications}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

