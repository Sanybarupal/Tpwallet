import React, { useState, useEffect } from 'react';
import { 
  Eye, EyeOff, ChevronLeft, Check, Lock, Shield, 
  Key, Smartphone, ArrowRight, UserCheck, AlertCircle,
  HelpCircle, Globe, TrendingUp, Compass, User, RefreshCw,
  FolderOpen, FolderPlus, Sparkles, X, ExternalLink,
  Fingerprint, Copy, ShieldCheck, CheckCircle2, ArrowLeftRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthView: React.FC = () => {
  const { login, register, triggerHaptic, authenticateBiometric } = useAuth();

  // Screen modes: 
  // 'CAROUSEL' (3 sliders) -> 'SET_PASSWORD' -> 'GENERATE_KEY' -> 'BIOMETRIC_SETUP' -> Home
  // Or for Import: 'CAROUSEL' -> 'IMPORT_WALLET' -> 'SET_PASSWORD' -> 'BIOMETRIC_SETUP' -> Home
  // '2FA_CHALLENGE' for existing 2FA logins
  const [screenMode, setScreenMode] = useState<
    'CAROUSEL' | 'SET_PASSWORD' | 'GENERATE_KEY' | 'IMPORT_WALLET' | 'BIOMETRIC_SETUP' | '2FA_CHALLENGE'
  >('CAROUSEL');
  
  const [flowType, setFlowType] = useState<'CREATE' | 'IMPORT'>('CREATE');
  const [activeSlide, setActiveSlide] = useState(0);

  // Form Fields for Set Master Password
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  // Import fields
  const [importKey, setImportKey] = useState('');
  const [importType, setImportType] = useState<'MNEMONIC' | 'PRIVATE_KEY'>('MNEMONIC');

  // Generated Mnemonic and Private Key state
  const [generatedSeed] = useState<string[]>([
    'fortune', 'tether', 'matrix', 'crystal', 
    'orbit', 'quantum', 'velocity', 'shield', 
    'alpha', 'zenith', 'pulse', 'harmony'
  ]);
  const [generatedPrivateKey] = useState('0x4f8c2b9a7d3e1f568019a2c3d4e5f67890123456789abcdef0123456789abcde');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSeed, setCopiedSeed] = useState(false);
  const [isSeedConfirmed, setIsSeedConfirmed] = useState(false);

  // Biometric simulation state
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);
  const [biometricSuccess, setBiometricSuccess] = useState(false);

  // Quick Account / 2FA Fields
  const [email, setEmail] = useState('');
  const [totpCode, setTotpCode] = useState('');

  // Status & Loaders
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<'wallet' | 'markets' | 'trade' | 'discover' | 'me'>('wallet');

  // Auto slide carousel every 4.5s if in CAROUSEL mode (3 slides)
  useEffect(() => {
    if (screenMode !== 'CAROUSEL') return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(timer);
  }, [screenMode]);

  const handleCreateNowClick = () => {
    triggerHaptic();
    setFlowType('CREATE');
    setScreenMode('SET_PASSWORD');
    setErrorMessage(null);
  };

  const handleImportAccountClick = () => {
    triggerHaptic();
    setFlowType('IMPORT');
    setScreenMode('IMPORT_WALLET');
    setErrorMessage(null);
  };

  const handleImportProceed = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic();
    if (!importKey.trim()) {
      setErrorMessage('Please enter your mnemonic phrase or private key');
      return;
    }
    setScreenMode('SET_PASSWORD');
    setErrorMessage(null);
  };

  const handleConfirmMasterPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic();
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage("Password can't be less than 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    if (!agreedToTerms) {
      setErrorMessage('Please read and agree with Service Agreement');
      return;
    }

    if (flowType === 'CREATE') {
      // Move to Private Key generation screen
      setScreenMode('GENERATE_KEY');
    } else {
      // Move to Biometric setup directly for import
      setScreenMode('BIOMETRIC_SETUP');
    }
  };

  const handleKeyStepProceed = () => {
    triggerHaptic();
    setScreenMode('BIOMETRIC_SETUP');
  };

  const handleBiometricAuthenticate = async () => {
    triggerHaptic();
    setIsBiometricScanning(true);
    setErrorMessage(null);
    try {
      const bioRes = await authenticateBiometric();
      if (bioRes.success) {
        setIsBiometricScanning(false);
        setBiometricSuccess(true);
        triggerHaptic();
        setTimeout(async () => {
          await finalizeAccountCreation();
        }, 500);
      } else {
        setIsBiometricScanning(false);
        setErrorMessage(bioRes.error || 'System fingerprint verification failed');
      }
    } catch (err: unknown) {
      setIsBiometricScanning(false);
      setErrorMessage(err instanceof Error ? err.message : 'Biometric authentication cancelled');
    }
  };


  const handleSkipBiometric = async () => {
    triggerHaptic();
    await finalizeAccountCreation();
  };

  const finalizeAccountCreation = async () => {
    setIsLoading(true);
    try {
      const generatedEmail = email.trim() || `tp_${Date.now().toString().slice(-6)}@tokenpocket.pro`;
      await register({
        email: generatedEmail,
        password: password || 'TpPass123!Secure',
        firstName: 'TP',
        lastName: 'Holder',
      });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to finalize wallet creation');
      setIsLoading(false);
    }
  };

  const handleCopySeed = () => {
    triggerHaptic();
    navigator.clipboard.writeText(generatedSeed.join(' '));
    setCopiedSeed(true);
    setTimeout(() => setCopiedSeed(false), 2000);
  };

  const handleCopyKey = () => {
    triggerHaptic();
    navigator.clipboard.writeText(generatedPrivateKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleQuickDemoLogin = async (demoEmail: string, demoPw: string) => {
    triggerHaptic();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await login({
        email: demoEmail,
        password: demoPw,
      });
      if (res.requireTwoFactor) {
        setEmail(demoEmail);
        setScreenMode('2FA_CHALLENGE');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await login({
        email,
        password,
        totpCode: totpCode.trim(),
      });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Invalid 2FA code');
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------
  // 3 CAROUSEL SLIDES (Multi-chain, Security, Ecosystem)
  // ----------------------------------------------------
  const slides = [
    {
      id: 0,
      title: 'Your Multi-chain Wallet, Safe & Easy',
      subtitle: 'Supporting TRC20, ERC20, BEP20, and all major Layer2 networks with zero slippage.',
      graphic: (
        <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
          <div className="absolute w-52 h-52 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 w-44 h-32 bg-gradient-to-tr from-[#1E5BF0] via-[#2F74FF] to-[#60A5FA] rounded-[28px] shadow-[0_16px_35px_rgba(37,99,235,0.3)] border-2 border-white/40 flex items-center justify-center p-3 transform -rotate-1">
            <div className="w-full h-full bg-gradient-to-br from-white/20 to-transparent rounded-[20px] flex items-center justify-between px-3 border border-white/20">
              <div className="w-8 h-8 rounded-full bg-white/20 border border-white/40 flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-full bg-white/90 shadow-xs" />
              </div>
              <div className="flex flex-col items-end space-y-1.5">
                <div className="w-14 h-2 bg-white/80 rounded-full" />
                <div className="w-9 h-1.5 bg-white/50 rounded-full" />
              </div>
            </div>
          </div>
          <div className="absolute -bottom-1 -left-2 z-20 w-11 h-11 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-red-500 font-bold text-xs">
            TRX
          </div>
          <div className="absolute -top-1 -right-2 z-20 w-11 h-11 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-blue-600 font-bold text-xs">
            ETH
          </div>
          <div className="absolute top-1/2 -right-4 z-20 w-10 h-10 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-amber-500 font-bold text-xs">
            BNB
          </div>
        </div>
      ),
    },
    {
      id: 1,
      title: 'Decentralized Cold-Vault Security',
      subtitle: 'Your keys, your crypto. Encrypted locally with institutional MPC & biometric authentication.',
      graphic: (
        <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
          <div className="absolute w-52 h-52 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 w-36 h-40 bg-gradient-to-b from-[#1E5BF0] to-[#1E40AF] rounded-[28px] border-4 border-white shadow-xl flex flex-col items-center justify-center p-3 text-white">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-2">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div className="w-16 h-2 bg-white/80 rounded-full mb-1" />
            <div className="w-10 h-1.5 bg-white/50 rounded-full" />
          </div>
          <div className="absolute top-6 right-8 z-20 w-11 h-11 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-[#2980fe]">
            <Lock className="w-5 h-5" />
          </div>
          <div className="absolute bottom-6 left-8 z-20 w-11 h-11 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-[#03b875]">
            <Key className="w-5 h-5" />
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: 'Instant Swap & Rich Web3 Ecosystem',
      subtitle: 'Cross-chain flash swaps, liquid staking yields, and instant access to verified DeFi protocols.',
      graphic: (
        <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
          <div className="absolute w-52 h-52 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 w-44 h-44 rounded-full border-4 border-blue-200 bg-gradient-to-b from-blue-50 to-white flex items-center justify-center shadow-lg">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#1E5BF0] to-[#3B82F6] text-white flex flex-col items-center justify-center shadow-md">
              <ArrowLeftRight className="w-8 h-8 mb-1" />
              <span className="text-[10px] font-bold">SWAP</span>
            </div>
          </div>
          <div className="absolute top-2 left-6 z-20 w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-md flex items-center justify-center text-xs font-bold text-purple-600">
            Aave
          </div>
          <div className="absolute top-4 right-6 z-20 w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-md flex items-center justify-center text-xs font-bold text-pink-500">
            Uni
          </div>
          <div className="absolute bottom-2 right-8 z-20 w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-md flex items-center justify-center text-xs font-bold text-emerald-600">
            USDT
          </div>
        </div>
      ),
    },
  ];

  // ----------------------------------------------------
  // SCREEN 1: 3-SLIDE CAROUSEL
  // ----------------------------------------------------
  if (screenMode === 'CAROUSEL') {
    return (
      <div className="h-full bg-[#F7F8FA] text-[#1E2024] flex flex-col justify-between relative select-none overflow-y-auto no-scrollbar">
        {/* Top Sky Glow Atmospheric Gradient */}
        <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-[#E0EDFF] via-[#EEF4FE] to-[#F7F8FA] pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 flex-1 flex flex-col justify-between px-4 pt-4 pb-3 w-full">
          {/* Carousel Art & Text */}
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            {/* 3D Graphic */}
            <div className="w-full flex items-center justify-center py-2">
              {slides[activeSlide].graphic}
            </div>

            {/* Slide Title */}
            <h2 className="text-xl sm:text-2xl font-bold text-[#1E2024] tracking-tight mt-3 px-2">
              {slides[activeSlide].title}
            </h2>

            {/* Slide Subtitle */}
            <p className="text-xs sm:text-sm text-[#64748B] mt-2 max-w-[290px] leading-relaxed">
              {slides[activeSlide].subtitle}
            </p>

            {/* 3 Pagination Dots */}
            <div className="flex items-center space-x-2 mt-5">
              {[0, 1, 2].map((idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    setActiveSlide(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    activeSlide === idx
                      ? 'w-5 bg-[#2980FE]'
                      : 'w-1.5 bg-[#CBD5E1] hover:bg-slate-400'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* 2 Big Action Cards: "I have an account" & "No accounts" */}
          <div className="space-y-3 mt-6">
            {/* Card 1: I have an account (Import) */}
            <button
              type="button"
              onClick={handleImportAccountClick}
              className="w-full bg-white hover:bg-slate-50 p-4 rounded-2xl shadow-xs border border-[#e5e7eb] flex items-center space-x-3.5 transition-all text-left group active:scale-[0.99] cursor-pointer"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#2980FE] border border-blue-100 group-hover:scale-105 transition-transform shrink-0">
                <FolderOpen className="h-6 w-6 text-[#2980FE]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-[#1E2024]">I have an account</h3>
                <p className="text-[11px] text-[#8a93a6] truncate mt-0.5">
                  Import Mnemonic, Private Key, MultiSig
                </p>
              </div>
            </button>

            {/* Card 2: No accounts (Create Now) */}
            <button
              type="button"
              onClick={handleCreateNowClick}
              className="w-full bg-white hover:bg-slate-50 p-4 rounded-2xl shadow-xs border border-[#e5e7eb] flex items-center space-x-3.5 transition-all text-left group active:scale-[0.99] cursor-pointer"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#2980FE] border border-blue-100 group-hover:scale-105 transition-transform shrink-0">
                <FolderPlus className="h-6 w-6 text-[#2980FE]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-[#1E2024]">No accounts</h3>
                <p className="text-[11px] text-[#8a93a6] truncate mt-0.5">Create New Multi-Chain Vault</p>
              </div>
            </button>
          </div>

          {/* Quick Demo Access Bar */}
          <div className="mt-4 pt-3 border-t border-[#e5e7eb]">
            <span className="text-[10px] font-bold text-[#8a93a6] uppercase tracking-wider block mb-2 text-center">
              Quick 1-Tap Demo Access (Reviewer Mode):
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin@usdtvault.io', 'Admin123!Secure')}
                className="p-2 rounded-xl bg-white border border-[#e5e7eb] text-center hover:border-amber-400 shadow-xs transition-colors cursor-pointer"
              >
                <span className="text-[11px] font-bold text-amber-600 block">Super Admin</span>
                <span className="text-[9px] text-[#8a93a6] font-mono">Full Suite</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('alice@crypto.io', 'Alice2026!Vault')}
                className="p-2 rounded-xl bg-white border border-[#e5e7eb] text-center hover:border-blue-400 shadow-xs transition-colors cursor-pointer"
              >
                <span className="text-[11px] font-bold text-[#2980FE] block">Alice (VIP)</span>
                <span className="text-[9px] text-[#8a93a6] font-mono">12.4K USDT</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('bob@trader.io', 'Bob2026!Secure')}
                className="p-2 rounded-xl bg-white border border-[#e5e7eb] text-center hover:border-emerald-400 shadow-xs transition-colors cursor-pointer"
              >
                <span className="text-[11px] font-bold text-[#03B875] block">Bob Trader</span>
                <span className="text-[9px] text-[#8a93a6] font-mono">3.2K USDT</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom 5-Tab Bar */}
        <nav className="w-full bg-white border-t border-[#e5e7eb] px-2 py-2 flex items-center justify-around z-20 shrink-0 select-none shadow-xs">
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveBottomTab('wallet');
            }}
            className="flex flex-col items-center justify-center flex-1 py-1 text-[#2980FE]"
          >
            <div className="flex h-7 w-7 items-center justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-[#2980FE] flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[#2980FE]" />
              </div>
            </div>
            <span className="text-[10px] mt-0.5 font-bold tracking-tight">Wallet</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveBottomTab('markets');
              setScreenMode('SET_PASSWORD');
            }}
            className="flex flex-col items-center justify-center flex-1 py-1 text-[#8a93a6] hover:text-[#1E2024]"
          >
            <div className="flex h-7 w-7 items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-[10px] mt-0.5 font-medium tracking-tight">Markets</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveBottomTab('trade');
              setScreenMode('SET_PASSWORD');
            }}
            className="flex flex-col items-center justify-center flex-1 py-1 text-[#8a93a6] hover:text-[#1E2024]"
          >
            <div className="flex h-7 w-7 items-center justify-center">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <span className="text-[10px] mt-0.5 font-medium tracking-tight">Trade</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveBottomTab('discover');
              setScreenMode('SET_PASSWORD');
            }}
            className="flex flex-col items-center justify-center flex-1 py-1 text-[#8a93a6] hover:text-[#1E2024]"
          >
            <div className="flex h-7 w-7 items-center justify-center">
              <Compass className="h-5 w-5" />
            </div>
            <span className="text-[10px] mt-0.5 font-medium tracking-tight">Discover</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setActiveBottomTab('me');
              setScreenMode('SET_PASSWORD');
            }}
            className="flex flex-col items-center justify-center flex-1 py-1 text-[#8a93a6] hover:text-[#1E2024] relative"
          >
            <div className="flex h-7 w-7 items-center justify-center relative">
              <User className="h-5 w-5" />
              <span className="absolute top-0.5 right-1 h-2 w-2 rounded-full bg-rose-500 ring-1 ring-white" />
            </div>
            <span className="text-[10px] mt-0.5 font-medium tracking-tight">Me</span>
          </button>
        </nav>
      </div>
    );
  }

  // ----------------------------------------------------
  // SCREEN: IMPORT WALLET
  // ----------------------------------------------------
  if (screenMode === 'IMPORT_WALLET') {
    return (
      <div className="h-full bg-[#F7F8FA] text-[#1E2024] flex flex-col justify-between px-5 pt-4 pb-6 w-full select-none overflow-y-auto no-scrollbar">
        <div>
          {/* Top Bar with Back Arrow */}
          <div className="flex items-center justify-between py-2 -ml-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setScreenMode('CAROUSEL');
                setErrorMessage(null);
              }}
              className="p-2 rounded-full hover:bg-slate-200/60 text-[#1E2024] transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          </div>

          <div className="mt-2 space-y-2">
            <h1 className="text-2xl font-bold text-[#1E2024] tracking-tight">
              Import Existing Wallet
            </h1>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Enter your 12-word mnemonic phrase or raw private key to restore your multi-chain assets.
            </p>
          </div>

          {/* Tab Selector: Mnemonic vs Private Key */}
          <div className="flex bg-[#eef2f6] p-1 rounded-2xl mt-4 border border-[#e5e7eb]">
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setImportType('MNEMONIC');
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                importType === 'MNEMONIC' ? 'bg-white text-[#2980fe] shadow-xs' : 'text-[#8a93a6]'
              }`}
            >
              Recovery Phrase (12 Words)
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setImportType('PRIVATE_KEY');
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                importType === 'PRIVATE_KEY' ? 'bg-white text-[#2980fe] shadow-xs' : 'text-[#8a93a6]'
              }`}
            >
              Private Key
            </button>
          </div>

          {errorMessage && (
            <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-600 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleImportProceed} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#1E2024]">
                {importType === 'MNEMONIC' ? 'Mnemonic Phrase' : 'Plaintext Private Key'}
              </label>
              <textarea
                rows={4}
                value={importKey}
                onChange={(e) => setImportKey(e.target.value)}
                placeholder={
                  importType === 'MNEMONIC'
                    ? 'Enter 12 words separated by spaces (e.g., fortune tether matrix crystal...)'
                    : 'Enter 64-character hex private key'
                }
                className="w-full bg-white border border-[#e5e7eb] rounded-2xl p-3.5 text-xs font-mono text-[#1E2024] placeholder-slate-400 focus:border-[#2980FE] focus:ring-1 focus:ring-[#2980FE] focus:outline-none shadow-xs"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#2980FE] hover:bg-[#1E5BF0] text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-md shadow-blue-500/20 cursor-pointer"
            >
              Next: Set Master Password
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // SCREEN 2: SET MASTER PASSWORD
  // ----------------------------------------------------
  if (screenMode === 'SET_PASSWORD') {
    return (
      <div className="h-full bg-[#F7F8FA] text-[#1E2024] flex flex-col justify-between px-5 pt-4 pb-6 w-full select-none overflow-y-auto no-scrollbar">
        <div>
          {/* Top Bar with Back Arrow */}
          <div className="flex items-center justify-between py-2 -ml-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setScreenMode('CAROUSEL');
                setErrorMessage(null);
              }}
              className="p-2 rounded-full hover:bg-slate-200/60 text-[#1E2024] transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          </div>

          {/* Title & Subtitle */}
          <div className="mt-2 space-y-2">
            <h1 className="text-2xl font-bold text-[#1E2024] tracking-tight">
              Set Master Password
            </h1>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Use one password to unlock all your multi-chain wallets. You won't need to set a separate password for each chain.
            </p>
          </div>

          {errorMessage && (
            <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-600 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleConfirmMasterPassword} className="mt-6 space-y-5">
            {/* Field 1: Set Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#1E2024]">
                Set Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password can't be less than 8 chars"
                  className="w-full bg-white border border-[#e5e7eb] rounded-2xl px-4 py-3.5 text-xs text-[#1E2024] placeholder-slate-400 focus:border-[#2980FE] focus:ring-1 focus:ring-[#2980FE] focus:outline-none shadow-xs transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-[#8a93a6] hover:text-[#1E2024] p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Field 2: Confirm Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#1E2024]">
                Confirm Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Enter your password again."
                  className="w-full bg-white border border-[#e5e7eb] rounded-2xl px-4 py-3.5 text-xs text-[#1E2024] placeholder-slate-400 focus:border-[#2980FE] focus:ring-1 focus:ring-[#2980FE] focus:outline-none shadow-xs transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 text-[#8a93a6] hover:text-[#1E2024] p-1 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Toggle: Enable biometric authentication? */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-medium text-[#1E2024]">
                Enable biometric authentication?
              </span>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setBiometricEnabled(!biometricEnabled);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                  biometricEnabled ? 'bg-[#2980FE]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                    biometricEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </form>
        </div>

        {/* Bottom Section: Service Agreement & Confirm Button */}
        <div className="mt-8 space-y-4">
          {/* Radio / Agreement Checkbox */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setAgreedToTerms(!agreedToTerms);
              }}
              className={`h-4 w-4 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                agreedToTerms
                  ? 'border-[#2980FE] bg-[#2980FE] text-white'
                  : 'border-slate-400 bg-white'
              }`}
            >
              {agreedToTerms && <Check className="h-2.5 w-2.5 stroke-[3]" />}
            </button>
            <div className="text-xs text-[#64748B]">
              <span>Read & agree with </span>
              <button
                type="button"
                onClick={() => setIsTermsModalOpen(true)}
                className="text-[#2980FE] hover:underline font-medium cursor-pointer"
              >
                Service Agreement
              </button>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleConfirmMasterPassword}
            className="w-full bg-[#2980FE] hover:bg-[#1E5BF0] text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer active:scale-[0.99]"
          >
            <span>Confirm & Proceed</span>
          </button>
        </div>

        {/* Service Agreement Modal Sheet */}
        {isTermsModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 space-y-4 max-h-[80vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-base text-[#1E2024]">TokenPocket Service Agreement</h3>
                <button
                  type="button"
                  onClick={() => setIsTermsModalOpen(false)}
                  className="p-1 text-[#8a93a6] hover:text-[#1E2024] cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto text-xs text-slate-600 space-y-3 leading-relaxed pr-1">
                <p className="font-semibold text-[#1E2024]">1. Decentralized Custody & Master Password</p>
                <p>TokenPocket is a multi-chain decentralized crypto-asset wallet. Your private keys and master password are encrypted and stored locally on your device.</p>
                <p className="font-semibold text-[#1E2024]">2. Security & Double-Entry Ledger</p>
                <p>All on-chain USDT transactions (TRC20, ERC20, BEP20) are verified via blockchain RPC nodes with double-entry cryptographic reconciliation.</p>
                <p className="font-semibold text-[#1E2024]">3. User Responsibility</p>
                <p>Never disclose your 12-word mnemonic phrase or master password to anyone. TokenPocket will never ask for your private key.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAgreedToTerms(true);
                  setIsTermsModalOpen(false);
                }}
                className="w-full bg-[#2980FE] text-white font-bold py-3 rounded-xl text-xs cursor-pointer"
              >
                I Understand & Agree
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // SCREEN 3: PRIVATE KEY & MNEMONIC GENERATION
  // ----------------------------------------------------
  if (screenMode === 'GENERATE_KEY') {
    return (
      <div className="h-full bg-[#F7F8FA] text-[#1E2024] flex flex-col justify-between px-5 pt-4 pb-6 w-full select-none overflow-y-auto no-scrollbar">
        <div>
          <div className="flex items-center justify-between py-2 -ml-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setScreenMode('SET_PASSWORD');
              }}
              className="p-2 rounded-full hover:bg-slate-200/60 text-[#1E2024] transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <span className="text-xs font-mono font-bold text-[#2980fe] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              Step 2 of 3
            </span>
          </div>

          <div className="mt-2 space-y-1.5">
            <h1 className="text-2xl font-bold text-[#1E2024] tracking-tight">
              Backup Mnemonic Phrase
            </h1>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Please write down the following 12 words in order and store them in a secure place.
            </p>
          </div>

          {/* Security Alert Banner */}
          <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-800 flex items-start space-x-2">
            <Shield className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span>Do NOT take screenshots or share these words. Anyone with this phrase can access all your funds.</span>
          </div>

          {/* 12-Word Mnemonic Grid */}
          <div className="mt-4 bg-white rounded-2xl border border-[#e5e7eb] p-4 shadow-xs">
            <div className="grid grid-cols-3 gap-2">
              {generatedSeed.map((word, idx) => (
                <div
                  key={idx}
                  className="bg-[#f7f8fa] border border-[#e5e7eb] rounded-xl px-2.5 py-2 flex items-center space-x-1.5 text-xs font-mono"
                >
                  <span className="text-[#8a93a6] text-[10px] w-3.5">{idx + 1}.</span>
                  <span className="font-bold text-[#1e2024] truncate">{word}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-[#f0f2f5] flex items-center justify-between">
              <button
                type="button"
                onClick={handleCopySeed}
                className="text-xs font-bold text-[#2980fe] hover:text-[#1e58e6] flex items-center space-x-1 cursor-pointer"
              >
                {copiedSeed ? <Check className="h-3.5 w-3.5 text-[#03b875]" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedSeed ? 'Copied Mnemonic!' : 'Copy Phrase'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyKey}
                className="text-xs font-bold text-[#6b7280] hover:text-[#1e2024] flex items-center space-x-1 cursor-pointer"
              >
                {copiedKey ? <Check className="h-3.5 w-3.5 text-[#03b875]" /> : <Key className="h-3.5 w-3.5" />}
                <span>{copiedKey ? 'Copied Key!' : 'Copy Private Key'}</span>
              </button>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="mt-4 flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setIsSeedConfirmed(!isSeedConfirmed);
              }}
              className={`h-4 w-4 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                isSeedConfirmed
                  ? 'border-[#2980FE] bg-[#2980FE] text-white'
                  : 'border-slate-400 bg-white'
              }`}
            >
              {isSeedConfirmed && <Check className="h-2.5 w-2.5 stroke-[3]" />}
            </button>
            <span className="text-xs text-[#64748B]">
              I have saved the mnemonic phrase safely in offline storage.
            </span>
          </div>
        </div>

        {/* Continue Button */}
        <div className="mt-6">
          <button
            type="button"
            disabled={!isSeedConfirmed}
            onClick={handleKeyStepProceed}
            className="w-full bg-[#2980FE] hover:bg-[#1E5BF0] text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            <span>Next: Biometric Setup</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // SCREEN 4: BIOMETRIC SETUP & ENTER DASHBOARD
  // ----------------------------------------------------
  if (screenMode === 'BIOMETRIC_SETUP') {
    return (
      <div className="h-full bg-[#F7F8FA] text-[#1E2024] flex flex-col justify-between px-5 pt-6 pb-6 w-full select-none overflow-y-auto no-scrollbar">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="relative mb-6">
            <div className={`h-24 w-24 rounded-3xl flex items-center justify-center transition-all ${
              biometricSuccess
                ? 'bg-emerald-50 text-[#03b875] border-2 border-emerald-300 scale-110 shadow-lg shadow-emerald-500/20'
                : isBiometricScanning
                ? 'bg-blue-50 text-[#2980fe] border-2 border-blue-400 animate-pulse scale-105'
                : 'bg-white text-[#2980fe] border-2 border-[#e5e7eb] shadow-md'
            }`}>
              {biometricSuccess ? (
                <CheckCircle2 className="h-12 w-12 text-[#03b875]" />
              ) : (
                <Fingerprint className={`h-12 w-12 ${isBiometricScanning ? 'animate-bounce' : ''}`} />
              )}
            </div>
          </div>

          <h2 className="text-xl font-bold text-[#1E2024]">
            {biometricSuccess ? 'Biometrics Verified!' : 'Enable Touch ID / Face ID'}
          </h2>
          <p className="text-xs text-[#64748B] mt-2 max-w-[270px] leading-relaxed">
            {biometricSuccess
              ? 'Your wallet encryption is secured. Redirecting to your multi-chain portfolio...'
              : 'Fast, secure 1-tap sign in and instant transaction signing on TRC20, ERC20 & BEP20.'}
          </p>
        </div>

        <div className="space-y-3">
          {!biometricSuccess && (
            <>
              <button
                type="button"
                disabled={isBiometricScanning || isLoading}
                onClick={handleBiometricAuthenticate}
                className="w-full bg-[#2980FE] hover:bg-[#1E5BF0] text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99]"
              >
                {isBiometricScanning ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Scanning Fingerprint...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="h-4 w-4" />
                    <span>Enable Biometric Unlock</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isBiometricScanning || isLoading}
                onClick={handleSkipBiometric}
                className="w-full bg-white hover:bg-slate-50 border border-[#e5e7eb] text-[#6b7280] font-bold py-3.5 rounded-2xl text-sm transition-all cursor-pointer"
              >
                Skip for Now
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // SCREEN: 2FA CHALLENGE (If enabled)
  // ----------------------------------------------------
  return (
    <div className="h-full bg-[#F7F8FA] text-[#1E2024] flex flex-col justify-center px-5 py-8 w-full select-none overflow-y-auto no-scrollbar">
      <div className="bg-white p-6 rounded-3xl border border-[#e5e7eb] shadow-xl space-y-4">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#2980FE] border border-blue-100 mb-2">
            <Smartphone className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-[#1E2024]">2FA Security Challenge</h3>
          <p className="text-xs text-slate-500 mt-1">
            Enter the 6-digit code from your Google Authenticator app for <strong>{email}</strong>
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-600">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleVerify2FA} className="space-y-4">
          <input
            type="text"
            maxLength={6}
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            placeholder="000000"
            className="w-full bg-[#f7f8fa] border border-[#e5e7eb] rounded-2xl px-4 py-3.5 text-center text-xl text-[#1E2024] font-mono tracking-widest focus:border-[#2980FE] focus:outline-none"
            autoFocus
            required
          />

          <button
            type="submit"
            disabled={isLoading || totpCode.length !== 6}
            className="w-full bg-[#2980FE] hover:bg-[#1E5BF0] text-white font-bold py-3.5 rounded-2xl text-xs transition-colors flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20 disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Verifying 2FA...</span>
              </>
            ) : (
              <span>Verify & Continue</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setScreenMode('CAROUSEL')}
            className="w-full text-center text-xs text-slate-400 hover:text-slate-600 pt-1 cursor-pointer"
          >
            Back to Welcome Screen
          </button>
        </form>
      </div>
    </div>
  );
};
