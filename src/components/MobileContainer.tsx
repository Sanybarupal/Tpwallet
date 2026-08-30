import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface MobileContainerProps {
  children: React.ReactNode;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#eaecf0] dark:bg-[#07090e] text-[#1e2024] dark:text-[#e2e8f0] flex flex-col items-center justify-center p-0 sm:p-4 md:p-6 select-none relative overflow-x-hidden">
      {/* Ambient background glow on desktop */}
      <div className="fixed inset-0 pointer-events-none z-0 hidden sm:block">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-400/10 dark:bg-emerald-600/5 rounded-full blur-3xl" />
      </div>

      {/* Top Floating Badge on Desktop (indicating Mobile Edition) */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-[420px] mb-2 px-3 relative z-10">
        <div className="flex items-center space-x-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#2980fe]/10 text-[#2980fe]">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold text-[#1e2024] dark:text-white">
            TokenPocket <span className="text-[#2980fe] font-mono text-[11px]">Mobile Pro</span>
          </span>
        </div>
        <div className="flex items-center space-x-1.5 text-[11px] font-medium text-[#64748b] dark:text-[#94a3b8] bg-white/70 dark:bg-[#121620]/70 backdrop-blur-md px-2 py-0.5 rounded-full border border-black/5 dark:border-white/5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#03b875] animate-pulse" />
          <span>Mobile Only</span>
        </div>
      </div>

      {/* Main Mobile Smartphone Frame */}
      <div className="relative z-10 w-full sm:max-w-[420px] h-[100dvh] sm:h-[92vh] sm:max-h-[890px] sm:min-h-[680px] bg-[#f7f8fa] dark:bg-[#0b0e14] sm:rounded-[44px] sm:border-[8px] sm:border-[#1e293b] dark:sm:border-[#1a2130] sm:shadow-[0_25px_70px_rgba(0,0,0,0.16),0_0_0_1px_rgba(0,0,0,0.06)] flex flex-col overflow-hidden">
        
        {/* Smartphone Speaker Ear-piece & Sensor Bar (Desktop view) */}
        <div className="hidden sm:flex justify-center items-center py-2 bg-white dark:bg-[#121620] shrink-0 border-b border-[#f0f2f5] dark:border-[#1e2433]">
          <div className="w-14 h-1 bg-[#d1d5db] dark:bg-[#334155] rounded-full" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#1e293b] dark:bg-[#334155] ml-3" />
        </div>

        {/* Mobile Viewport Screen Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative w-full bg-[#f7f8fa] dark:bg-[#0b0e14]">
          {children}
        </div>

        {/* Smartphone Bottom Home Gesture Bar (Desktop view) */}
        <div className="hidden sm:flex justify-center py-1.5 bg-white dark:bg-[#121620] shrink-0 border-t border-[#f0f2f5] dark:border-[#1e2433]">
          <div className="w-28 h-1 bg-[#9ca3af] dark:bg-[#475569] rounded-full" />
        </div>
      </div>
    </div>
  );
};
