import express, { Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { securityService } from '../services/securityService';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { KYCApplication } from '../types';

const router = express.Router();

// GET /api/kyc/status
router.get('/status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const applications = Array.from(db.kycApplications.values())
      .filter((k) => k.userId === user.id)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    res.json({
      success: true,
      kycTier: user.kycTier,
      kycStatus: user.kycStatus,
      latestApplication: applications[0] || null,
      history: applications,
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Failed to fetch KYC status' });
  }
});

// POST /api/kyc/submit
router.post('/submit', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const {
      tier = 2,
      firstName,
      lastName,
      dateOfBirth,
      nationality,
      idType,
      idNumber,
      idFrontUrl,
      idBackUrl,
      proofOfAddressUrl,
      selfieUrl,
    } = req.body;

    if (!firstName || !lastName || !nationality) {
      res.status(400).json({ success: false, error: 'First name, last name, and nationality are required.' });
      return;
    }

    if (tier === 2 && (!idType || !idNumber || !idFrontUrl)) {
      res.status(400).json({ success: false, error: 'Tier 2 KYC requires ID type, document number, and document scan/photo.' });
      return;
    }

    const newApplication: KYCApplication = {
      id: `kyc_${crypto.randomUUID()}`,
      userId: user.id,
      tier: (tier === 1 ? 1 : 2),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth: dateOfBirth || '1995-01-01',
      nationality: nationality.trim(),
      idType: idType || 'national_id',
      idNumber: idNumber ? idNumber.trim() : 'PENDING_TIER1',
      idFrontUrl: idFrontUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&q=80',
      idBackUrl,
      proofOfAddressUrl,
      selfieUrl,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
    };

    db.kycApplications.set(newApplication.id, newApplication);

    user.kycStatus = 'pending';
    user.firstName = firstName.trim();
    user.lastName = lastName.trim();
    db.users.set(user.id, user);

    securityService.logAudit({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: `KYC_SUBMIT_TIER_${newApplication.tier}`,
      targetType: 'KYC_APPLICATION',
      targetId: newApplication.id,
      ipAddress: req.session?.ipAddress || '127.0.0.1',
      userAgent: req.session?.userAgent || '',
      newValue: `Submitted ${newApplication.idType} (${newApplication.idNumber}) for Tier ${newApplication.tier} verification`,
    });

    db.notifications.push({
      id: `notif_${crypto.randomUUID()}`,
      userId: user.id,
      type: 'KYC',
      title: 'Identity Verification Submitted',
      message: `Your Tier ${newApplication.tier} KYC application has been received and queued for compliance review.`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'KYC application submitted successfully.',
      application: newApplication,
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'KYC submission failed' });
  }
});

export default router;
