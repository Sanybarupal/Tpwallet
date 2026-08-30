import crypto from 'crypto';
import { db, NETWORKS } from '../db';
import { ReconciliationSummary } from '../types';

export class ReconciliationService {
  constructor() {
    this.startPeriodicReconciliation();
  }

  /**
   * Executes a full reconciliation pass across the financial ledger and on-chain custody reserves.
   */
  public async runReconciliation(): Promise<ReconciliationSummary> {
    return db.withLock(async () => {
      // 1. Calculate total user liability from ledger
      let totalUserLiabilityUSDT = 0;
      let totalPendingWithdrawalsUSDT = 0;

      for (const entry of db.ledgerEntries) {
        if (entry.accountType === 'LIABILITY_DEPOSIT') {
          totalUserLiabilityUSDT += entry.creditAmount - entry.debitAmount;
        } else if (entry.accountType === 'ASSET_PENDING_WITHDRAWAL') {
          totalPendingWithdrawalsUSDT += entry.creditAmount - entry.debitAmount;
        }
      }

      totalUserLiabilityUSDT = Math.max(0, Number(totalUserLiabilityUSDT.toFixed(4)));
      totalPendingWithdrawalsUSDT = Math.max(0, Number(totalPendingWithdrawalsUSDT.toFixed(4)));

      // 2. Sum custody reserves
      const onChainBalances = {
        TRC20: Number(db.custodyReserves.TRC20.toFixed(4)),
        ERC20: Number(db.custodyReserves.ERC20.toFixed(4)),
        BEP20: Number(db.custodyReserves.BEP20.toFixed(4)),
      };

      const totalSystemReservesUSDT = Number(
        (onChainBalances.TRC20 + onChainBalances.ERC20 + onChainBalances.BEP20).toFixed(4)
      );

      // 3. Compute Solvency and Discrepancies
      const solvencyRatio = totalUserLiabilityUSDT > 0 
        ? Number((totalSystemReservesUSDT / totalUserLiabilityUSDT).toFixed(4))
        : 1.0;

      const discrepancyUSDT = Number((totalSystemReservesUSDT - totalUserLiabilityUSDT).toFixed(4));
      const alerts: string[] = [];

      if (totalSystemReservesUSDT < totalUserLiabilityUSDT) {
        alerts.push(`CRITICAL: System reserves (${totalSystemReservesUSDT.toFixed(2)} USDT) are less than total user liability (${totalUserLiabilityUSDT.toFixed(2)} USDT)!`);
      }

      // Check for unconfirmed stuck deposits (> 24 hours)
      const now = Date.now();
      const stuckDeposits = Array.from(db.deposits.values()).filter(
        (d) => d.status === 'CONFIRMING' && now - new Date(d.detectedAt).getTime() > 24 * 3600 * 1000
      );
      if (stuckDeposits.length > 0) {
        alerts.push(`Warning: ${stuckDeposits.length} deposits have been awaiting confirmation for over 24 hours.`);
      }

      const summary: ReconciliationSummary = {
        id: `recon_${crypto.randomUUID()}`,
        timestamp: new Date().toISOString(),
        totalUserLiabilityUSDT,
        totalSystemReservesUSDT,
        totalPendingWithdrawalsUSDT,
        onChainBalances,
        solvencyRatio,
        discrepancyUSDT,
        status: alerts.length > 0 ? 'DISCREPANCY_DETECTED' : 'SOLVENT_MATCH',
        alerts,
      };

      db.reconciliationLogs.unshift(summary);
      if (db.reconciliationLogs.length > 100) {
        db.reconciliationLogs.pop();
      }

      return summary;
    });
  }

  private startPeriodicReconciliation() {
    // Run initial reconciliation
    setTimeout(() => {
      this.runReconciliation().catch(console.error);
    }, 2000);

    // Periodic run every 5 minutes
    setInterval(() => {
      this.runReconciliation().catch(console.error);
    }, 5 * 60 * 1000);
  }
}

export const reconciliationService = new ReconciliationService();
