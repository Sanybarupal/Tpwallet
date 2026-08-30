import React, { useState, useEffect, useCallback } from 'react';
import { 
  History, Search, Filter, Download, ArrowDownLeft, 
  ArrowUpRight, Send, RefreshCw, ExternalLink, ChevronLeft, 
  ChevronRight, FileSpreadsheet, FileJson, Clock, Check
} from 'lucide-react';
import { TransactionItem } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export const TransactionsView: React.FC = () => {
  const { setSelectedTxDetail, triggerHaptic } = useAuth();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [networkFilter, setNetworkFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getTransactions({
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
        network: networkFilter !== 'ALL' ? networkFilter : undefined,
        search: searchQuery || undefined,
        page,
        limit: 15,
      });
      setTransactions(res.transactions);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, networkFilter, searchQuery, page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleExportCSV = () => {
    triggerHaptic();
    if (transactions.length === 0) return;
    const headers = ['ID', 'Type', 'Network', 'Amount_USDT', 'Fee_USDT', 'Net_USDT', 'Status', 'TxHash', 'Counterparty', 'Date'];
    const rows = transactions.map((t) => [
      t.id,
      t.type,
      t.network,
      t.amount,
      t.fee,
      t.netAmount,
      t.status,
      t.txHash || '',
      t.counterpartyAddress,
      t.createdAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `usdt_vault_ledger_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    triggerHaptic();
    if (transactions.length === 0) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `usdt_vault_ledger_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* Top Header with Total Count & Export */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#03b875]/10 border border-[#03b875]/20 text-[#03b875]">
            <History className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#1e2024]">Ledger History</h2>
            <p className="text-[10px] text-[#6b7280] font-mono">
              {totalCount} Total Entries • Double-Entry Audited
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleExportCSV}
            className="p-2 rounded-xl bg-white border border-[#e5e7eb] text-[#6b7280] hover:text-[#1e2024] transition-colors shadow-xs"
            title="Export CSV"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-[#03b875]" />
          </button>
          <button
            onClick={() => {
              triggerHaptic();
              fetchTransactions();
            }}
            className="p-2 rounded-xl bg-white border border-[#e5e7eb] text-[#6b7280] hover:text-[#1e2024] transition-colors shadow-xs"
            title="Refresh Ledger"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-[#2980fe]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#9ca3af]" />
          <input
            type="text"
            placeholder="Search TxHash, address, email or ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full bg-white border border-[#e5e7eb] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#1e2024] placeholder-[#9ca3af] focus:border-[#2980fe] focus:outline-none shadow-xs"
          />
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'ALL', label: 'All Events' },
            { id: 'DEPOSIT', label: 'Deposits' },
            { id: 'WITHDRAWAL', label: 'Withdrawals' },
            { id: 'TRANSFER_IN', label: 'Transfers In' },
            { id: 'TRANSFER_OUT', label: 'Transfers Out' },
          ].map((item) => {
            const isSelected = typeFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setTypeFilter(item.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition-all ${
                  isSelected
                    ? 'bg-[#2980fe] text-white shadow-xs'
                    : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:text-[#1e2024]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Network Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {['ALL', 'TRC20', 'ERC20', 'BEP20', 'INTERNAL'].map((net) => {
            const isSelected = networkFilter === net;
            return (
              <button
                key={net}
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setNetworkFilter(net);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold shrink-0 transition-all ${
                  isSelected
                    ? 'bg-[#f0f4ff] text-[#2980fe] border border-[#dbeafe] shadow-xs'
                    : 'bg-white text-[#9ca3af] border border-[#e5e7eb] hover:text-[#1e2024]'
                }`}
              >
                {net === 'ALL' ? 'All Networks' : net}
              </button>
            );
          })}
        </div>
      </div>

      {/* Transaction List (Touch-Friendly Native APK Cards) */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#9ca3af] flex flex-col items-center bg-white rounded-3xl border border-[#e5e7eb] shadow-xs">
            <RefreshCw className="h-6 w-6 animate-spin text-[#2980fe] mb-2" />
            <span>Loading verified ledger entries...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#9ca3af] border border-[#e5e7eb] bg-white rounded-3xl shadow-xs">
            No transactions matching filter criteria.
          </div>
        ) : (
          transactions.map((tx) => {
            const isDep = tx.type === 'DEPOSIT';
            const isWith = tx.type === 'WITHDRAWAL';
            const isTrfIn = tx.type === 'TRANSFER_IN';
            const isTrfOut = tx.type === 'TRANSFER_OUT';
            const isPositive = isDep || isTrfIn;

            return (
              <div
                key={tx.id}
                onClick={() => {
                  triggerHaptic();
                  setSelectedTxDetail(tx);
                }}
                className="bg-white rounded-2xl border border-[#e5e7eb] p-3.5 hover:border-[#2980fe]/40 transition-all cursor-pointer shadow-xs group space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-xs ${
                        isPositive
                          ? 'bg-[#03b875]/10 text-[#03b875] border border-[#03b875]/20'
                          : 'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20'
                      }`}
                    >
                      {isDep && <ArrowDownLeft className="h-4 w-4" />}
                      {isWith && <ArrowUpRight className="h-4 w-4" />}
                      {isTrfIn && <ArrowDownLeft className="h-4 w-4" />}
                      {isTrfOut && <Send className="h-4 w-4" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1e2024] group-hover:text-[#2980fe] transition-colors">
                        {tx.type.replace('_', ' ')}
                      </h4>
                      <span className="text-[10px] font-mono text-[#8a93a6]">
                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className={`text-xs font-bold block ${isPositive ? 'text-[#03b875]' : 'text-[#1e2024]'}`}>
                      {isPositive ? '+' : '-'}{tx.amount.toFixed(2)} USDT
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${
                        tx.status === 'COMPLETED' || tx.status === 'APPROVED' || tx.status === 'CONFIRMED'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : tx.status === 'PENDING' || tx.status === 'CONFIRMING' || tx.status === 'PENDING_REVIEW'
                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : 'bg-rose-50 text-rose-600 border border-rose-200'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>

                {/* Sub row with network tag & counterparty address */}
                <div className="flex items-center justify-between text-[11px] bg-[#f7f8fa] p-2 rounded-xl border border-[#e5e7eb] font-mono text-[#6b7280]">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-[#1e2024] border border-[#e5e7eb]">
                    {tx.network}
                  </span>
                  <span className="truncate max-w-[200px] text-[#6b7280] group-hover:text-[#1e2024]">
                    {tx.txHash ? `${tx.txHash.slice(0, 10)}...${tx.txHash.slice(-6)}` : tx.counterpartyAddress}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-2 bg-white rounded-2xl border border-[#e5e7eb] text-xs shadow-xs">
          <button
            onClick={() => {
              triggerHaptic();
              setPage(Math.max(1, page - 1));
            }}
            disabled={page === 1}
            className="p-2 rounded-xl bg-[#f7f8fa] border border-[#e5e7eb] disabled:opacity-40 text-[#6b7280] hover:text-[#1e2024]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-mono text-[11px] text-[#6b7280]">
            Page <strong className="text-[#1e2024]">{page}</strong> of {totalPages}
          </span>
          <button
            onClick={() => {
              triggerHaptic();
              setPage(Math.min(totalPages, page + 1));
            }}
            disabled={page === totalPages}
            className="p-2 rounded-xl bg-[#f7f8fa] border border-[#e5e7eb] disabled:opacity-40 text-[#6b7280] hover:text-[#1e2024]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
