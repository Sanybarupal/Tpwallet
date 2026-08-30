import React, { useState, useEffect } from 'react';
import { 
  Lock, Shield, Smartphone, Key, AlertTriangle, 
  Check, RefreshCw, Copy, CheckCheck, Eye, EyeOff,
  Trash2, Globe, ShieldAlert, Monitor, LogOut
} from 'lucide-react';
import { UserSession } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export const SecurityCenterView: React.FC = () => {
  const { user, refreshUserData } = useAuth();
  
  // 2FA Setup Flow State
  const [is2FAEnabled, setIs2FAEnabled] = useState(user?.twoFactorEnabled || false);
  const [setupStep, setSetupStep] = useState<'IDLE' | 'SCAN' | 'VERIFIED'>('IDLE');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [totpInputCode, setTotpInputCode] = useState('');
  const [isSubmitting2FA, setIsSubmitting2FA] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [twoFactorSuccess, setTwoFactorSuccess] = useState<string | null>(null);

  // Disable 2FA Modal
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableTotp, setDisableTotp] = useState('');

  // Anti-Phishing State
  const [antiPhishingCode, setAntiPhishingCode] = useState(user?.antiPhishingCode || '');
  const [isSavingPhishing, setIsSavingPhishing] = useState(false);
  const [phishingMsg, setPhishingMsg] = useState<string | null>(null);

  // Sessions
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwTotp, setPwTotp] = useState('');
  const [isChangingPw, setIsChangingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setIs2FAEnabled(user?.twoFactorEnabled || false);
    if (user?.antiPhishingCode) {
      setAntiPhishingCode(user.antiPhishingCode);
    }
  }, [user]);

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const res = await api.getSessions();
      setSessions(res.sessions);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleStart2FASetup = async () => {
    setTwoFactorError(null);
    setTwoFactorSuccess(null);
    setIsSubmitting2FA(true);
    try {
      const res = await api.setup2FA();
      setQrCodeUrl(res.qrDataUrl);
      setTotpSecret(res.secret);
      setBackupCodes(res.backupCodes);
      setSetupStep('SCAN');
    } catch (err: unknown) {
      setTwoFactorError(err instanceof Error ? err.message : 'Failed to initialize 2FA');
    } finally {
      setIsSubmitting2FA(false);
    }
  };

  const handleVerify2FACode = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFactorError(null);
    setIsSubmitting2FA(true);
    try {
      const res = await api.enable2FA(totpInputCode.trim());
      setTwoFactorSuccess(res.message);
      setIs2FAEnabled(true);
      setSetupStep('VERIFIED');
      await refreshUserData();
    } catch (err: unknown) {
      setTwoFactorError(err instanceof Error ? err.message : 'Invalid 2FA code');
    } finally {
      setIsSubmitting2FA(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFactorError(null);
    setIsSubmitting2FA(true);
    try {
      const res = await api.disable2FA({
        password: disablePassword,
        totpCode: disableTotp,
      });
      setTwoFactorSuccess(res.message);
      setIs2FAEnabled(false);
      setShowDisable2FA(false);
      setSetupStep('IDLE');
      await refreshUserData();
    } catch (err: unknown) {
      setTwoFactorError(err instanceof Error ? err.message : 'Failed to disable 2FA');
    } finally {
      setIsSubmitting2FA(false);
    }
  };

  const handleSaveAntiPhishing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPhishing(true);
    setPhishingMsg(null);
    try {
      const res = await api.setAntiPhishing(antiPhishingCode.trim());
      setPhishingMsg(res.message);
      await refreshUserData();
      setTimeout(() => setPhishingMsg(null), 4000);
    } catch (err: unknown) {
      setPhishingMsg(err instanceof Error ? err.message : 'Failed to set code');
    } finally {
      setIsSavingPhishing(false);
    }
  };

  const handleRevokeSession = async (sessionId?: string, allOthers?: boolean) => {
    try {
      await api.revokeSession(sessionId, allOthers);
      await fetchSessions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPassword.length < 8) {
      setPwMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsChangingPw(true);
    try {
      const res = await api.changePassword({
        currentPassword,
        newPassword,
        totpCode: pwTotp || undefined,
      });
      setPwMsg({ type: 'success', text: res.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwTotp('');
    } catch (err: unknown) {
      setPwMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update password' });
    } finally {
      setIsChangingPw(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(totpSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#1e2024] flex items-center gap-2">
          <Shield className="h-5 w-5 text-[#03b875]" />
          <span>Security & Authentication Center</span>
        </h2>
        <p className="text-xs text-[#6b7280]">
          Manage Two-Factor Authentication, active sessions, phishing protection, and cryptographic credentials
        </p>
      </div>

      {/* Two-Factor Authentication Card */}
      <div className="rounded-3xl border border-[#e5e7eb] bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#f3f4f6] pb-4">
          <div className="flex items-start space-x-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border shrink-0 ${
              is2FAEnabled 
                ? 'bg-emerald-50 border-emerald-200 text-[#03b875]' 
                : 'bg-amber-50 border-amber-200 text-amber-600'
            }`}>
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-[#1e2024]">Google Authenticator (TOTP)</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  is2FAEnabled 
                    ? 'bg-emerald-50 text-[#03b875] border-emerald-200' 
                    : 'bg-[#f7f8fa] text-[#8a93a6] border-[#e5e7eb]'
                }`}>
                  {is2FAEnabled ? 'ENABLED & SECURED' : 'NOT CONFIGURED'}
                </span>
              </div>
              <p className="text-xs text-[#6b7280] mt-0.5">
                Protect withdrawals, transfers, and password changes with time-based one-time authentication codes.
              </p>
            </div>
          </div>

          <div>
            {!is2FAEnabled ? (
              <button
                type="button"
                onClick={handleStart2FASetup}
                disabled={isSubmitting2FA}
                className="px-4 py-2.5 rounded-xl bg-[#03b875] hover:bg-[#029b63] text-white font-bold text-xs shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Enable 2FA</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowDisable2FA(!showDisable2FA)}
                className="px-3.5 py-2 rounded-xl bg-[#f7f8fa] hover:bg-rose-50 text-[#6b7280] hover:text-rose-600 border border-[#e5e7eb] hover:border-rose-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                Disable 2FA
              </button>
            )}
          </div>
        </div>

        {twoFactorError && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-600 flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{twoFactorError}</span>
          </div>
        )}

        {twoFactorSuccess && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 flex items-start space-x-2">
            <Check className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{twoFactorSuccess}</span>
          </div>
        )}

        {/* 2FA Setup Flow (Scan -> Verify) */}
        {!is2FAEnabled && setupStep === 'SCAN' && (
          <div className="bg-[#f7f8fa] p-6 rounded-2xl border border-[#e5e7eb] space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              
              {/* QR Code */}
              <div className="flex flex-col items-center p-4 bg-white rounded-xl shadow-xs text-[#1e2024] border border-[#e5e7eb]">
                <img src={qrCodeUrl} alt="2FA QR Code" className="h-48 w-48 object-contain rounded-lg" />
                <span className="text-[11px] font-bold uppercase tracking-wider mt-2 text-[#6b7280]">
                  Scan in Authenticator App
                </span>
              </div>

              {/* Secret Key & Verification Form */}
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-[#8a93a6] block mb-1">
                    Or Enter Secret Manually
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white border border-[#e5e7eb] rounded-xl px-3 py-2 font-mono text-xs text-[#2980fe] select-all">
                      {totpSecret}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="p-2 rounded-xl bg-white border border-[#e5e7eb] text-[#6b7280] hover:text-[#1e2024] cursor-pointer"
                    >
                      {copiedSecret ? <Check className="h-4 w-4 text-[#03b875]" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleVerify2FACode} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1e2024] mb-1">
                      Enter 6-Digit Verification Code from App
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={totpInputCode}
                      onChange={(e) => setTotpInputCode(e.target.value)}
                      placeholder="000000"
                      className="w-full bg-white border border-[#e5e7eb] rounded-xl px-3.5 py-2.5 text-sm text-[#1e2024] font-mono tracking-widest text-center focus:border-[#2980fe] focus:outline-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting2FA || totpInputCode.length !== 6}
                    className="w-full bg-[#03b875] hover:bg-[#029b63] text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
                  >
                    {isSubmitting2FA ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Confirm & Activate 2FA</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Backup Recovery Codes */}
            {backupCodes.length > 0 && (
              <div className="border-t border-[#e5e7eb] pt-4">
                <span className="text-xs font-bold text-amber-700 block mb-1">
                  Save Your Emergency Backup Recovery Codes:
                </span>
                <p className="text-[11px] text-[#6b7280] mb-3">
                  Store these one-time codes in a secure offline location if you ever lose your phone.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {backupCodes.map((code, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-[#e5e7eb] rounded-lg p-2 font-mono text-xs text-[#1e2024] text-center font-bold select-all shadow-xs"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Disable 2FA Form */}
        {showDisable2FA && (
          <form onSubmit={handleDisable2FA} className="bg-[#f7f8fa] p-4 rounded-xl border border-rose-200 space-y-3">
            <h4 className="text-xs font-bold text-rose-600">Confirm Deactivation of 2FA</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[#6b7280] mb-1">Account Password</label>
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  className="w-full bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-xs text-[#1e2024]"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#6b7280] mb-1">Current 2FA Code</label>
                <input
                  type="text"
                  value={disableTotp}
                  onChange={(e) => setDisableTotp(e.target.value)}
                  placeholder="6-digit code"
                  className="w-full bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-xs text-[#1e2024] font-mono"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowDisable2FA(false)}
                className="px-3 py-1.5 rounded-lg bg-white border border-[#e5e7eb] text-xs text-[#6b7280] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting2FA}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
              >
                Confirm Disable
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Anti-Phishing Code Card */}
      <div className="rounded-3xl border border-[#e5e7eb] bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-start space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-[#2980fe] shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-[#1e2024]">Anti-Phishing Verification Code</h3>
            <p className="text-xs text-[#6b7280] mt-0.5">
              Set a personal secret phrase that will be attached to every genuine system email and withdrawal confirmation.
            </p>
          </div>
        </div>

        {phishingMsg && (
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-[#2980fe]">
            {phishingMsg}
          </div>
        )}

        <form onSubmit={handleSaveAntiPhishing} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            maxLength={20}
            value={antiPhishingCode}
            onChange={(e) => setAntiPhishingCode(e.target.value)}
            placeholder="e.g. VAULT_SECURE_2026"
            className="flex-1 bg-[#f7f8fa] border border-[#e5e7eb] rounded-xl px-3.5 py-2.5 text-xs text-[#1e2024] font-mono uppercase focus:border-[#2980fe] focus:outline-none"
            required
          />
          <button
            type="submit"
            disabled={isSavingPhishing}
            className="px-5 py-2.5 rounded-xl bg-[#2980fe] hover:bg-[#2268d1] text-white font-bold text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
          >
            {isSavingPhishing ? 'Saving...' : 'Save Phrase'}
          </button>
        </form>
      </div>

      {/* Active Device Sessions Table */}
      <div className="rounded-3xl border border-[#e5e7eb] bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#1e2024] flex items-center gap-2">
              <Monitor className="h-4 w-4 text-[#03b875]" />
              <span>Active Authorized Sessions</span>
            </h3>
            <p className="text-xs text-[#6b7280]">
              Review and terminate active browser tokens and remote client sessions
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleRevokeSession(undefined, true)}
            className="px-3.5 py-2 rounded-xl bg-[#f7f8fa] hover:bg-rose-50 text-[#6b7280] hover:text-rose-600 border border-[#e5e7eb] text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Revoke All Other Sessions</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#e5e7eb] text-[#8a93a6] uppercase tracking-wider text-[10px]">
                <th className="pb-2 font-semibold">Device & Browser</th>
                <th className="pb-2 font-semibold">IP Address</th>
                <th className="pb-2 font-semibold">Last Active</th>
                <th className="pb-2 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6] font-medium">
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td className="py-3 text-[#1e2024] font-medium flex items-center gap-2">
                    <Monitor className="h-3.5 w-3.5 text-[#8a93a6]" />
                    <span className="truncate max-w-[200px]">{s.userAgent}</span>
                    {s.isCurrent && (
                      <span className="bg-emerald-50 text-[#03b875] text-[10px] px-1.5 py-0.5 rounded-full font-bold border border-emerald-200">
                        THIS DEVICE
                      </span>
                    )}
                  </td>
                  <td className="py-3 font-mono text-[#6b7280]">{s.ipAddress}</td>
                  <td className="py-3 font-mono text-[#6b7280]">
                    {new Date(s.lastActiveAt).toLocaleString()}
                  </td>
                  <td className="py-3 text-right">
                    {!s.isCurrent && (
                      <button
                        onClick={() => handleRevokeSession(s.id)}
                        className="text-rose-500 hover:text-rose-600 font-semibold p-1 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="Terminate Session"
                      >
                        Terminate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Update Card */}
      <div className="rounded-3xl border border-[#e5e7eb] bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-[#1e2024] flex items-center gap-2">
          <Key className="h-4 w-4 text-[#2980fe]" />
          <span>Change Account Password</span>
        </h3>

        {pwMsg && (
          <div
            className={`p-3 rounded-xl text-xs ${
              pwMsg.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-rose-50 border border-rose-200 text-rose-600'
            }`}
          >
            {pwMsg.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-[#6b7280] mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-[#f7f8fa] border border-[#e5e7eb] rounded-xl px-3 py-2 text-xs text-[#1e2024] focus:border-[#2980fe] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#6b7280] mb-1">New Password (8+ chars)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#f7f8fa] border border-[#e5e7eb] rounded-xl px-3 py-2 text-xs text-[#1e2024] focus:border-[#2980fe] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#6b7280] mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#f7f8fa] border border-[#e5e7eb] rounded-xl px-3 py-2 text-xs text-[#1e2024] focus:border-[#2980fe] focus:outline-none"
                required
              />
            </div>
          </div>

          {is2FAEnabled && (
            <div className="max-w-xs">
              <label className="block text-[11px] text-[#6b7280] mb-1">2FA Code</label>
              <input
                type="text"
                value={pwTotp}
                onChange={(e) => setPwTotp(e.target.value)}
                placeholder="6-digit code"
                className="w-full bg-[#f7f8fa] border border-[#e5e7eb] rounded-xl px-3 py-2 text-xs text-[#1e2024] font-mono text-center"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isChangingPw}
            className="bg-[#2980fe] hover:bg-[#2268d1] text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
          >
            {isChangingPw ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
