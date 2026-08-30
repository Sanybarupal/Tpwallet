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

  // Render Mobile App Layout
  return (
    <div className="h-full w-full bg-[#f7f8fa] dark:bg-[#0b0e14] text-[#1e2024] dark:text-[#e2e8f0] flex flex-col overflow-hidden select-none selection:bg-[#2980fe] selection:text-white relative">
      {/* Sticky Mobile Top Header */}
      <div className="sticky top-0 z-40 w-full shrink-0 shadow-xs">
        <MobileTopHeader />
      </div>

      {/* Screen Body View Container - Smooth Native Mobile Scrolling */}
      <main className="flex-1 overflow-y-auto px-3.5 pt-2.5 pb-4 no-scrollbar bg-[#f7f8fa] dark:bg-[#0b0e14]">
        {renderScreenContent()}
      </main>

      {/* Sticky Mobile Bottom Navigation Bar */}
      <div className="sticky bottom-0 z-40 w-full shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
        <AndroidBottomNav />
      </div>

      {renderModals()}
    </div>
  );
};
