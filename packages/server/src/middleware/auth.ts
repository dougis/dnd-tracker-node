import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/auth.js';

let authService: AuthService;

// Initialize auth service (can be overridden for testing)
function getAuthService(): AuthService {
  if (!authService) {
    const prisma = new PrismaClient();
    authService = new AuthService(prisma);
  }
  return authService;
}

// Function to set auth service (for testing)
export function setAuthService(service: AuthService): void {
  authService = service;
}

function extractToken(req: Request): string | null {
  // Check Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Check session cookie
  const sessionCookie = req.cookies.session;
  if (sessionCookie) {
    return sessionCookie;
  }

  return null;
}

function setCookieIfFresh(res: Response, session: any): void {
  if (session?.fresh) {
    res.cookie('session', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractToken(req);
    
    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { session, user } = await getAuthService().validateSession(token);

    if (!session || !user) {
      // Clear invalid session cookie
      if (req.cookies.session) {
        res.clearCookie('session');
      }
      res.status(401).json({ error: 'Invalid or expired session' });
      return;
    }

    // Set fresh session cookie if needed
    setCookieIfFresh(res, session);

    // Attach user and session to request
    req.user = user;
    req.session = session;

    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractToken(req);
    
    if (!token) {
      next();
      return;
    }

    const { session, user } = await getAuthService().validateSession(token);

    if (session && user) {
      // Set fresh session cookie if needed
      setCookieIfFresh(res, session);

      // Attach user and session to request
      req.user = user;
      req.session = session;
    } else if (req.cookies.session) {
      // Clear invalid session cookie
      res.clearCookie('session');
    }

    next();
  } catch (error) {
    // Continue without authentication on error
    next();
  }
}