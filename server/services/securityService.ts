import crypto from 'crypto';
import * as OTPAuth from 'otpauth';
import { db } from '../db';
import { AuditLog, Session } from '../types';

export class SecurityService {
  private failedAttempts: Map<string, { count: number; lockedUntil: number }> = new Map();

  /**
   * Generates a new RFC 6238 TOTP 2FA secret and setup URI
   */
  public generateTwoFactorSecret(userEmail: string): { secret: string; uri: string; backupCodes: string[] } {
    const totp = new OTPAuth.TOTP({
      issuer: 'USDTVault',
      label: userEmail,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: new OTPAuth.Secret({ size: 20 }),
    });

    const secret = totp.secret.base32;
    const uri = totp.toString();

    // Generate 8 randomized 8-digit backup codes
    const backupCodes: string[] = [];
    for (let i = 0; i < 8; i++) {
      backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }

    return { secret, uri, backupCodes };
  }

  /**
   * Validates a 6-digit TOTP code against a user's secret or backup code
   */
  public verifyTwoFactorCode(secret: string, token: string, backupCodes: string[] = []): { success: boolean; usedBackupCode?: boolean } {
    if (!token) return { success: false };
    const cleanToken = token.replace(/\s+/g, '');

    // 1. Check if token matches standard TOTP
    try {
      const totp = new OTPAuth.TOTP({
        issuer: 'USDTVault',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secret),
      });

      const delta = totp.validate({ token: cleanToken, window: 1 });
      if (delta !== null) {
        return { success: true };
      }
    } catch {
      // Secret parse error or invalid token
    }

    // 2. Check backup codes
    const index = backupCodes.indexOf(cleanToken.toUpperCase());
    if (index !== -1) {
      backupCodes.splice(index, 1); // Consume backup code
      return { success: true, usedBackupCode: true };
    }

    return { success: false };
  }

  /**
   * Rate limiting and brute force protection
   */
  public checkRateLimit(key: string, maxAttempts = 5, lockoutDurationMs = 15 * 60 * 1000): { isLocked: boolean; remainingAttempts: number; retryAfterSeconds?: number } {
    const record = this.failedAttempts.get(key);
    const now = Date.now();

    if (record) {
      if (record.lockedUntil > now) {
        return {
          isLocked: true,
          remainingAttempts: 0,
          retryAfterSeconds: Math.ceil((record.lockedUntil - now) / 1000),
        };
      } else if (record.lockedUntil > 0 && record.lockedUntil <= now) {
        // Lockout expired, reset
        this.failedAttempts.delete(key);
      }
    }

    const currentCount = record ? record.count : 0;
    return {
      isLocked: false,
      remainingAttempts: Math.max(0, maxAttempts - currentCount),
    };
  }

  public recordFailedAttempt(key: string, maxAttempts = 5, lockoutDurationMs = 15 * 60 * 1000) {
    const now = Date.now();
    const record = this.failedAttempts.get(key) || { count: 0, lockedUntil: 0 };
    record.count += 1;
    if (record.count >= maxAttempts) {
      record.lockedUntil = now + lockoutDurationMs;
    }
    this.failedAttempts.set(key, record);
  }

  public clearFailedAttempts(key: string) {
    this.failedAttempts.delete(key);
  }

  /**
   * Session Management
   */
  public createSession(userId: string, reqIp: string, reqUserAgent: string): Session {
    const token = `tok_${crypto.randomBytes(32).toString('hex')}`;
    const isMobile = /mobile|android|iphone|ipad/i.test(reqUserAgent);
    const isTablet = /tablet|ipad/i.test(reqUserAgent);

    const session: Session = {
      id: `sess_${crypto.randomUUID()}`,
      userId,
      token,
      ipAddress: reqIp || '127.0.0.1',
      userAgent: reqUserAgent || 'Unknown Client',
      deviceType: isTablet ? 'Tablet' : isMobile ? 'Mobile' : 'Desktop',
      location: 'Authorized Region',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      isActive: true,
    };

    db.sessions.set(session.token, session);
    return session;
  }

  public getSession(token: string): Session | undefined {
    if (!token) return undefined;
    const session = db.sessions.get(token);
    if (!session || !session.isActive) return undefined;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      session.isActive = false;
      return undefined;
    }
    return session;
  }

  public revokeSession(token: string): boolean {
    const session = db.sessions.get(token);
    if (session) {
      session.isActive = false;
      return true;
    }
    return false;
  }

  public revokeAllUserSessions(userId: string, currentToken?: string): number {
    let count = 0;
    for (const session of db.sessions.values()) {
      if (session.userId === userId && session.isActive && session.token !== currentToken) {
        session.isActive = false;
        count++;
      }
    }
    return count;
  }

  /**
   * Immutable Audit Logger
   */
  public logAudit(entry: {
    actorId: string;
    actorEmail: string;
    actorRole: string;
    action: string;
    targetType: string;
    targetId: string;
    ipAddress: string;
    userAgent: string;
    previousValue?: string;
    newValue?: string;
  }): AuditLog {
    const log: AuditLog = {
      id: `audit_${crypto.randomUUID()}`,
      actorId: entry.actorId,
      actorEmail: entry.actorEmail,
      actorRole: entry.actorRole,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      ipAddress: entry.ipAddress || '127.0.0.1',
      userAgent: entry.userAgent || 'Unknown',
      previousValue: entry.previousValue,
      newValue: entry.newValue,
      timestamp: new Date().toISOString(),
    };

    db.auditLogs.unshift(log);
    // Keep max 2000 logs in memory
    if (db.auditLogs.length > 2000) {
      db.auditLogs.pop();
    }

    return log;
  }
}

export const securityService = new SecurityService();
