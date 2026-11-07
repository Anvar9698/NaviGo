import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@yol/shared';
import { CONFIG } from '../config';
import { dbStore, UserEntity } from '../db/store';

export interface AuthenticatedRequest extends Request {
  user?: UserEntity;
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, CONFIG.jwtSecret) as { 
      userId: string; 
      role?: UserRole; 
      email?: string; 
      name?: string 
    };
    let user = dbStore.getUserById(payload.userId);
    if (!user && payload.userId) {
      // Re-hydrate session from cryptographically valid JWT signature across restarts
      user = {
        id: payload.userId,
        email: payload.email || 'citizen@yol.uz',
        name: payload.name || 'Fuqaro (Citizen)',
        role: payload.role || 'USER',
        twoFactorEnabled: false,
        createdAt: new Date().toISOString(),
        passwordHash: ''
      };
      (dbStore as any).users.set(user.id, user);
    }
    if (user) {
      req.user = user;
    }
  } catch (err) {
    // Invalid token, treat as anonymous
  }
  next();
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'You must be logged in to perform this action.'
    });
  }
  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'You must be logged in.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Your role (${req.user.role}) does not have permission for this resource.`
      });
    }

    next();
  };
}
