/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthView } from './views/AuthView';
import { MobileAPKShell } from './components/MobileAPKShell';
import { RefreshCw, ShieldCheck } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f8fa] flex flex-col items-center justify-center text-[#4b5563] select-none">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#2980fe]/10 border border-[#2980fe]/20 text-[#2980fe] mb-4 shadow-xl shadow-blue-500/10 animate-pulse">
          <ShieldCheck className="h-9 w-9 text-[#2980fe]" />
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-[#2980fe]">
          <RefreshCw className="h-4 w-4 animate-spin text-[#2980fe]" />
          <span>Synchronizing TokenPocket Vault...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  return <MobileAPKShell />;
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
