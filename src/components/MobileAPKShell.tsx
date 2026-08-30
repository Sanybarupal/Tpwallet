import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AndroidBottomNav } from './AndroidBottomNav';
import { MobileTopHeader } from './MobileTopHeader';
import { SplashScreen } from './SplashScreen';
import { DashboardView } from '../views/DashboardView';
import { WalletAssetsView } from '../views/WalletAssetsView';
import { MarketsView } from '../views/MarketsView';
import { DiscoverView } from '../views/DiscoverView';
import { ReceiveView } from '../views/ReceiveView';
import { TransactionsView } from '../views/TransactionsView';
import { NotificationsView } from '../views/NotificationsView';
import { ProfileView } from '../views/ProfileView';
import { KYCCenterView } from '../views/KYCCenterView';
import { SecurityCenterView } from '../views/SecurityCenterView';
import { SettingsView } from '../views/SettingsView';
import { HelpSupportView } from '../views/HelpSupportView';
import { AdminBackofficeView } from '../views/AdminBackofficeView';
import { DepositModal } from './DepositModal';
import { WithdrawModal } from './WithdrawModal';
import { TransferModal } from './TransferModal';
import { TransactionDetailModal } from './TransactionDetailModal';
import { QRScannerModal } from '../views/QRScannerModal';
import { AddressBookModal } from '../views/AddressBookModal';
import { MultiChainWalletDrawer } from './MultiChainWalletDrawer';
import { Smartphone, Monitor, ShieldCheck, Zap, Server, Activity } from 'lucide-react';

