import React, { useState, useRef } from 'react';
import { 
  X, Camera, Flashlight, Image as ImageIcon, Clipboard, 
  Check, AlertTriangle, Zap, ArrowRight, ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const QRScannerModal: React.FC = () => {
  const { 
    isQRScannerOpen, setIsQRScannerOpen, qrScanCallback, 
    setIsWithdrawModalOpen, setSelectedWithdrawalPrefill,
    triggerHaptic 
  } = useAuth();

  const [flashlightOn, setFlashlightOn] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [inputManual, setInputManual] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isQRScannerOpen) return null;

  const handleProcessScannedValue = (val: string) => {
    triggerHaptic();
    setScannedResult(val);

    if (qrScanCallback) {
      qrScanCallback(val);
      setTimeout(() => {
        setIsQRScannerOpen(false);
      }, 500);
      return;
    }

    // Default flow: If no specific callback, launch the withdrawal / send modal pre-filled with this address!
    const trimmed = val.trim();
    let detectedNet = 'TRC20';
    if (trimmed.startsWith('0x')) {
      detectedNet = 'ERC20';
    } else if (trimmed.startsWith('T')) {
      detectedNet = 'TRC20';
    }

    setSelectedWithdrawalPrefill({
      network: detectedNet,
      address: trimmed,
    });

    setTimeout(() => {
      setIsQRScannerOpen(false);
      setIsWithdrawModalOpen(true);
    }, 400);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleProcessScannedValue(text);
      }
    } catch {
      // Fallback
      if (inputManual) {
        handleProcessScannedValue(inputManual);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Simulate image QR decode
    const mockDecoded = 'TXLaErHExepFdTnBsTXbvB6Nqh1mZ36Qz5';
    handleProcessScannedValue(mockDecoded);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-[#0f131c] text-[#1e2024] dark:text-white animate-in fade-in duration-200 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 bg-white/95 dark:bg-[#0f131c]/95 backdrop-blur-md border-b border-[#e5e7eb] dark:border-[#1e2433] z-10">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-[#03b875] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center">
            <Camera className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#1e2024] dark:text-white">Scan QR Code</h3>
            <p className="text-[10px] text-[#6b7280] dark:text-[#94a3b8]">Direct multi-chain address scanner</p>
          </div>
        </div>
        <button
          onClick={() => setIsQRScannerOpen(false)}
          className="p-2 rounded-full bg-[#f7f8fa] dark:bg-[#182030] text-[#6b7280] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white border border-[#e5e7eb] dark:border-[#1e2433] transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Camera Viewport Area */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-6 overflow-hidden bg-[#f7f8fa] dark:bg-[#0b0e14]">
        {/* Animated Viewfinder Box */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl border-2 border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.15)] flex items-center justify-center overflow-hidden bg-white/70 dark:bg-slate-900/60 backdrop-blur-xs">
          {/* Laser Scanning Line Animation */}
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#03b875] to-transparent shadow-[0_0_15px_#03b875] animate-[scan_2s_ease-in-out_infinite]" />
          
          {/* Corner Guides */}
          <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg" />
          <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg" />
          <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg" />
          <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-lg" />

          {/* Center Target Icon */}
          <div className="text-center p-4">
            <Camera className="h-10 w-10 text-emerald-500/50 mx-auto mb-2 animate-pulse" />
            <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] font-medium">Align QR code inside frame</p>
          </div>
        </div>

        {/* Status Indicator */}
        {scannedResult ? (
          <div className="mt-4 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-mono flex items-center gap-2 shadow-xs">
            <Check className="h-4 w-4 text-[#03b875] shrink-0" />
            <span className="truncate max-w-[240px]">{scannedResult}</span>
          </div>
        ) : (
          <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] mt-4 text-center">
            Supports TRC-20, ERC-20, BEP-20 addresses & Payment Requests
          </p>
        )}

        {/* Quick Test Sample Addresses (For 1-tap instant testing) */}
        <div className="mt-5 w-full max-w-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a93a6] dark:text-[#64748b] block mb-2 text-center">
            Quick Test Simulation Codes (Tap to Scan):
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleProcessScannedValue('TXLaErHExepFdTnBsTXbvB6Nqh1mZ36Qz5')}
              className="p-2.5 rounded-xl bg-white dark:bg-[#121620] border border-[#e5e7eb] dark:border-[#1e2433] hover:border-emerald-500 text-left transition-all cursor-pointer shadow-xs"
            >
              <span className="font-bold text-[#03b875] dark:text-emerald-400 block text-[11px]">Tron TRC-20</span>
              <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] font-mono truncate block">TXLaErHE...36Qz5</span>
            </button>

            <button
              type="button"
              onClick={() => handleProcessScannedValue('0x71C83638b1805847F4094572424294b0525287f3')}
              className="p-2.5 rounded-xl bg-white dark:bg-[#121620] border border-[#e5e7eb] dark:border-[#1e2433] hover:border-blue-500 text-left transition-all cursor-pointer shadow-xs"
            >
              <span className="font-bold text-[#2980fe] dark:text-blue-400 block text-[11px]">Ethereum ERC-20</span>
              <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] font-mono truncate block">0x71C836...87f3</span>
            </button>

            <button
              type="button"
              onClick={() => handleProcessScannedValue('0x8894E0a0c962CB723c1976a4421c95949bE2D4E3')}
              className="p-2.5 rounded-xl bg-white dark:bg-[#121620] border border-[#e5e7eb] dark:border-[#1e2433] hover:border-amber-500 text-left transition-all cursor-pointer shadow-xs"
            >
              <span className="font-bold text-amber-600 dark:text-amber-400 block text-[11px]">BSC BEP-20</span>
              <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] font-mono truncate block">0x8894E0...D4E3</span>
            </button>

            <button
              type="button"
              onClick={() => handleProcessScannedValue('bob@trader.io')}
              className="p-2.5 rounded-xl bg-white dark:bg-[#121620] border border-[#e5e7eb] dark:border-[#1e2433] hover:border-teal-500 text-left transition-all cursor-pointer shadow-xs"
            >
              <span className="font-bold text-teal-600 dark:text-teal-400 block text-[11px]">Bob (Internal)</span>
              <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] font-mono truncate block">bob@trader.io</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Controls (Flashlight, Album, Paste) */}
      <div className="p-4 bg-white dark:bg-[#0f131c] border-t border-[#e5e7eb] dark:border-[#1e2433] flex items-center justify-around z-10">
        <button
          type="button"
          onClick={() => setFlashlightOn(!flashlightOn)}
          className={`flex flex-col items-center space-y-1 p-2 rounded-2xl transition-colors cursor-pointer ${
            flashlightOn ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white'
          }`}
        >
          <Flashlight className="h-5 w-5" />
          <span className="text-[10px] font-semibold">Flashlight</span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center space-y-1 p-2 rounded-2xl text-[#6b7280] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white transition-colors cursor-pointer"
        >
          <ImageIcon className="h-5 w-5" />
          <span className="text-[10px] font-semibold">Photo Album</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        <button
          type="button"
          onClick={handlePasteClipboard}
          className="flex flex-col items-center space-y-1 p-2 rounded-2xl text-[#6b7280] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white transition-colors cursor-pointer"
        >
          <Clipboard className="h-5 w-5 text-[#03b875] dark:text-emerald-400" />
          <span className="text-[10px] font-semibold">Paste String</span>
        </button>
      </div>
    </div>
  );
};
