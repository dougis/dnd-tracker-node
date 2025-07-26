import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '@dnd-tracker/shared/constants';
import { prisma } from '../lib/prisma.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    tier: string;
  };
}

export const sessionMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Skip auth for public routes
  const publicRoutes = ['/api/auth/login', '/api/auth/register', '/health'];
  if (publicRoutes.includes(req.path)) {
    return next();
  }

  const sessionToken = req.cookies?.session;
  
  if (!sessionToken) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: 'Unauthorized',
      message: 'Session token required',
      statusCode: HTTP_STATUS.UNAUTHORIZED
    });
    return;
  }

  try {
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date()) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired session',
        statusCode: HTTP_STATUS.UNAUTHORIZED
      });
      return;
    }

    req.user = {
      id: session.user.id,
      email: session.user.email,
      username: session.user.username,
      tier: session.user.tier
    };

    next();
  } catch (error) {
    console.error('Session validation error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Session validation failed',
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR
    });
  }
};