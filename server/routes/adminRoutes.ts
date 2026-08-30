import express, { Response } from 'express';
import { db, NETWORKS } from '../db';
import { ledgerService } from '../services/ledgerService';
import { blockchainService } from '../services/blockchainService';
import { securityService } from '../services/securityService';
import { reconciliationService } from '../services/reconciliationService';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Guard all admin routes with auth and admin role check
router.use(requireAuth);
router.use(requireRole(['super_admin', 'finance_manager', 'compliance']));

// GET /api/admin/metrics
router.get('/metrics', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalUsers = db.users.size;
    const activeUsers = Array.from(db.users.values()).filter((u) => !u.isFrozen).length;
    const frozenUsers = totalUsers - activeUsers;

    // Derived ledger metrics
    let totalLiabilityUSDT = 0;
    let totalFeesCollectedUSDT = 0;
    let totalPendingWithdrawalsUSDT = 0;

    for (const entry of db.ledgerEntries) {
      if (entry.accountType === 'LIABILITY_DEPOSIT') {
        totalLiabilityUSDT += entry.creditAmount - entry.debitAmount;
      } else if (entry.accountType === 'FEE_EXPENSE') {
        totalFeesCollectedUSDT += entry.creditAmount - entry.debitAmount;
      } else if (entry.accountType === 'ASSET_PENDING_WITHDRAWAL') {
        totalPendingWithdrawalsUSDT += entry.creditAmount - entry.debitAmount;
      }
    }

    totalLiabilityUSDT = Math.max(0, Number(totalLiabilityUSDT.toFixed(4)));
    totalFeesCollectedUSDT = Math.max(0, Number(totalFeesCollectedUSDT.toFixed(4)));
    totalPendingWithdrawalsUSDT = Math.max(0, Number(totalPendingWithdrawalsUSDT.toFixed(4)));

    const reserves = {
      TRC20: db.custodyReserves.TRC20,
      ERC20: db.custodyReserves.ERC20,
      BEP20: db.custodyReserves.BEP20,
      total: db.custodyReserves.TRC20 + db.custodyReserves.ERC20 + db.custodyReserves.BEP20,
    };

    const pendingWithdrawalsCount = Array.from(db.withdrawals.values()).filter(
      (w) => w.status === 'PENDING_REVIEW'
    ).length;

    const pendingKycCount = Array.from(db.kycApplications.values()).filter(
      (k) => k.status === 'PENDING'
    ).length;

    const totalDepositsCount = db.deposits.size;
    const totalWithdrawalsCount = db.withdrawals.size;

    res.json({
      success: true,
      metrics: {
        totalUsers,
        activeUsers,
        frozenUsers,
        totalLiabilityUSDT,
        totalPendingWithdrawalsUSDT,
        totalFeesCollectedUSDT,
        reserves,
        solvencyRatio: totalLiabilityUSDT > 0 ? Number((reserves.total / totalLiabilityUSDT).toFixed(4)) : 1.0,
        pendingWithdrawalsCount,
        pendingKycCount,
        totalDepositsCount,
        totalWithdrawalsCount,
        totalLedgerEntriesCount: db.ledgerEntries.length,
      },
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Failed to get admin metrics' });
  }
});

// GET /api/admin/users
router.get('/users', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search } = req.query;
    let usersList = Array.from(db.users.values());

    if (search) {
      const q = (search as string).toLowerCase();
      usersList = usersList.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q)
      );
    }

    // Attach calculated balance for each user
    const usersWithBalances = await Promise.all(
      usersList.map(async (u) => {
        const balance = await ledgerService.getUserBalance(u.id);
        const { passwordHash, salt, twoFactorSecret, ...safeUser } = u;
        return {
          ...safeUser,
          balance,
        };
      })
    );

    res.json({ success: true, users: usersWithBalances });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Failed to fetch users' });
  }
});

// POST /api/admin/users/:id/freeze
router.post('/users/:id/freeze', (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { id } = req.params;
    const { reason } = req.body;

    const targetUser = db.users.get(id);
    if (!targetUser) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    if (targetUser.role === 'super_admin' && admin.id !== targetUser.id) {
      res.status(403).json({ success: false, error: 'Cannot freeze super admin accounts' });
      return;
    }

    const previousState = targetUser.isFrozen;
    targetUser.isFrozen = !targetUser.isFrozen;
    db.users.set(targetUser.id, targetUser);

    securityService.logAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: targetUser.isFrozen ? 'USER_FROZEN' : 'USER_UNFROZEN',
      targetType: 'USER',
      targetId: targetUser.id,
      ipAddress: req.session?.ipAddress || '127.0.0.1',
      userAgent: req.session?.userAgent || '',
      previousValue: `Frozen: ${previousState}`,
      newValue: `Frozen: ${targetUser.isFrozen} (Reason: ${reason || 'Administrative action'})`,
    });

    res.json({
      success: true,
      message: `User account has been ${targetUser.isFrozen ? 'frozen' : 'unfrozen'}.`,
      isFrozen: targetUser.isFrozen,
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Failed to update user freeze status' });
  }
});

