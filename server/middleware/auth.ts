import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { securityService } from '../services/securityService';
import { User, Session } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: User;
  session?: Session;
  token?: string;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized. Authentication token required.' });
    return;
  }

  const token = authHeader.substring(7);
  const session = securityService.getSession(token);
  if (!session) {
    res.status(401).json({ success: false, error: 'Session invalid or expired. Please log in again.' });
    return;
  }

  const user = db.users.get(session.userId);
  if (!user) {
    res.status(401).json({ success: false, error: 'User account not found.' });
    return;
  }

  if (user.isFrozen) {
    res.status(403).json({ success: false, error: 'Your account has been temporarily frozen by security compliance.' });
    return;
  }

  req.user = user;
  req.session = session;
  req.token = token;
  next();
}

export function requireRole(allowedRoles: Array<User['role']>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Access forbidden: Insufficient administrative privileges.' });
      return;
    }

    next();
  };
}
