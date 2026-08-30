import React, { useState } from 'react';
import { 
  X, Copy, Check, ExternalLink, ArrowDownLeft, 
  ArrowUpRight, Send, ShieldCheck, AlertTriangle, 
  Clock, Hash, FileText
} from 'lucide-react';
import { TransactionItem } from '../types';

interface TransactionDetailModalProps {
  tx: TransactionItem | null;
  onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({ tx, onClose }) => {
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  if (!tx) return null;

  const handleCopyHash = () => {
    if (!tx.txHash) return;
    navigator.clipboard.writeText(tx.txHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(tx.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const isDeposit = tx.type === 'DEPOSIT';
  const isWithdrawal = tx.type === 'WITHDRAWAL';
  const isTransferIn = tx.type === 'TRANSFER_IN';
  const isTransferOut = tx.type === 'TRANSFER_OUT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg bg-white dark:bg-[#121620] rounded-3xl border border-[#e5e7eb] dark:border-[#1e2433] p-6 shadow-2xl relative text-[#1e2024] dark:text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#9ca3af] hover:text-[#1e2024] dark:hover:text-white p-2 rounded-full hover:bg-[#f7f8fa] dark:hover:bg-[#182030] transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Top Status Header */}
        <div className="flex flex-col items-center text-center pb-5 border-b border-[#f5f6f8] dark:border-[#182030]">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl border mb-3 ${
              isDeposit || isTransferIn
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-[#03b875]'
                : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400'
            }`}
          >
            {isDeposit && <ArrowDownLeft className="h-7 w-7" />}
            {isWithdrawal && <ArrowUpRight className="h-7 w-7" />}
            {isTransferIn && <ArrowDownLeft className="h-7 w-7" />}
            {isTransferOut && <Send className="h-7 w-7" />}
          </div>

          <span className="text-xs uppercase tracking-wider font-semibold text-[#6b7280] dark:text-[#94a3b8]">
            {tx.type.replace('_', ' ')} • {tx.network}
          </span>
          <h3 className="text-2xl font-black font-mono text-[#1e2024] dark:text-white mt-1">
            {isDeposit || isTransferIn ? '+' : '-'}{tx.netAmount.toFixed(2)}{' '}
            <span className="text-sm font-sans font-bold text-[#6b7280] dark:text-[#94a3b8]">USDT</span>
          </h3>

          <div className="mt-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                tx.status === 'CONFIRMED' || tx.status === 'COMPLETED' || tx.status === 'APPROVED'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-[#03b875] border border-emerald-200 dark:border-emerald-500/20'
                  : tx.status === 'PENDING' || tx.status === 'CONFIRMING' || tx.status === 'PENDING_REVIEW'
                  ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                  : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
              }`}
            >
              {tx.status === 'PENDING_REVIEW' ? 'Under Compliance Review' : tx.status}
            </span>
          </div>
        </div>

        {/* Detailed Metadata Grid */}
        <div className="py-4 space-y-3 text-xs">
          <div className="flex justify-between items-center text-[#6b7280] dark:text-[#94a3b8]">
            <span>Transaction ID</span>
            <button
              onClick={handleCopyId}
              className="font-mono text-[#1e2024] dark:text-white hover:text-[#03b875] flex items-center gap-1 cursor-pointer"
            >
              <span>{tx.id.slice(0, 16)}...</span>
              {copiedId ? <Check className="h-3 w-3 text-[#03b875]" /> : <Copy className="h-3 w-3 text-[#9ca3af]" />}
            </button>
          </div>

          <div className="flex justify-between items-center text-[#6b7280] dark:text-[#94a3b8]">
            <span>Date & Timestamp</span>
            <span className="font-mono text-[#1e2024] dark:text-white">
              {new Date(tx.createdAt).toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center text-[#6b7280] dark:text-[#94a3b8]">
            <span>Gross Amount</span>
            <span className="font-mono text-[#1e2024] dark:text-white">{tx.amount.toFixed(2)} USDT</span>
          </div>

          <div className="flex justify-between items-center text-[#6b7280] dark:text-[#94a3b8]">
            <span>Network / Gas Fee</span>
            <span className="font-mono text-[#1e2024] dark:text-white">{tx.fee > 0 ? `${tx.fee.toFixed(2)} USDT` : '0.00 USDT (Zero Fee)'}</span>
          </div>

          <div className="flex justify-between items-center text-[#6b7280] dark:text-[#94a3b8]">
            <span>Confirmations</span>
            <span className="font-mono text-[#1e2024] dark:text-white">{tx.confirmations}</span>
          </div>

          {tx.note && (
            <div className="flex justify-between items-center text-[#6b7280] dark:text-[#94a3b8]">
              <span>Transfer Memo</span>
              <span className="text-[#1e2024] dark:text-white italic">{tx.note}</span>
            </div>
          )}

          {/* Counterparty Address */}
          <div className="bg-[#f7f8fa] dark:bg-[#0b0e14] p-3 rounded-2xl border border-[#e5e7eb] dark:border-[#1e2433] space-y-2">
            <div>
              <span className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] uppercase tracking-wider block font-bold">
                {isDeposit ? 'Sender Source' : 'Recipient Destination'}
              </span>
              <p className="font-mono text-[#1e2024] dark:text-white break-all select-all text-[11px] mt-0.5">
                {tx.counterpartyAddress}
              </p>
            </div>

            {tx.txHash && (
              <div className="border-t border-[#e5e7eb] dark:border-[#1e2433] pt-2">
                <span className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] uppercase tracking-wider block font-bold">
                  Blockchain Transaction Hash
                </span>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="font-mono text-[#03b875] break-all select-all text-[11px]">
                    {tx.txHash}
                  </p>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <button
                      onClick={handleCopyHash}
                      className="p-1 text-[#6b7280] hover:text-[#1e2024] dark:hover:text-white rounded-lg bg-white dark:bg-[#182030] border border-[#e5e7eb] dark:border-[#1e2433] cursor-pointer"
                      title="Copy Hash"
                    >
                      {copiedHash ? <Check className="h-3 w-3 text-[#03b875]" /> : <Copy className="h-3 w-3" />}
                    </button>
                    {tx.explorerUrl && (
                      <a
                        href={tx.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-[#6b7280] hover:text-[#1e2024] dark:hover:text-white rounded-lg bg-white dark:bg-[#182030] border border-[#e5e7eb] dark:border-[#1e2433] cursor-pointer"
                        title="View on Explorer"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {tx.rejectionReason && (
              <div className="border-t border-[#e5e7eb] dark:border-[#1e2433] pt-2 text-rose-600 dark:text-rose-400 text-[11px]">
                <span className="font-bold block">Compliance Rejection Note:</span>
                <p className="mt-0.5">{tx.rejectionReason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[#f5f6f8] dark:border-[#182030] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="w-full bg-[#f7f8fa] dark:bg-[#182030] hover:bg-slate-100 dark:hover:bg-[#1e2433] text-[#1e2024] dark:text-white font-bold py-2.5 rounded-2xl text-xs transition-colors border border-[#e5e7eb] dark:border-[#1e2433] cursor-pointer"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
