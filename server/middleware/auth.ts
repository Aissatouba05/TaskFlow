import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { JwtPayload, SafeUser } from '../types.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'taskflow-jwt-super-secret-production-key-2026';
export const JWT_EXPIRES_IN = '24h';

export interface AuthenticatedRequest extends Request {
  user?: SafeUser;
}

export function generateToken(user: SafeUser): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function authenticateJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Token d’authentification manquant dans l’en-tête Authorization (Bearer token requis).',
      code: 'AUTH_TOKEN_MISSING',
    });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Format d’en-tête invalide. Utilisez "Bearer <votre_token>".',
      code: 'AUTH_INVALID_FORMAT',
    });
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const user = db.findUserById(decoded.userId);

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Utilisateur introuvable ou compte révoqué.',
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    req.user = db.toSafeUser(user);
    next();
  } catch (err) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Token JWT invalide ou expiré.',
      code: 'AUTH_TOKEN_EXPIRED_OR_INVALID',
    });
  }
}

export function requireRole(allowedRole: 'ADMIN' | 'USER') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentification requise.',
      });
      return;
    }

    if (allowedRole === 'ADMIN' && req.user.role !== 'ADMIN') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Accès refusé. Privilèges administrateur (ADMIN) requis pour cette opération.',
        code: 'FORBIDDEN_ROLE',
      });
      return;
    }

    next();
  };
}

export function canAccessProject(project: any, user: SafeUser): boolean {
  if (user.role === 'ADMIN') return true;
  if (project.ownerId === user.id) return true;
  return project.members.some((m: any) => m.userId === user.id);
}

export function canModifyProject(project: any, user: SafeUser): boolean {
  if (user.role === 'ADMIN') return true;
  return project.ownerId === user.id;
}
