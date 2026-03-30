import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export type UserRole = 'landlord' | 'tenant';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: UserRole;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const requireRole = (role: UserRole) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.userRole !== role) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
};

export const generateToken = (userId: string, email: string, role: UserRole): string => {
  return jwt.sign(
    { userId, email, role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
  );
};
