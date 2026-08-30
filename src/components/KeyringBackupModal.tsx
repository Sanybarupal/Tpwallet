import React, { useState } from 'react';
import { X, Key, ShieldCheck, Lock, Copy, Check, Eye, EyeOff, AlertTriangle, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface KeyringBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyringBackupModal: React.FC<KeyringBackupModalProps> = ({ isOpen, onClose }) => {
  const { user, triggerHaptic, refreshUser } = useAuth();
  const [step, setStep] = useState<'AUTH' | 'REVEAL' | 'QUIZ' | 'SUCCESS'>('AUTH');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [mnemonicWords, setMnemonicWords] = useState<string[]>([]);
  const [evmKey, setEvmKey] = useState<string>('');
  const [tronKey, setTronKey] = useState<string>('');
  const [addresses, setAddresses] = useState<Record<string, string>>({});

  const [activeTab, setActiveTab] = useState<'MNEMONIC' | 'EVM_KEY' | 'TRON_KEY'>('MNEMONIC');
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Quiz state
  const [quizIndices, setQuizIndices] = useState<number[]>([3, 7, 11]);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizError, setQuizError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('Please enter your account password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.exportKeyring(password);
      if (res.mnemonic) {
        setMnemonicWords(res.mnemonic.split(' '));
      } else {
        setMnemonicWords([]);
      }
      setEvmKey(res.evmPrivateKey || '');
      setTronKey(res.tronPrivateKey || '');
      setAddresses(res.addresses || {});

      triggerHaptic();
      setStep('REVEAL');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Invalid password.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    triggerHaptic();
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const startQuiz = () => {
    triggerHaptic();
    // Pick 3 random distinct indices between 1 and 12
    const totalWords = mnemonicWords.length || 12;
    const indices: number[] = [];
    while (indices.length < 3) {
      const r = Math.floor(Math.random() * totalWords) + 1;
      if (!indices.includes(r)) indices.push(r);
    }
    indices.sort((a, b) => a - b);
    setQuizIndices(indices);
    setQuizAnswers({});
    setQuizError(null);
    setStep('QUIZ');
  };

  const handleVerifyQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuizError(null);

    const answersArray = quizIndices.map((idx) => ({
      index: idx,
      word: (quizAnswers[idx] || '').trim().toLowerCase(),
    }));

    if (answersArray.some((a) => !a.word)) {
      setQuizError('Please fill in all 3 requested words.');
      return;
    }

    setLoading(true);
    try {
      await api.verifyBackup({
        answers: answersArray,
        password,
      });
      triggerHaptic();
      await refreshUser();
      setStep('SUCCESS');
    } catch (err: unknown) {
      setQuizError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in select-none">
      <div className="w-full max-w-md bg-white dark:bg-[#121620] border border-[#e5e7eb] dark:border-[#1e2433] rounded-3xl p-5 shadow-2xl space-y-4 text-[#1e2024] dark:text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f5f6f8] dark:border-[#182030] pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#1e2024] dark:text-white">HD Keyring & Cryptographic Vault</h3>
              <p className="text-[10px] text-[#6b7280] dark:text-[#94a3b8]">BIP-39 Mnemonic & Private Keys</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl bg-[#f7f8fa] dark:bg-[#182030] text-[#9ca3af] hover:text-[#1e2024] dark:hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === 'AUTH' && (
          <form onSubmit={handleAuthorize} className="space-y-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                Your recovery phrase gives direct control of all assets on EVM, Tron, Solana, and Bitcoin chains. Never share it with anyone.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#6b7280] dark:text-[#94a3b8] block">Master Account Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password to decrypt vault"
                className="w-full text-sm bg-[#f7f8fa] dark:bg-[#0b0e14] border border-[#e5e7eb] dark:border-[#1e2433] rounded-2xl px-4 py-3 text-[#1e2024] dark:text-white focus:border-amber-500 focus:outline-none"
                autoFocus
              />
              {errorMsg && <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">{errorMsg}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              <span>Decrypt & Reveal Vault</span>
            </button>
          </form>
        )}

        {step === 'REVEAL' && (
          <div className="space-y-4">
            {/* Tab selector */}
            <div className="flex bg-[#f7f8fa] dark:bg-[#0b0e14] p-1 rounded-xl border border-[#e5e7eb] dark:border-[#1e2433] text-[11px]">
              <button
                type="button"
                onClick={() => setActiveTab('MNEMONIC')}
                className={`flex-1 py-1.5 font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'MNEMONIC' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white'
                }`}
              >
                12 Words Seed
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('EVM_KEY')}
                className={`flex-1 py-1.5 font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'EVM_KEY' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white'
                }`}
              >
                EVM Key
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('TRON_KEY')}
                className={`flex-1 py-1.5 font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'TRON_KEY' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#1e2024] dark:hover:text-white'
                }`}
              >
                TRON Key
              </button>
            </div>

            {activeTab === 'MNEMONIC' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#6b7280] dark:text-[#94a3b8]">BIP-39 Standard Recovery Phrase</span>
                  <button
                    type="button"
                    onClick={() => setShowMnemonic(!showMnemonic)}
                    className="text-[11px] text-[#2980fe] dark:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    {showMnemonic ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    <span>{showMnemonic ? 'Hide' : 'Reveal'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-[#f7f8fa] dark:bg-[#0b0e14] p-3 rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] font-mono text-xs">
                  {mnemonicWords.map((word, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-white dark:bg-[#182030] border border-[#e5e7eb] dark:border-[#1e2433] flex items-center justify-between">
                      <span className="text-[9px] text-[#9ca3af] select-none">{idx + 1}.</span>
                      <span className="font-bold text-[#1e2024] dark:text-white tracking-wide text-[11px]">
                        {showMnemonic ? word : '••••'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(mnemonicWords.join(' '))}
                    className="flex-1 py-2.5 bg-[#f7f8fa] dark:bg-[#182030] hover:bg-slate-100 dark:hover:bg-[#1e2433] text-[#1e2024] dark:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-[#e5e7eb] dark:border-[#1e2433] cursor-pointer"
                  >
                    {copiedText ? <Check className="h-3.5 w-3.5 text-[#03b875]" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedText ? 'Copied Phrase' : 'Copy Words'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={startQuiz}
                    className="flex-1 py-2.5 bg-[#03b875] hover:bg-[#029b63] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Verify Backup Quiz</span>
                  </button>
                </div>
              </div>
            )}

            {(activeTab === 'EVM_KEY' || activeTab === 'TRON_KEY') && (
              <div className="space-y-3">
                <div className="p-2.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-[11px] text-rose-600 dark:text-rose-300 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>Never export raw private keys on public or untrusted devices.</span>
                </div>

                <div className="p-3 bg-[#f7f8fa] dark:bg-[#0b0e14] rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] space-y-2">
                  <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] font-bold uppercase tracking-wider block">
                    {activeTab === 'EVM_KEY' ? 'Ethereum / BSC / Polygon Private Key' : 'Tron TRC-20 Private Key'}
                  </span>
                  <p className="font-mono text-xs break-all text-amber-600 dark:text-amber-300 select-all">
                    {activeTab === 'EVM_KEY' ? evmKey : tronKey}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(activeTab === 'EVM_KEY' ? evmKey : tronKey)}
                  className="w-full py-2.5 bg-[#f7f8fa] dark:bg-[#182030] hover:bg-slate-100 dark:hover:bg-[#1e2433] text-[#1e2024] dark:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-[#e5e7eb] dark:border-[#1e2433] transition-colors cursor-pointer"
                >
                  {copiedText ? <Check className="h-3.5 w-3.5 text-[#03b875]" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedText ? 'Copied Key' : 'Copy Private Key'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'QUIZ' && (
          <form onSubmit={handleVerifyQuiz} className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl text-[11px] text-[#2980fe] dark:text-blue-300">
              Please enter the correct words at the indicated positions to confirm you have securely recorded your recovery phrase.
            </div>

            <div className="space-y-3">
              {quizIndices.map((idx) => (
                <div key={idx} className="space-y-1">
                  <label className="text-[11px] font-bold text-[#6b7280] dark:text-[#94a3b8]">
                    Word #{idx}
                  </label>
                  <input
                    type="text"
                    value={quizAnswers[idx] || ''}
                    onChange={(e) => setQuizAnswers({ ...quizAnswers, [idx]: e.target.value })}
                    placeholder={`Enter word #${idx}`}
                    className="w-full text-xs font-mono bg-[#f7f8fa] dark:bg-[#0b0e14] border border-[#e5e7eb] dark:border-[#1e2433] rounded-xl px-3 py-2.5 text-[#1e2024] dark:text-white focus:border-[#2980fe] focus:outline-none"
                  />
                </div>
              ))}
            </div>

            {quizError && <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">{quizError}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('REVEAL')}
                className="py-2.5 px-4 bg-[#f7f8fa] dark:bg-[#182030] text-[#6b7280] dark:text-slate-300 text-xs font-bold rounded-xl border border-[#e5e7eb] dark:border-[#1e2433] cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-[#2980fe] hover:bg-[#1e58e6] disabled:opacity-50 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                <span>Verify & Complete</span>
              </button>
            </div>
          </form>
        )}

        {step === 'SUCCESS' && (
          <div className="space-y-4 text-center py-2">
            <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-[#03b875] dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#1e2024] dark:text-white">Vault Security Active</h4>
              <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] mt-1">
                Your recovery phrase is verified and encrypted. You can safely restore this wallet at any time.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-[#03b875] hover:bg-[#029b63] text-white font-bold text-xs rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