// GET /api/admin/withdrawals
router.get('/withdrawals', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.query;
    let list = Array.from(db.withdrawals.values());

    if (status && status !== 'ALL') {
      list = list.filter((w) => w.status === status);
    }

    list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

    // Enrich with user email
    const enriched = list.map((w) => {
      const user = db.users.get(w.userId);
      return {
        ...w,
        userEmail: user?.email || 'Unknown',
        userKycTier: user?.kycTier || 0,
      };
    });

    res.json({ success: true, withdrawals: enriched });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Failed to fetch withdrawals' });
  }
});

// POST /api/admin/withdrawals/:id/approve
router.post('/withdrawals/:id/approve', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { id } = req.params;

    const withdrawal = db.withdrawals.get(id);
    if (!withdrawal) {
      res.status(404).json({ success: false, error: 'Withdrawal not found' });
      return;
    }

    if (withdrawal.status !== 'PENDING_REVIEW') {
      res.status(400).json({ success: false, error: `Withdrawal is not pending review (Current status: ${withdrawal.status})` });
      return;
    }

    withdrawal.status = 'APPROVED';
    withdrawal.approvedBy = admin.email;
    db.withdrawals.set(withdrawal.id, withdrawal);

    // Broadcast to blockchain
    const broadcastResult = await blockchainService.broadcastWithdrawal(withdrawal.id);

    securityService.logAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: 'WITHDRAWAL_APPROVED_BROADCAST',
      targetType: 'WITHDRAWAL',
      targetId: withdrawal.id,
      ipAddress: req.session?.ipAddress || '127.0.0.1',
      userAgent: req.session?.userAgent || '',
      newValue: `Approved & Broadcasted ${withdrawal.netAmount} USDT (${withdrawal.network}) - Tx: ${broadcastResult.txHash}`,
    });

    res.json({
      success: true,
      message: 'Withdrawal approved and broadcasted on-chain.',
      withdrawal: db.withdrawals.get(withdrawal.id),
      txHash: broadcastResult.txHash,
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Failed to approve withdrawal' });
  }
});

// POST /api/admin/withdrawals/:id/reject
router.post('/withdrawals/:id/reject', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { id } = req.params;
    const { reason } = req.body;

    const withdrawal = db.withdrawals.get(id);
    if (!withdrawal) {
      res.status(404).json({ success: false, error: 'Withdrawal not found' });
      return;
    }

    if (withdrawal.status !== 'PENDING_REVIEW' && withdrawal.status !== 'APPROVED') {
      res.status(400).json({ success: false, error: `Cannot reject withdrawal in status: ${withdrawal.status}` });
      return;
    }

    const rejectionReason = reason || 'Declined during risk & AML review';
    withdrawal.status = 'REJECTED';
    withdrawal.rejectionReason = rejectionReason;
    withdrawal.completedAt = new Date().toISOString();
    db.withdrawals.set(withdrawal.id, withdrawal);

    // Refund locked funds back to user ledger available balance
    await ledgerService.refundWithdrawalHold(
      withdrawal.userId,
      withdrawal.id,
      withdrawal.amount,
      rejectionReason
    );

    // Audit log
    securityService.logAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: 'WITHDRAWAL_REJECTED',
      targetType: 'WITHDRAWAL',
      targetId: withdrawal.id,
      ipAddress: req.session?.ipAddress || '127.0.0.1',
      userAgent: req.session?.userAgent || '',
      newValue: `Rejected ${withdrawal.amount} USDT hold refunded to user (Reason: ${rejectionReason})`,
    });

    // Notify user
    db.notifications.push({
      id: `notif_${crypto.randomUUID()}`,
      userId: withdrawal.userId,
      type: 'WITHDRAWAL',
      title: 'Withdrawal Request Rejected & Refunded',
      message: `Your withdrawal of ${withdrawal.amount.toFixed(2)} USDT was declined: ${rejectionReason}. Funds have been restored to your available balance.`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Withdrawal rejected and funds refunded to user available balance.',
      withdrawal,
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Failed to reject withdrawal' });
  }
});

// GET /api/admin/deposits
router.get('/deposits', (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = Array.from(db.deposits.values())
      .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
      .map((d) => {
        const user = db.users.get(d.userId);
        return {
          ...d,
          userEmail: user?.email || 'Unknown',
          explorerUrl: `${NETWORKS[d.network]?.explorerTxPrefix}${d.txHash}`,
        };
      });

    res.json({ success: true, deposits: list });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Failed to fetch deposits' });
  }
});

// GET /api/admin/kyc
router.get('/kyc', (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = Array.from(db.kycApplications.values())
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .map((k) => {
        const user = db.users.get(k.userId);
        return {
          ...k,
          userEmail: user?.email || 'Unknown',
          currentTier: user?.kycTier || 0,
        };
      });

    res.json({ success: true, applications: list });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Failed to fetch KYC applications' });
  }
});

