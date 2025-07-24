import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/AuthService';

// Extend Express Request interface to include user and session
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
      username: string;
      failedLoginAttempts: number;
      lockedUntil: Date | null;
      createdAt: Date;
      updatedAt: Date;
      tier?: 'free' | 'basic' | 'premium' | 'pro' | 'enterprise';
    };
    session?: {
      id: string;
      userId: string;
      expiresAt: Date;
      createdAt: Date;
      updatedAt: Date;
    };
  }
}

const prisma = new PrismaClient();
const authService = new AuthService(prisma);

/**
 * Middleware to require authentication
 * Returns 401 if no valid session is found
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sessionId = getSessionId(req);
    
    if (!sessionId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const sessionData = await authService.validateSession(sessionId);
    
    if (!sessionData) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired session'
      });
      return;
    }

    // Add user and session to request (with default tier)
    req.user = {
      ...sessionData.user,
      tier: 'free' // Default tier until user tiers are implemented in the database
    };
    req.session = sessionData.session;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

/**
 * Middleware for optional authentication
 * Adds user to request if valid session exists, but doesn't block if not
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sessionId = getSessionId(req);
    
    if (!sessionId) {
      next();
      return;
    }

    const sessionData = await authService.validateSession(sessionId);
    
    if (sessionData) {
      req.user = {
        ...sessionData.user,
        tier: 'free' // Default tier until user tiers are implemented in the database
      };
      req.session = sessionData.session;
    }
    
    next();
  } catch (error) {
    // Log error but don't block request for optional auth
    console.error('Optional authentication error:', error);
    next();
  }
};

/**
 * Get session ID from request (cookie or Authorization header)
 */
function getSessionId(req: Request): string | null {
  // First check cookies
  if (req.cookies?.session_id) {
    return req.cookies.session_id;
  }

  // Then check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Middleware to check if user has specific permissions
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _permission = permission;
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // For now, all authenticated users have all permissions
    // This can be extended later with role-based access control
    next();
  };
};

/**
 * Middleware to ensure user owns the resource
 */
export const requireOwnership = (userIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
    
    if (req.user.id !== resourceUserId) {
      res.status(403).json({
        success: false,
        message: 'Access denied: insufficient permissions'
      });
      return;
    }

    next();
  };
};