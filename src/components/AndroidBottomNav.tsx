import React from 'react';
import { 
  Wallet, TrendingUp, Compass, FileText, User, ShieldAlert 
} from 'lucide-react';
import { useAuth, AppView } from '../context/AuthContext';

export const AndroidBottomNav: React.FC = () => {
  const { 
    activeView, setActiveView, unreadNotifications, 
    viewMode, setViewMode, triggerHaptic 
  } = useAuth();

  const handleTabPress = (view: AppView) => {
    triggerHaptic();
    if (viewMode === 'admin' && view !== 'admin') {
      setViewMode('user');
    }
    setActiveView(view);
  };

  // Determine active tab index for highlighted state
  const isAssetsActive = activeView === 'dashboard' || activeView === 'wallet' || activeView === 'deposit' || activeView === 'withdraw' || activeView === 'transfer' || activeView === 'receive';
  const isMarketsActive = activeView === 'markets';
  const isDiscoverActive = activeView === 'discover';
  const isLedgerActive = activeView === 'transactions';
  const isProfileActive = activeView === 'profile' || activeView === 'kyc' || activeView === 'security' || activeView === 'settings' || activeView === 'support' || activeView === 'notifications';
  const isAdminActive = activeView === 'admin' && viewMode === 'admin';

  return (
    <nav className="w-full bg-white dark:bg-[#121620] border-t border-[#f0f2f5] dark:border-[#1e2433] px-2 py-1.5 flex items-center justify-around z-40 shrink-0 select-none shadow-[0_-2px_10px_rgba(0,0,0,0.03)] transition-colors">
      {/* Tab 1: Assets (资产) */}
      <button
        type="button"
        onClick={() => handleTabPress('dashboard')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative cursor-pointer ${
          isAssetsActive && !isAdminActive
            ? 'text-[#2980fe] font-bold'
            : 'text-[#8a93a6] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white'
        }`}
      >
        <div className={`flex items-center justify-center h-7 w-7 rounded-full transition-all ${
          isAssetsActive && !isAdminActive ? 'bg-[#eff6ff] dark:bg-[#1e293b]' : ''
        }`}>
          <Wallet className={`h-5 w-5 ${isAssetsActive && !isAdminActive ? 'text-[#2980fe] stroke-[2.5]' : 'stroke-[1.8]'}`} />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight font-medium">Assets</span>
        {isAssetsActive && !isAdminActive && (
          <span className="absolute -bottom-1 h-1 w-5 bg-[#2980fe] rounded-full shadow-xs" />
        )}
      </button>

      {/* Tab 2: Markets (行情) */}
      <button
        type="button"
        onClick={() => handleTabPress('markets')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative cursor-pointer ${
          isMarketsActive && !isAdminActive
            ? 'text-[#2980fe] font-bold'
            : 'text-[#8a93a6] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white'
        }`}
      >
        <div className={`flex items-center justify-center h-7 w-7 rounded-full transition-all ${
          isMarketsActive && !isAdminActive ? 'bg-[#eff6ff] dark:bg-[#1e293b]' : ''
        }`}>
          <TrendingUp className={`h-5 w-5 ${isMarketsActive && !isAdminActive ? 'text-[#2980fe] stroke-[2.5]' : 'stroke-[1.8]'}`} />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight font-medium">Markets</span>
        {isMarketsActive && !isAdminActive && (
          <span className="absolute -bottom-1 h-1 w-5 bg-[#2980fe] rounded-full shadow-xs" />
        )}
      </button>

      {/* Tab 3: Discover (发现) */}
      <button
        type="button"
        onClick={() => handleTabPress('discover')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative cursor-pointer ${
          isDiscoverActive && !isAdminActive
            ? 'text-[#2980fe] font-bold'
            : 'text-[#8a93a6] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white'
        }`}
      >
        <div className={`flex items-center justify-center h-7 w-7 rounded-full transition-all ${
          isDiscoverActive && !isAdminActive ? 'bg-[#eff6ff] dark:bg-[#1e293b]' : ''
        }`}>
          <Compass className={`h-5 w-5 ${isDiscoverActive && !isAdminActive ? 'text-[#2980fe] stroke-[2.5]' : 'stroke-[1.8]'}`} />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight font-medium">Discover</span>
        {isDiscoverActive && !isAdminActive && (
          <span className="absolute -bottom-1 h-1 w-5 bg-[#2980fe] rounded-full shadow-xs" />
        )}
      </button>

      {/* Tab 4: Ledger / History (账单) */}
      <button
        type="button"
        onClick={() => handleTabPress('transactions')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative cursor-pointer ${
          isLedgerActive && !isAdminActive
            ? 'text-[#2980fe] font-bold'
            : 'text-[#8a93a6] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white'
        }`}
      >
        <div className={`flex items-center justify-center h-7 w-7 rounded-full transition-all ${
          isLedgerActive && !isAdminActive ? 'bg-[#eff6ff] dark:bg-[#1e293b]' : ''
        }`}>
          <FileText className={`h-5 w-5 ${isLedgerActive && !isAdminActive ? 'text-[#2980fe] stroke-[2.5]' : 'stroke-[1.8]'}`} />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight font-medium">Ledger</span>
        {isLedgerActive && !isAdminActive && (
          <span className="absolute -bottom-1 h-1 w-5 bg-[#2980fe] rounded-full shadow-xs" />
        )}
      </button>

      {/* Tab 5: My / Profile (我的) */}
      <button
        type="button"
        onClick={() => handleTabPress('profile')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative cursor-pointer ${
          (isProfileActive || isAdminActive)
            ? 'text-[#2980fe] font-bold'
            : 'text-[#8a93a6] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white'
        }`}
      >
        <div className={`flex items-center justify-center h-7 w-7 rounded-full transition-all relative ${
          (isProfileActive || isAdminActive) ? 'bg-[#eff6ff] dark:bg-[#1e293b]' : ''
        }`}>
          <User className={`h-5 w-5 ${(isProfileActive || isAdminActive) ? 'text-[#2980fe] stroke-[2.5]' : 'stroke-[1.8]'}`} />
          {unreadNotifications > 0 && (
            <span className="absolute -top-0.5 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#f5465c] px-1 text-[9px] font-bold text-white ring-1 ring-white dark:ring-[#121620]">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight font-medium">My</span>
        {(isProfileActive || isAdminActive) && (
          <span className="absolute -bottom-1 h-1 w-5 bg-[#2980fe] rounded-full shadow-xs" />
        )}
      </button>
    </nav>

  );
};
