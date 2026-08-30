import React, { useEffect, useState } from 'react';
import { ShieldCheck, Lock, Activity, Sparkles } from 'lucide-react';
import { TokenPocketLogo } from './CryptoIcons';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Initializing Enclave...');

  useEffect(() => {
    const t1 = setTimeout(() => {
      setProgress(45);
      setStatusText('Connecting to Multi-Chain RPC Node...');
    }, 400);

    const t2 = setTimeout(() => {
      setProgress(85);
      setStatusText('Validating Double-Entry Ledger State...');
    }, 850);

    const t3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Vault Ready');
    }, 1250);

    const t4 = setTimeout(() => {
      onComplete();
    }, 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-white px-6 py-12 text-[#1e2024] select-none overflow-hidden">
      {/* Subtle ambient light gradient */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#2980fe]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Tag */}
      <div className="pt-4 flex items-center space-x-1.5 opacity-80">
        <span className="h-1.5 w-1.5 rounded-full bg-[#2980fe] animate-pulse" />
        <span className="font-semibold text-[11px] tracking-wider text-[#8a93a6] uppercase">
          TOKENPOCKET ENCLAVE
        </span>
      </div>

      {/* Center Brand Identity */}
      <div className="flex flex-col items-center text-center relative z-10 -mt-8">
        <div className="relative mb-6">
          <TokenPocketLogo size={88} className="shadow-2xl shadow-blue-500/25 rounded-3xl" />
          <div className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-[#e5e7eb] text-amber-500 shadow-md">
            <Lock className="h-4 w-4" />
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <h1 className="text-3xl font-black tracking-tight text-[#1e2024]">
            Token<span className="text-[#2980fe]">Pocket</span>
          </h1>
          <span className="rounded-lg bg-[#2980fe]/10 px-2 py-0.5 text-[11px] font-bold text-[#2980fe] border border-[#2980fe]/20">
            PRO
          </span>
        </div>
        <p className="text-xs text-[#8a93a6] mt-1.5 max-w-[260px] leading-relaxed">
          Your Multi-chain Web3 Portal, Safe & Easy
        </p>
      </div>

      {/* Bottom Progress & Version Footer */}
      <div className="w-full max-w-xs flex flex-col items-center space-y-3 relative z-10 pb-4">
        <div className="w-full bg-[#f0f2f5] rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#2980fe] to-[#60a5fa] h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between w-full text-[11px] text-[#8a93a6]">
          <span className="truncate">{statusText}</span>
          <span className="font-bold text-[#2980fe]">{progress}%</span>
        </div>

        <div className="pt-2 flex items-center justify-between w-full text-[10px] text-[#a0aab8] border-t border-[#f0f2f5]">
          <span>TokenPocket v2.5.0</span>
          <button
            onClick={onComplete}
            className="text-[#2980fe] hover:underline font-medium"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};
