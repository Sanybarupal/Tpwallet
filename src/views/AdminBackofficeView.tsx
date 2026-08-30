import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldAlert, ArrowUpRight, ArrowDownLeft, UserCheck, 
  Users, Check, X, AlertTriangle, RefreshCw, 
  ExternalLink, Search, DollarSign, Database, 
  FileText, Activity, Lock, Unlock, ShieldCheck,
  TrendingUp, Scale, Zap
} from 'lucide-react';
import { 
  AdminMetrics, User, UserBalance, KYCApplication, 
  TransactionItem, AuditLog, ReconciliationSummary 
} from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

type AdminTab = 
  | 'overview'
  | 'withdrawals'
  | 'kyc'
  | 'users'
  | 'deposits'
  | 'ledger'
  | 'reconciliation'
  | 'audit';

export const AdminBackofficeView: React.FC = () => {
  const { user, refreshBalance, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // KPI Metrics
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  // Withdrawals Queue
  const [withdrawals, setWithdrawals] = useState<(TransactionItem & { userEmail: string; riskScore: number; requiresAdminApproval: boolean })[]>([]);
  const [withdrawalFilter, setWithdrawalFilter] = useState('ALL');
  const [isProcessingTx, setIsProcessingTx] = useState<string | null>(null);
  const [rejectReasonModal, setRejectReasonModal] = useState<{ id: string } | null>(null);
  const [rejectReasonText, setRejectReasonText] = useState('');

  // KYC Queue
  const [kycApps, setKycApps] = useState<KYCApplication[]>([]);
  const [selectedKycApp, setSelectedKycApp] = useState<KYCApplication | null>(null);
  const [kycReviewReason, setKycReviewReason] = useState('');

  // User Management
  const [usersList, setUsersList] = useState<(User & { balance: UserBalance })[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [adjustModalUser, setAdjustModalUser] = useState<(User & { balance: UserBalance }) | null>(null);
  const [adjustType, setAdjustType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Deposits
  const [depositsList, setDepositsList] = useState<any[]>([]);

  // Ledger Journal
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);

  // Reconciliation
  const [reconcileData, setReconcileData] = useState<{
    latest: ReconciliationSummary | null;
    history: ReconciliationSummary[];
  }>({ latest: null, history: [] });
  const [isRunningReconcile, setIsRunningReconcile] = useState(false);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await api.getAdminMetrics();
      setMetrics(res.metrics);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMetrics(false);
    }
  }, []);

  const fetchWithdrawals = useCallback(async () => {
    try {
      const res = await api.getAdminWithdrawals(withdrawalFilter !== 'ALL' ? withdrawalFilter : undefined);
      setWithdrawals(res.withdrawals);
    } catch (err) {
      console.error(err);
    }
  }, [withdrawalFilter]);

  const fetchKYC = useCallback(async () => {
    try {
      const res = await api.getAdminKYC();
      setKycApps(res.applications);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.getAdminUsers(userSearch);
      setUsersList(res.users);
    } catch (err) {
      console.error(err);
    }
  }, [userSearch]);

  const fetchDeposits = useCallback(async () => {
    try {
      const res = await api.getAdminDeposits();
      setDepositsList(res.deposits);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchLedger = useCallback(async () => {
    try {
      const res = await api.getAdminLedger({ limit: 40 });
      setLedgerEntries(res.entries);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchReconciliation = useCallback(async () => {
    try {
      const res = await api.getAdminReconciliation();
      setReconcileData(res);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await api.getAdminAuditLogs();
      setAuditLogs(res.logs);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    if (activeTab === 'withdrawals') fetchWithdrawals();
    if (activeTab === 'kyc') fetchKYC();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'deposits') fetchDeposits();
    if (activeTab === 'ledger') fetchLedger();
    if (activeTab === 'reconciliation') fetchReconciliation();
    if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab, fetchWithdrawals, fetchKYC, fetchUsers, fetchDeposits, fetchLedger, fetchReconciliation, fetchAuditLogs]);

  // Actions
  const handleApproveWithdrawal = async (id: string) => {
    setIsProcessingTx(id);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    try {
      const res = await api.approveWithdrawal(id);
      setActionSuccessMsg(`Withdrawal approved! TxHash: ${res.txHash}`);
      await fetchWithdrawals();
      await fetchMetrics();
    } catch (err: unknown) {
      setActionErrorMsg(err instanceof Error ? err.message : 'Approval failed');
    } finally {
      setIsProcessingTx(null);
    }
  };

  const handleRejectWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReasonModal) return;
    setIsProcessingTx(rejectReasonModal.id);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    try {
      const res = await api.rejectWithdrawal(rejectReasonModal.id, rejectReasonText);
      setActionSuccessMsg(res.message);
      setRejectReasonModal(null);
      setRejectReasonText('');
      await fetchWithdrawals();
      await fetchMetrics();
    } catch (err: unknown) {
      setActionErrorMsg(err instanceof Error ? err.message : 'Rejection failed');
    } finally {
      setIsProcessingTx(null);
    }
  };

  const handleReviewKYC = async (id: string, action: 'APPROVE' | 'REJECT' | 'RESUBMIT') => {
    try {
      await api.reviewKYC(id, action, kycReviewReason || undefined);
      setActionSuccessMsg(`KYC application marked as ${action}`);
      setSelectedKycApp(null);
      setKycReviewReason('');
      await fetchKYC();
    } catch (err: unknown) {
      setActionErrorMsg(err instanceof Error ? err.message : 'KYC review failed');
    }
  };

  const handleToggleFreezeUser = async (userId: string, isFrozen: boolean) => {
    try {
      const res = await api.freezeUser(userId, isFrozen ? 'Admin unfreezing' : 'Risk investigation hold');
      setActionSuccessMsg(res.message);
      await fetchUsers();
    } catch (err: unknown) {
      setActionErrorMsg(err instanceof Error ? err.message : 'Action failed');
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalUser) return;
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount <= 0) {
      setActionErrorMsg('Invalid adjustment amount');
      return;
    }

    setIsAdjusting(true);
    try {
      const res = await api.adjustUserBalance({
        userId: adjustModalUser.id,
        type: adjustType,
        amount,
        reason: adjustReason,
      });
      setActionSuccessMsg(res.message);
      setAdjustModalUser(null);
      setAdjustAmount('');
      setAdjustReason('');
      await fetchUsers();
      await fetchMetrics();
      await refreshUserData();
    } catch (err: unknown) {
      setActionErrorMsg(err instanceof Error ? err.message : 'Adjustment failed');
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleTriggerReconcile = async () => {
    setIsRunningReconcile(true);
    try {
      const res = await api.runAdminReconciliation();
      setActionSuccessMsg(`Solvency audit completed: Status is ${res.summary.status}`);
      await fetchReconciliation();
      await fetchMetrics();
    } catch (err: unknown) {
      setActionErrorMsg(err instanceof Error ? err.message : 'Audit failed');
    } finally {
      setIsRunningReconcile(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <span>Admin & Compliance Backoffice Suite</span>
              <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase">
                RBAC: {user?.role.toUpperCase()}
              </span>
            </h1>
            <p className="text-xs text-amber-300/80">
              Live double-entry reserves control, risk authorization queue, and AML compliance oversight
            </p>
          </div>
        </div>

        <button
          onClick={fetchMetrics}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh All Queues</span>
        </button>
      </div>

      {actionSuccessMsg && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs text-emerald-400 flex items-start space-x-2">
          <Check className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {actionErrorMsg && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3.5 text-xs text-rose-400 flex items-start space-x-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{actionErrorMsg}</span>
        </div>
      )}

      {/* KPI Metrics Dashboard Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] font-medium text-slate-400 block">Total User Liabilities</span>
          <span className="font-mono text-lg font-black text-white mt-1 block">
            {metrics ? (metrics.totalLiabilityUSDT || metrics.totalVaultLiability || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '...'}
            <span className="text-xs text-emerald-400 font-sans font-bold ml-1">USDT</span>
          </span>
          <span className="text-[10px] text-slate-500">Total User Balances</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] font-medium text-slate-400 block">On-Chain Reserves</span>
          <span className="font-mono text-lg font-black text-emerald-400 mt-1 block">
            {metrics?.reserves ? metrics.reserves.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '...'}
            <span className="text-xs text-emerald-500 font-sans font-bold ml-1">USDT</span>
          </span>
          <span className="text-[10px] text-emerald-400/80 font-bold">100% Backed</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] font-medium text-slate-400 block">Solvency Ratio</span>
          <span className="font-mono text-lg font-black text-emerald-400 mt-1 block">
            {metrics ? `${((metrics.solvencyRatio || 1) * 100).toFixed(1)}%` : '...'}
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold">Overcollateralized</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] font-medium text-slate-400 block">Pending Withdrawals</span>
          <span className="font-mono text-lg font-black text-amber-400 mt-1 block">
            {metrics ? metrics.pendingWithdrawalsCount : '0'}
          </span>
          <span className="text-[10px] text-amber-400 font-medium">Requires Approval</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] font-medium text-slate-400 block">Total Ingest Deposits</span>
          <span className="font-mono text-lg font-black text-slate-200 mt-1 block">
            {metrics ? metrics.totalDepositsCount : '0'}
          </span>
          <span className="text-[10px] text-slate-500">Mempool & Confirmed</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] font-medium text-slate-400 block">Gas Fee Revenue</span>
          <span className="font-mono text-lg font-black text-purple-400 mt-1 block">
            {metrics ? (metrics.totalFeesCollectedUSDT || 0).toFixed(2) : '0.00'}
          </span>
          <span className="text-[10px] text-purple-400">Vault Treasury Pool</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-3 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-xl transition-all ${
            activeTab === 'overview'
              ? 'bg-slate-800 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Reserves & Overview
        </button>

        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl transition-all ${
            activeTab === 'withdrawals'
              ? 'bg-amber-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <span>Withdrawal Risk Queue</span>
          {metrics && metrics.pendingWithdrawalsCount > 0 && (
            <span className="rounded-full bg-amber-400 text-slate-950 px-1.5 py-0.2 text-[10px] font-black">
              {metrics.pendingWithdrawalsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('kyc')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl transition-all ${
            activeTab === 'kyc'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <span>KYC Compliance</span>
          {metrics && metrics.pendingKycCount > 0 && (
            <span className="rounded-full bg-cyan-400 text-slate-950 px-1.5 py-0.2 text-[10px] font-black">
              {metrics.pendingKycCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-2 rounded-xl transition-all ${
            activeTab === 'users'
              ? 'bg-slate-800 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Users & Adjustments
        </button>

        <button
          onClick={() => setActiveTab('deposits')}
          className={`px-3.5 py-2 rounded-xl transition-all ${
            activeTab === 'deposits'
              ? 'bg-slate-800 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Blockchain Deposits
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-3.5 py-2 rounded-xl transition-all ${
            activeTab === 'ledger'
              ? 'bg-slate-800 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Double-Entry Journal
        </button>

        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`px-3.5 py-2 rounded-xl transition-all ${
            activeTab === 'reconciliation'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Proof-of-Reserves Audit
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3.5 py-2 rounded-xl transition-all ${
            activeTab === 'audit'
              ? 'bg-slate-800 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Audit Logs
        </button>
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['TRC20', 'ERC20', 'BEP20'] as const).map((net) => {
              const resAmount = metrics?.reserves ? metrics.reserves[net] : 0;
              return (
                <div key={net} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-base text-white">{net} VAULT</span>
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>On-Chain Reserves</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {resAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Standard</span>
                      <span className="font-mono text-slate-200">
                        {net === 'TRC20' ? 'TRON TRC-20' : net === 'ERC20' ? 'Ethereum ERC-20' : 'BNB Chain BEP-20'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Solvency Status</span>
                      <span className="font-mono text-emerald-400 font-bold">100% Backed</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Live Health</span>
                      <span className="font-mono text-emerald-400">RPC Connected</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white">System Health & Settlement Automation</h3>
            <p className="text-xs text-slate-400">
              The internal double-entry engine continuously reconciles incoming multi-network transactions. Confirmations run asynchronously in real-time.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Ledger Engine</span>
                <span className="text-emerald-400 font-bold">Double-Entry Immutable</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Risk Engine Limit</span>
                <span className="text-white font-bold">&gt;= 1,000 USDT Manual Approval</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Confirmation Tracker</span>
                <span className="text-emerald-400 font-bold">Active (1s Polling Loop)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: WITHDRAWALS RISK QUEUE */}
      {activeTab === 'withdrawals' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Withdrawal Risk & Approval Queue</h3>
              <p className="text-xs text-slate-400">
                Review high-value withdrawals (&ge; 1,000 USDT) and broadcast approved transactions to the blockchain
              </p>
            </div>

            <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
              {(['ALL', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setWithdrawalFilter(filter)}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    withdrawalFilter === filter
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {filter.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">User / ID</th>
                  <th className="pb-3 font-semibold">Network & Destination</th>
                  <th className="pb-3 font-semibold">Gross / Fee</th>
                  <th className="pb-3 font-semibold">Net Payout</th>
                  <th className="pb-3 font-semibold">Risk Score</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {withdrawals.map((w) => (
                  <tr key={w.id}>
                    <td className="py-3.5 pr-3">
                      <span className="font-bold text-white block">{w.userEmail || 'User'}</span>
                      <span className="font-mono text-[10px] text-slate-500">{w.id.slice(0, 12)}...</span>
                    </td>

                    <td className="py-3.5 pr-3 font-mono text-[11px]">
                      <span className="rounded bg-slate-950 border border-slate-800 px-1.5 py-0.5 text-[10px] text-amber-400 mr-1.5">
                        {w.network}
                      </span>
                      <span className="text-slate-300 truncate max-w-[180px] inline-block align-bottom">
                        {w.counterpartyAddress}
                      </span>
                    </td>

                    <td className="py-3.5 pr-3 font-mono text-slate-400 text-[11px]">
                      <div>{w.amount.toFixed(2)} USDT</div>
                      <div className="text-[10px] text-slate-500">Fee: {w.fee.toFixed(2)}</div>
                    </td>

                    <td className="py-3.5 pr-3 font-mono font-bold text-emerald-400 text-xs">
                      {w.netAmount.toFixed(2)} USDT
                    </td>

                    <td className="py-3.5 pr-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          w.amount >= 5000
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        Risk Score: {w.amount >= 5000 ? '92 (High)' : '45 (Medium)'}
                      </span>
                    </td>

                    <td className="py-3.5 pr-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          w.status === 'APPROVED' || w.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : w.status === 'PENDING_REVIEW'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>

                    <td className="py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {w.status === 'PENDING_REVIEW' ? (
                        <>
                          <button
                            onClick={() => handleApproveWithdrawal(w.id)}
                            disabled={isProcessingTx === w.id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] transition-colors"
                          >
                            {isProcessingTx === w.id ? 'Broadcasting...' : 'Approve & Broadcast'}
                          </button>
                          <button
                            onClick={() => setRejectReasonModal({ id: w.id })}
                            disabled={isProcessingTx === w.id}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-[11px] border border-rose-500/30 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      ) : w.txHash ? (
                        <a
                          href={w.explorerUrl || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 font-mono text-[11px] inline-flex items-center gap-1"
                        >
                          <span>{w.txHash.slice(0, 8)}...</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: KYC COMPLIANCE QUEUE */}
      {activeTab === 'kyc' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">KYC Verification Applications</h3>
              <p className="text-xs text-slate-400">
                Inspect identity documents, proof of residence, and approve or reject KYC tiers
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* List */}
            <div className="space-y-3">
              {kycApps.map((app) => (
                <div
                  key={app.id}
                  onClick={() => setSelectedKycApp(app)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedKycApp?.id === app.id
                      ? 'bg-slate-800 border-cyan-500'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-xs">{app.firstName} {app.lastName}</h4>
                      <p className="text-[11px] text-slate-400">{app.nationality} • DOB: {app.dob}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 block">
                        Tier {app.tierRequested} Request
                      </span>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {new Date(app.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Application Detail Inspector */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4">
              {selectedKycApp ? (
                <>
                  <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        {selectedKycApp.firstName} {selectedKycApp.lastName}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {selectedKycApp.documentType} #{selectedKycApp.documentNumber}
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      Tier {selectedKycApp.tierRequested}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">Address</span>
                      <span className="text-slate-200">{selectedKycApp.address}, {selectedKycApp.city}</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">Country</span>
                      <span className="text-slate-200">{selectedKycApp.country} ({selectedKycApp.nationality})</span>
                    </div>
                  </div>

                  {/* Document Scans */}
                  {selectedKycApp.documentFrontUrl && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-400 block">Submitted ID Document Scan:</span>
                      <img
                        src={selectedKycApp.documentFrontUrl}
                        alt="ID Front"
                        className="h-44 w-full object-cover rounded-xl border border-slate-800"
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Compliance Officer Feedback / Rejection Note</label>
                      <input
                        type="text"
                        value={kycReviewReason}
                        onChange={(e) => setKycReviewReason(e.target.value)}
                        placeholder="e.g. Document image is clear and verified"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReviewKYC(selectedKycApp.id, 'APPROVE')}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded-xl text-xs transition-colors"
                      >
                        Approve Tier {selectedKycApp.tierRequested}
                      </button>
                      <button
                        onClick={() => handleReviewKYC(selectedKycApp.id, 'RESUBMIT')}
                        className="px-3 bg-amber-500/20 text-amber-300 font-bold py-2 rounded-xl text-xs border border-amber-500/30 hover:bg-amber-500/30"
                      >
                        Request Resubmission
                      </button>
                      <button
                        onClick={() => handleReviewKYC(selectedKycApp.id, 'REJECT')}
                        className="px-3 bg-rose-500/20 text-rose-300 font-bold py-2 rounded-xl text-xs border border-rose-500/30 hover:bg-rose-500/30"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-xs text-slate-500">
                  Select an application from the left to inspect documents and take action.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: USERS & BALANCE ADJUSTMENTS */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Registered User Accounts & Balances</h3>
              <p className="text-xs text-slate-400">
                Inspect accounts, lock/freeze wallets, or execute double-entry ledger adjustments
              </p>
            </div>

            <div className="relative">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user by email..."
                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white"
              />
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">User</th>
                  <th className="pb-3 font-semibold">Role</th>
                  <th className="pb-3 font-semibold">KYC / 2FA</th>
                  <th className="pb-3 font-semibold">Available Balance</th>
                  <th className="pb-3 font-semibold">Total Deposited</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {usersList.map((u) => (
                  <tr key={u.id}>
                    <td className="py-3.5 pr-3">
                      <span className="font-bold text-white block">{u.firstName} {u.lastName}</span>
                      <span className="text-slate-400 text-[11px]">{u.email}</span>
                    </td>

                    <td className="py-3.5 pr-3 uppercase font-mono text-[10px] text-slate-300">
                      {u.role}
                    </td>

                    <td className="py-3.5 pr-3 space-x-1">
                      <span className="bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded text-[10px] text-cyan-400 font-bold">
                        Tier {u.kycTier}
                      </span>
                      {u.twoFactorEnabled && (
                        <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-500/20">
                          2FA
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 pr-3 font-mono font-bold text-white">
                      {u.balance?.availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT
                    </td>

                    <td className="py-3.5 pr-3 font-mono text-slate-400">
                      {u.balance?.totalDeposited.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT
                    </td>

                    <td className="py-3.5 pr-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.isFrozen 
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {u.isFrozen ? 'FROZEN' : 'ACTIVE'}
                      </span>
                    </td>

                    <td className="py-3.5 text-right space-x-2">
                      <button
                        onClick={() => setAdjustModalUser(u)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-lg transition-colors"
                      >
                        Adjust Ledger
                      </button>
                      <button
                        onClick={() => handleToggleFreezeUser(u.id, u.isFrozen)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                          u.isFrozen
                            ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                        }`}
                      >
                        {u.isFrozen ? 'Unfreeze' : 'Freeze'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: BLOCKCHAIN DEPOSITS */}
      {activeTab === 'deposits' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">Incoming On-Chain Deposits Monitor</h3>
            <p className="text-xs text-slate-400">
              Live ingest stream across TRC20, ERC20, and BEP20 nodes with real-time block confirmation status
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Network & Hash</th>
                  <th className="pb-3 font-semibold">Vault Address</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Confirmations</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Detected At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {depositsList.map((d) => (
                  <tr key={d.id}>
                    <td className="py-3.5 pr-3 font-mono text-[11px]">
                      <span className="rounded bg-slate-950 border border-slate-800 px-1.5 py-0.5 text-[10px] text-emerald-400 mr-1.5">
                        {d.network}
                      </span>
                      <a
                        href={d.explorerUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-300 hover:text-white inline-flex items-center gap-1"
                      >
                        <span>{d.txHash.slice(0, 14)}...</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>

                    <td className="py-3.5 pr-3 font-mono text-slate-400 text-[11px]">
                      {d.toAddress.slice(0, 16)}...
                    </td>

                    <td className="py-3.5 pr-3 font-mono font-bold text-emerald-400 text-xs">
                      +{d.amount.toFixed(2)} USDT
                    </td>

                    <td className="py-3.5 pr-3 font-mono text-slate-300">
                      {d.confirmations} / {d.requiredConfirmations} Blocks
                    </td>

                    <td className="py-3.5 pr-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        d.status === 'CONFIRMED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {d.status}
                      </span>
                    </td>

                    <td className="py-3.5 text-right font-mono text-slate-500 text-[11px]">
                      {new Date(d.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: DOUBLE-ENTRY JOURNAL */}
      {activeTab === 'ledger' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">Immutable Double-Entry Financial Journal</h3>
            <p className="text-xs text-slate-400">
              System-wide double-entry journal entries (`CREDIT` & `DEBIT`). Balances are derived directly from this immutable ledger.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Entry ID & Type</th>
                  <th className="pb-3 font-semibold">Account / User</th>
                  <th className="pb-3 font-semibold">Amount & Direction</th>
                  <th className="pb-3 font-semibold">Description</th>
                  <th className="pb-3 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {ledgerEntries.map((e) => (
                  <tr key={e.id}>
                    <td className="py-3 pr-3">
                      <span className="font-mono text-[10px] text-slate-500 block">{e.id.slice(0, 14)}...</span>
                      <span className="rounded bg-slate-950 border border-slate-800 px-1.5 py-0.2 text-[10px] text-slate-300 font-bold uppercase">
                        {e.type}
                      </span>
                    </td>

                    <td className="py-3 pr-3 font-mono text-[11px] text-slate-300">
                      {e.userId ? `User: ${e.userId.slice(0, 10)}...` : 'System Treasury'}
                    </td>

                    <td className="py-3 pr-3 font-mono">
                      <span className={`font-bold text-xs ${e.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {e.amount >= 0 ? '+' : ''}{e.amount.toFixed(2)} USDT
                      </span>
                    </td>

                    <td className="py-3 pr-3 text-slate-400 text-[11px]">
                      {e.description}
                    </td>

                    <td className="py-3 text-right font-mono text-slate-500 text-[11px]">
                      {new Date(e.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: PROOF-OF-RESERVES AUDIT */}
      {activeTab === 'reconciliation' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Scale className="h-5 w-5 text-emerald-400" />
                <span>Proof-of-Reserves & Solvency Engine</span>
              </h3>
              <p className="text-xs text-slate-400">
                Automated continuous reconciliation comparing on-chain cryptographic hot/cold reserves against user ledger liabilities.
              </p>
            </div>

            <button
              type="button"
              onClick={handleTriggerReconcile}
              disabled={isRunningReconcile}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center space-x-2"
            >
              {isRunningReconcile ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Auditing Multi-Chain Nodes...</span>
                </>
              ) : (
                <>
                  <Scale className="h-4 w-4" />
                  <span>Run On-Demand Audit</span>
                </>
              )}
            </button>
          </div>

          {reconcileData.latest && (
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Latest Solvency Status
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-2xl font-black text-emerald-400">
                      {reconcileData.latest.solvencyRatio}% SOLVENT
                    </span>
                    <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/20">
                      OVERCOLLATERALIZED
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs text-slate-500">
                  Audit ID: {reconcileData.latest.id.slice(0, 12)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[11px] block">On-Chain Verified Assets</span>
                  <span className="font-mono font-bold text-white text-lg mt-0.5 block">
                    {reconcileData.latest.totalReserves.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT
                  </span>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[11px] block">Ledger Liabilities</span>
                  <span className="font-mono font-bold text-slate-200 text-lg mt-0.5 block">
                    {reconcileData.latest.totalLiabilities.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT
                  </span>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[11px] block">Surplus Buffer</span>
                  <span className="font-mono font-bold text-emerald-400 text-lg mt-0.5 block">
                    +{(reconcileData.latest.totalReserves - reconcileData.latest.totalLiabilities).toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Historical Solvency Audits */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Audit History</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="pb-2 font-semibold">Audit ID</th>
                    <th className="pb-2 font-semibold">Reserves</th>
                    <th className="pb-2 font-semibold">Liabilities</th>
                    <th className="pb-2 font-semibold">Ratio</th>
                    <th className="pb-2 font-semibold">Status</th>
                    <th className="pb-2 font-semibold text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {reconcileData.history.map((h) => (
                    <tr key={h.id}>
                      <td className="py-2.5 pr-2 font-mono text-[11px] text-slate-400">{h.id.slice(0, 14)}...</td>
                      <td className="py-2.5 pr-2 font-mono text-emerald-400">{h.totalReserves.toFixed(2)} USDT</td>
                      <td className="py-2.5 pr-2 font-mono text-white">{h.totalLiabilities.toFixed(2)} USDT</td>
                      <td className="py-2.5 pr-2 font-mono font-bold text-emerald-400">{h.solvencyRatio}%</td>
                      <td className="py-2.5 pr-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {h.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-500 text-[11px]">
                        {new Date(h.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">System Security & Operator Audit Logs</h3>
            <p className="text-xs text-slate-400">
              Immutable trail of all administrative interventions, ledger changes, approvals, and authorization events
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Action Type</th>
                  <th className="pb-3 font-semibold">Actor / IP</th>
                  <th className="pb-3 font-semibold">Target Entity</th>
                  <th className="pb-3 font-semibold">Metadata / Reason</th>
                  <th className="pb-3 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-3 pr-3 font-bold text-white">
                      <span className="rounded bg-slate-950 border border-slate-800 px-2 py-0.5 text-[10px] text-amber-400 font-mono">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 pr-3 font-mono text-slate-400 text-[11px]">
                      {log.actorId ? `Admin (${log.actorId.slice(0, 8)})` : 'System Daemon'}
                      <span className="text-slate-500 block text-[10px]">{log.ipAddress}</span>
                    </td>

                    <td className="py-3 pr-3 font-mono text-slate-300 text-[11px]">
                      {log.targetId ? `${log.targetType}: ${log.targetId.slice(0, 10)}...` : '-'}
                    </td>

                    <td className="py-3 pr-3 text-slate-400 text-[11px] max-w-xs truncate">
                      {JSON.stringify(log.metadata)}
                    </td>

                    <td className="py-3 text-right font-mono text-slate-500 text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REJECT WITHDRAWAL MODAL */}
      {rejectReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <form onSubmit={handleRejectWithdrawal} className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Reject Withdrawal & Release Hold</h3>
            <p className="text-xs text-slate-400">
              Enter the compliance or security reason for rejecting this transaction. The user's escrowed hold will be automatically refunded back to their available ledger balance.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Reason for Rejection</label>
              <textarea
                value={rejectReasonText}
                onChange={(e) => setRejectReasonText(e.target.value)}
                placeholder="e.g. Sanctioned destination address or suspicious high-velocity transfer"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white h-24 focus:border-rose-500 focus:outline-none"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectReasonModal(null)}
                className="px-3 py-2 rounded-xl bg-slate-800 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Confirm Rejection & Refund
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADJUST USER BALANCE MODAL */}
      {adjustModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <form onSubmit={handleAdjustBalance} className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Double-Entry Balance Adjustment</h3>
            <p className="text-xs text-slate-400">
              Post an audited manual double-entry credit or debit for <strong>{adjustModalUser.email}</strong>.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustType('CREDIT')}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  adjustType === 'CREDIT'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                + CREDIT USER
              </button>
              <button
                type="button"
                onClick={() => setAdjustType('DEBIT')}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  adjustType === 'DEBIT'
                    ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                - DEBIT USER
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Adjustment Amount (USDT)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="100.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Audit Justification Note</label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g. Deposit recovery resolution #4102"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdjustModalUser(null)}
                className="px-3 py-2 rounded-xl bg-slate-800 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAdjusting}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
              >
                {isAdjusting ? 'Posting Ledger Entry...' : 'Execute Adjustment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