export const MobileAPKShell: React.FC = () => {
  const { 
    user, activeView, viewMode, 
    isDeviceFrameMode, setIsDeviceFrameMode,
    isDepositModalOpen, setIsDepositModalOpen,
    isWithdrawModalOpen, setIsWithdrawModalOpen,
    isTransferModalOpen, setIsTransferModalOpen,
    isReceiveModalOpen, setIsReceiveModalOpen,
    selectedTxDetail, setSelectedTxDetail,
    triggerHaptic 
  } = useAuth();

  const [hasShownSplash, setHasShownSplash] = useState(() => {
    // Only show splash once per session
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('usdt_vault_splash_seen') === 'true';
    }
    return false;
  });

  const handleSplashComplete = () => {
    setHasShownSplash(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('usdt_vault_splash_seen', 'true');
    }
  };

  if (!hasShownSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // Render active view screen content
  const renderScreenContent = () => {
    if (viewMode === 'admin' || activeView === 'admin') {
      return <AdminBackofficeView />;
    }

    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'wallet':
        return <WalletAssetsView />;
      case 'markets':
        return <MarketsView />;
      case 'discover':
        return <DiscoverView />;
      case 'receive':
        return <ReceiveView />;
      case 'transactions':
        return <TransactionsView />;
      case 'notifications':
        return <NotificationsView />;
      case 'profile':
        return <ProfileView />;
      case 'kyc':
        return <KYCCenterView />;
      case 'security':
        return <SecurityCenterView />;
      case 'settings':
        return <SettingsView />;
      case 'support':
        return <HelpSupportView />;
      case 'deposit':
        return <DepositModal isStandalone={true} />;
      case 'withdraw':
        return <WithdrawModal isStandalone={true} />;
      case 'transfer':
        return <TransferModal isStandalone={true} />;
      default:
        return <DashboardView />;
    }
  };

  // Modals layer
  const renderModals = () => (
    <>
      <MultiChainWalletDrawer />

      {isDepositModalOpen && (
        <DepositModal 
          isOpen={isDepositModalOpen} 
          onClose={() => setIsDepositModalOpen(false)} 
        />
      )}

      {isWithdrawModalOpen && (
        <WithdrawModal 
          isOpen={isWithdrawModalOpen} 
          onClose={() => setIsWithdrawModalOpen(false)} 
        />
      )}

      {isTransferModalOpen && (
        <TransferModal 
          isOpen={isTransferModalOpen} 
          onClose={() => setIsTransferModalOpen(false)} 
        />
      )}

      {selectedTxDetail && (
        <TransactionDetailModal 
          tx={selectedTxDetail} 
          onClose={() => setSelectedTxDetail(null)} 
        />
      )}

      <QRScannerModal />
      <AddressBookModal />
    </>
  );

  // If in APK Device Frame Mode (Desktop container with realistic Android phone bezel)
  if (isDeviceFrameMode) {
    return (
      <div className="min-h-screen bg-[#eaecf2] dark:bg-[#080a0f] text-[#1e2024] dark:text-[#e2e8f0] flex flex-col items-center justify-center p-0 md:p-6 lg:p-8 select-none relative overflow-x-hidden">
        {/* Ambient desktop backdrop lighting */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
        </div>

        {/* Floating Desktop Utility Toolbar */}
        <div className="hidden md:flex items-center justify-between w-full max-w-lg mb-3 px-2 relative z-10">
          <div className="flex items-center space-x-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#2980fe]/10 text-[#2980fe] border border-[#2980fe]/20">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-bold text-[#1e2024] dark:text-white">
              TokenPocket Multi-Chain <span className="text-[#2980fe] font-mono text-[11px]">PRO v2.5</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                triggerHaptic();
                setIsDeviceFrameMode(false);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#161b26] hover:bg-slate-50 dark:hover:bg-[#1c2333] border border-[#d1d5db] dark:border-[#2a3447] text-[#4b5563] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Monitor className="h-3.5 w-3.5" />
              <span>Full Width View</span>
            </button>
          </div>
        </div>

        {/* Realistic Android Smartphone Chassis in Clean Light / Adaptive Style */}
        <div className="relative z-10 w-full max-w-[430px] h-[100dvh] md:h-[870px] bg-[#f7f8fa] dark:bg-[#0b0e14] md:rounded-[44px] md:border-[10px] md:border-[#1e293b] dark:md:border-[#1e2433] md:shadow-[0_20px_50px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden">
          
          {/* Top Speaker Ear-piece Grill (Physical bezel detail) */}
          <div className="hidden md:flex justify-center pt-2 pb-1 bg-white dark:bg-[#121620] shrink-0 border-b border-[#f0f2f5] dark:border-[#1e2433]">
            <div className="w-16 h-1 bg-[#d1d5db] dark:bg-[#334155] rounded-full" />
          </div>

          {/* Sticky Mobile Top Header */}
          <div className="sticky top-0 z-40 w-full shrink-0 shadow-xs">
            <MobileTopHeader />
          </div>

          {/* Screen Body View Container - Scrollable Middle Area */}
          <main className="flex-1 overflow-y-auto px-3.5 pt-2.5 pb-3 no-scrollbar bg-[#f7f8fa] dark:bg-[#0b0e14]">
            {renderScreenContent()}
          </main>

          {/* Sticky Android Bottom Navigation */}
          <div className="sticky bottom-0 z-40 w-full shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
            <AndroidBottomNav />
          </div>

          {/* Android Home Navigation Gesture Pill */}
          <div className="hidden md:flex justify-center py-1.5 bg-white dark:bg-[#121620] shrink-0 border-t border-[#f0f2f5] dark:border-[#1e2433]">
            <div className="w-28 h-1 bg-[#9ca3af] dark:bg-[#475569] rounded-full" />
          </div>
        </div>

        {renderModals()}
      </div>
    );
  }

  // Edge-to-Edge Responsive Mode (Fluid full-width for mobile or expanded desktop with fixed top & bottom nav)
  return (
    <div className="h-[100dvh] bg-[#f7f8fa] dark:bg-[#0b0e14] text-[#1e2024] dark:text-[#e2e8f0] flex flex-col overflow-hidden select-none selection:bg-[#2980fe] selection:text-white">
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-40 w-full shrink-0 shadow-xs">
        <div className="max-w-3xl mx-auto">
          <MobileTopHeader />
        </div>
      </div>

      {/* Main Screen Body - Smooth Scrollable */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-3.5 sm:px-6 pt-3 pb-6 overflow-y-auto">
        {renderScreenContent()}
      </main>

      {/* Sticky APK Bottom Navigation Bar */}
      <div className="sticky bottom-0 z-40 w-full shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
        <div className="max-w-3xl mx-auto">
          <AndroidBottomNav />
        </div>
      </div>

      {renderModals()}
    </div>
  );

};