// POST /api/admin/kyc/:id/review
router.post('/kyc/:id/review', (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { id } = req.params;
    const { action, reason } = req.body; // 'APPROVE' | 'REJECT' | 'RESUBMIT'

    const app = db.kycApplications.get(id);
    if (!app) {
      res.status(404).json({ success: false, error: 'KYC application not found' });
      return;
    }

    const user = db.users.get(app.userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'Associated user account not found' });
      return;
    }

    const now = new Date().toISOString();
    app.reviewedAt = now;
    app.reviewedBy = admin.email;

    if (action === 'APPROVE') {
      app.status = 'APPROVED';
      user.kycStatus = 'approved';
      user.kycTier = app.tier;
    } else if (action === 'REJECT') {
      app.status = 'REJECTED';
      app.rejectionReason = reason || 'Documents did not meet compliance requirements';
      user.kycStatus = 'rejected';
    } else if (action === 'RESUBMIT') {
      app.status = 'RESUBMIT';
      app.rejectionReason = reason || 'Please provide clearer document photo';
      user.kycStatus = 'resubmit';
    } else {
      res.status(400).json({ success: false, error: 'Invalid review action.' });
      return;
    }

    db.kycApplications.set(app.id, app);
    db.users.set(user.id, user);

    securityService.logAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: `KYC_${action}`,
      targetType: 'KYC_APPLICATION',
      targetId: app.id,
      ipAddress: req.session?.ipAddress || '127.0.0.1',
      userAgent: req.session?.userAgent || '',
      newValue: `Action: ${action}, Tier: ${user.kycTier}, Status: ${user.kycStatus}`,
    });

    db.notifications.push({
      id: `notif_${crypto.randomUUID()}`,
      userId: user.id,
      type: 'KYC',
      title: `Identity Verification ${action === 'APPROVE' ? 'Approved' : action === 'RESUBMIT' ? 'Requires Attention' : 'Declined'}`,
      message:
        action === 'APPROVE'
          ? `Congratulations! Your identity has been verified at Tier ${app.tier}. Daily limits upgraded.`
          : `KYC Review: ${app.rejectionReason}`,
      read: false,
      createdAt: now,
    });

    res.json({ success: true, application: app, userKycTier: user.kycTier, userKycStatus: user.kycStatus });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Failed to review KYC' });
  }
});

// GET /api/admin/ledger
router.get('/ledger', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, type, limit = 100 } = req.query;
    let list = [...db.ledgerEntries];

    if (userId) {
      list = list.filter((e) => e.userId === userId);
    }
    if (type && type !== 'ALL') {
      list = list.filter((e) => e.referenceType === type);
    }

    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const limitNum = parseInt(limit as string, 10) || 100;
    const paginated = list.slice(0, limitNum);

    res.json({ success: true, total: list.length, entries: paginated });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Failed to fetch ledger' });
  }
});

// POST /api/admin/adjust-balance (Strict double-entry adjustment with mandatory audit reason)
router.post('/adjust-balance', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { userId, type, amount, reason } = req.body;

    if (!userId || !type || !amount || !reason || reason.trim().length < 5) {
      res.status(400).json({
        success: false,
        error: 'User ID, adjustment type (CREDIT/DEBIT), valid amount, and mandatory detailed reason (min 5 chars) are required.',
      });
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ success: false, error: 'Amount must be positive number' });
      return;
    }

    const targetUser = db.users.get(userId);
    if (!targetUser) {
      res.status(404).json({ success: false, error: 'Target user account not found' });
      return;
    }

    const adjResult = await ledgerService.postAdminAdjustment(
      userId,
      type === 'CREDIT' ? 'CREDIT' : 'DEBIT',
      numAmount,
      admin.email,
      reason.trim()
    );

    securityService.logAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: `MANUAL_BALANCE_ADJUSTMENT_${type}`,
      targetType: 'USER',
      targetId: userId,
      ipAddress: req.session?.ipAddress || '127.0.0.1',
      userAgent: req.session?.userAgent || '',
      newValue: `${type} ${numAmount} USDT (Reason: ${reason}) - GroupId: ${adjResult.entryGroupId}`,
    });

    const updatedBalance = await ledgerService.getUserBalance(userId);

    res.json({
      success: true,
      message: `Successfully executed manual ${type} adjustment of ${numAmount} USDT.`,
      balance: updatedBalance,
    });
  } catch (err: unknown) {
    res.status(400).json({ success: false, error: err instanceof Error ? err.message : 'Balance adjustment failed' });
  }
});

// GET /api/admin/reconciliation
router.get('/reconciliation', (req: AuthenticatedRequest, res: Response) => {
  try {
    res.json({
      success: true,
      history: db.reconciliationLogs,
      latest: db.reconciliationLogs[0] || null,
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Failed to fetch reconciliation' });
  }
});

// POST /api/admin/reconciliation/run
router.post('/reconciliation/run', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const summary = await reconciliationService.runReconciliation();
    res.json({
      success: true,
      summary,
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Reconciliation run failed' });
  }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { limit = 100 } = req.query;
    const limitNum = parseInt(limit as string, 10) || 100;
    res.json({
      success: true,
      logs: db.auditLogs.slice(0, limitNum),
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Failed to fetch audit logs' });
  }
});

export default router;
