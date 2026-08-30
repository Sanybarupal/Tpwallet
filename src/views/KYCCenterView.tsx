import React, { useState, useEffect } from 'react';
import { 
  UserCheck, ShieldCheck, FileText, CheckCircle2, 
  AlertTriangle, Upload, RefreshCw, Clock, ArrowRight,
  Shield, Check, Camera
} from 'lucide-react';
import { KYCApplication } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export const KYCCenterView: React.FC = () => {
  const { user, refreshUserData } = useAuth();
  const [kycStatus, setKycStatus] = useState<string>('UNVERIFIED');
  const [kycTier, setKycTier] = useState<number>(0);
  const [latestApp, setLatestApp] = useState<KYCApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [targetTier, setTargetTier] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    dob: '1992-05-14',
    nationality: 'United States',
    address: '450 Mission Street, Suite 2200',
    city: 'San Francisco',
    postalCode: '94105',
    country: 'United States',
    documentType: 'PASSPORT' as 'PASSPORT' | 'DRIVERS_LICENSE' | 'NATIONAL_ID',
    documentNumber: 'A94827102',
    documentFrontUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&q=80',
    documentBackUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&q=80',
    selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80',
  });

  const fetchKYC = async () => {
    setIsLoading(true);
    try {
      const res = await api.getKYCStatus();
      setKycStatus(res.kycStatus);
      setKycTier(res.kycTier);
      setLatestApp(res.latestApplication);
      if (res.kycTier >= 1) {
        setTargetTier(2);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKYC();
  }, []);

  const handleFileUploadSim = (field: 'documentFrontUrl' | 'documentBackUrl' | 'selfieUrl', name: string) => {
    // Generates a mock uploaded asset URL representation
    setFormData((prev) => ({
      ...prev,
      [field]: `https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80&doc=${name}`,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload: Partial<KYCApplication> = {
        tier: targetTier === 1 ? 1 : 2,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dob,
        dob: formData.dob,
        nationality: formData.nationality,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        country: formData.country,
        idType: formData.documentType,
        documentType: formData.documentType,
        idNumber: formData.documentNumber,
        documentNumber: formData.documentNumber,
        idFrontUrl: formData.documentFrontUrl,
        documentFrontUrl: formData.documentFrontUrl,
        idBackUrl: targetTier === 2 ? formData.documentBackUrl : undefined,
        documentBackUrl: targetTier === 2 ? formData.documentBackUrl : undefined,
        selfieUrl: targetTier === 2 ? formData.selfieUrl : undefined,
      };

      const res = await api.submitKYC(payload);
      setSuccessMsg(res.message || 'KYC application submitted successfully for compliance review.');
      await fetchKYC();
      await refreshUserData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'KYC submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#1e2024] flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-[#03b875]" />
          <span>Identity Verification (KYC / AML)</span>
        </h2>
        <p className="text-xs text-[#6b7280]">
          Verify your identity to increase withdrawal limits and activate high-volume multi-network settlement
        </p>
      </div>

      {/* Tier Limit Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tier 0 */}
        <div className={`p-5 rounded-2xl border transition-all ${
          kycTier === 0 
            ? 'bg-white border-[#03b875] ring-1 ring-[#03b875]/20 shadow-xs' 
            : 'bg-white border-[#e5e7eb] shadow-xs'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#8a93a6]">TIER 0</span>
            {kycTier === 0 && (
              <span className="bg-emerald-50 text-[#03b875] text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                CURRENT TIER
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-[#1e2024]">Unverified Starter</h3>
          <p className="text-xs text-[#6b7280] mt-1">Default account capabilities with limited withdrawal limits</p>
          <div className="mt-4 pt-4 border-t border-[#f3f4f6] space-y-2 text-xs">
            <div className="flex justify-between text-[#6b7280]">
              <span>Daily Limit:</span>
              <span className="font-mono text-[#1e2024] font-semibold">$500 USDT</span>
            </div>
            <div className="flex justify-between text-[#6b7280]">
              <span>Internal Transfers:</span>
              <span className="text-[#03b875] font-semibold">Enabled</span>
            </div>
          </div>
        </div>

        {/* Tier 1 */}
        <div className={`p-5 rounded-2xl border transition-all ${
          kycTier === 1 
            ? 'bg-white border-[#2980fe] ring-1 ring-[#2980fe]/20 shadow-xs' 
            : 'bg-white border-[#e5e7eb] shadow-xs'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#2980fe]">TIER 1</span>
            {kycTier === 1 && (
              <span className="bg-[#f0f4ff] text-[#2980fe] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#dbeafe]">
                CURRENT TIER
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-[#1e2024]">Standard Verified</h3>
          <p className="text-xs text-[#6b7280] mt-1">Personal address details & basic identity confirmation</p>
          <div className="mt-4 pt-4 border-t border-[#f3f4f6] space-y-2 text-xs">
            <div className="flex justify-between text-[#6b7280]">
              <span>Daily Limit:</span>
              <span className="font-mono text-[#03b875] font-semibold">$10,000 USDT</span>
            </div>
            <div className="flex justify-between text-[#6b7280]">
              <span>Approval Speed:</span>
              <span className="text-[#1e2024]">Automated (~5 mins)</span>
            </div>
          </div>
        </div>

        {/* Tier 2 */}
        <div className={`p-5 rounded-2xl border transition-all ${
          kycTier === 2 
            ? 'bg-white border-purple-500 ring-1 ring-purple-500/20 shadow-xs' 
            : 'bg-white border-[#e5e7eb] shadow-xs'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-purple-600">TIER 2</span>
            {kycTier >= 2 && (
              <span className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200">
                ACTIVE / VERIFIED
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-[#1e2024]">Enterprise Unlimited</h3>
          <p className="text-xs text-[#6b7280] mt-1">Government Passport / ID scan + biometric facial verification</p>
          <div className="mt-4 pt-4 border-t border-[#f3f4f6] space-y-2 text-xs">
            <div className="flex justify-between text-[#6b7280]">
              <span>Daily Limit:</span>
              <span className="font-mono text-purple-600 font-bold">$500,000+ USDT</span>
            </div>
            <div className="flex justify-between text-[#6b7280]">
              <span>Dedicated Custody:</span>
              <span className="text-[#03b875] font-semibold">Enabled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Latest Application Status Banner */}
      {latestApp && (
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-[#8a93a6]">Latest Submission Status</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                latestApp.status === 'APPROVED'
                  ? 'bg-emerald-50 text-[#03b875] border border-emerald-200'
                  : latestApp.status === 'PENDING'
                  ? 'bg-amber-50 text-amber-600 border border-amber-200'
                  : 'bg-rose-50 text-rose-600 border border-rose-200'
              }`}
            >
              {latestApp.status === 'PENDING' ? 'Under Review by Compliance Officer' : latestApp.status}
            </span>
          </div>

          <p className="text-xs text-[#1e2024]">
            Tier {latestApp.tierRequested} verification submitted on {new Date(latestApp.submittedAt).toLocaleDateString()}
          </p>

          {latestApp.rejectionReason && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              <strong>Compliance Officer Note:</strong> {latestApp.rejectionReason}
            </div>
          )}
        </div>
      )}

      {/* Submission Form */}
      {kycTier < 2 && (
        <div className="rounded-3xl border border-[#e5e7eb] bg-white p-6 shadow-xs space-y-6">
          <div className="border-b border-[#f3f4f6] pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#1e2024]">
                Submit Tier {targetTier} Application
              </h3>
              <p className="text-xs text-[#6b7280]">
                Please provide accurate legal details matching your official government records.
              </p>
            </div>
            
            {/* Tier Switcher for submission */}
            <div className="flex bg-[#f7f8fa] p-1 rounded-xl border border-[#e5e7eb] text-xs">
              <button
                type="button"
                onClick={() => setTargetTier(1)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  targetTier === 1 ? 'bg-[#2980fe] text-white shadow-xs' : 'text-[#6b7280] hover:text-[#1e2024]'
                }`}
              >
                Tier 1 (Personal)
              </button>
              <button
                type="button"
                onClick={() => setTargetTier(2)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  targetTier === 2 ? 'bg-purple-600 text-white shadow-xs' : 'text-[#6b7280] hover:text-[#1e2024]'
                }`}
              >
                Tier 2 (ID + Biometrics)
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-600 flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 flex items-start space-x-2">
              <Check className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1e2024] mb-1">Legal First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full bg-[#f7f8fa] border border-[#e5e7eb] rounded-xl px-3.5 py-2 text-xs text-[#1e2024] focus:border-[#2980fe] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1e2024] mb-1">Legal Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full bg-[#f7f8fa] border border-[#e5e7eb] rounded-xl px-3.5 py-2 text-xs text-[#1e2024] focus:border-[#2980fe] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1e2024] mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full bg-[#f7f8fa] border border-[#e5e7eb] rounded-xl px-3.5 py-2 text-xs text-[#1e2024] focus:border-[#2980fe] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1e2024] mb-1">Nationality</label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  className="w-full bg-[#f7f8fa] border border-[#e5e7eb] rounded-xl px-3.5 py-2 text-xs text-[#1e2024] focus:border-[#2980fe] focus:outline-none"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#1e2024] mb-1">Residential Street Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-[#f7f8fa] border border-[#e5e7eb] rounded-xl px-3.5 py-2 text-xs text-[#1e2024] focus:border-[#2980fe] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1e2024] mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-[#f7f8fa] border border-[#e5e7eb] rounded-xl px-3.5 py-2 text-xs text-[#1e2024] focus:border-[#2980fe] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1e2024] mb-1">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full bg-[#f7f8fa] border border-[#e5e7eb] rounded-xl px-3.5 py-2 text-xs text-[#1e2024] focus:border-[#2980fe] focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Tier 2 Documents & Biometrics */}
            {targetTier === 2 && (
              <div className="pt-4 border-t border-[#f3f4f6] space-y-4">
                <h4 className="text-xs font-bold text-purple-600 uppercase tracking-wider">
                  Tier 2 Identity Documents & Biometrics
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1e2024] mb-1">Document Type</label>
                    <select
                      value={formData.documentType}
                      onChange={(e) => setFormData({ ...formData, documentType: e.target.value as any })}
                      className="w-full bg-[#f7f8fa] border border-[#e5e7eb] rounded-xl px-3.5 py-2 text-xs text-[#1e2024] focus:border-purple-500 focus:outline-none"
                    >
                      <option value="PASSPORT">International Passport</option>
                      <option value="DRIVERS_LICENSE">Driver's License</option>
                      <option value="NATIONAL_ID">National ID Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1e2024] mb-1">Document Serial Number</label>
                    <input
                      type="text"
                      value={formData.documentNumber}
                      onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                      placeholder="e.g. P12849182"
                      className="w-full bg-[#f7f8fa] border border-[#e5e7eb] rounded-xl px-3.5 py-2 text-xs text-[#1e2024] font-mono focus:border-purple-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Upload Previews */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-[#f7f8fa] p-3 rounded-xl border border-[#e5e7eb] text-center space-y-2">
                    <span className="text-[11px] font-semibold text-[#6b7280] block">ID Document (Front)</span>
                    <img
                      src={formData.documentFrontUrl}
                      alt="Front Scan"
                      className="h-24 w-full object-cover rounded-lg border border-[#e5e7eb]"
                    />
                    <button
                      type="button"
                      onClick={() => handleFileUploadSim('documentFrontUrl', 'passport_front.jpg')}
                      className="w-full text-[10px] font-bold text-[#1e2024] hover:bg-[#e5e7eb] bg-white py-1 rounded border border-[#e5e7eb] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Upload className="h-3 w-3" /> Change File
                    </button>
                  </div>

                  <div className="bg-[#f7f8fa] p-3 rounded-xl border border-[#e5e7eb] text-center space-y-2">
                    <span className="text-[11px] font-semibold text-[#6b7280] block">ID Document (Back)</span>
                    <img
                      src={formData.documentBackUrl}
                      alt="Back Scan"
                      className="h-24 w-full object-cover rounded-lg border border-[#e5e7eb]"
                    />
                    <button
                      type="button"
                      onClick={() => handleFileUploadSim('documentBackUrl', 'passport_back.jpg')}
                      className="w-full text-[10px] font-bold text-[#1e2024] hover:bg-[#e5e7eb] bg-white py-1 rounded border border-[#e5e7eb] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Upload className="h-3 w-3" /> Change File
                    </button>
                  </div>

                  <div className="bg-[#f7f8fa] p-3 rounded-xl border border-[#e5e7eb] text-center space-y-2">
                    <span className="text-[11px] font-semibold text-[#6b7280] block">Facial Liveness Selfie</span>
                    <img
                      src={formData.selfieUrl}
                      alt="Selfie"
                      className="h-24 w-full object-cover rounded-lg border border-[#e5e7eb]"
                    />
                    <button
                      type="button"
                      onClick={() => handleFileUploadSim('selfieUrl', 'live_selfie.jpg')}
                      className="w-full text-[10px] font-bold text-[#1e2024] hover:bg-[#e5e7eb] bg-white py-1 rounded border border-[#e5e7eb] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Camera className="h-3 w-3" /> Capture Live
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#03b875] hover:bg-[#029b63] text-white font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 mt-4 cursor-pointer shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Submitting to Compliance Engine...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Submit Tier {targetTier} Application</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
