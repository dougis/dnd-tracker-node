import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import { requireAuth } from './middleware';
import { loginRateLimit, registerRateLimit, createTierBasedRateLimit } from '../middleware/rate-limiting';

const router = Router();
const prisma = new PrismaClient();
const authService = new AuthService(prisma);
const userService = new UserService(prisma);

// Create tier-based rate limiter for authenticated routes
const tierBasedRateLimit = createTierBasedRateLimit();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', registerRateLimit, [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
], async (req: Request, res: Response): Promise<void> => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const { email, username, password } = req.body;

    // Register user
    const user = await authService.register(email, username, password);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString()
        }
      },
      message: 'User registered successfully'
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.message.includes('already exists')) {
      res.status(409).json({
        success: false,
        message: error.message
      });
      return;
    }

    if (error.message.includes('security requirements') || 
        error.message.includes('Invalid email') ||
        error.message.includes('Username')) {
      res.status(400).json({
        success: false,
        message: error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', loginRateLimit, [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req: Request, res: Response): Promise<void> => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const { email, password } = req.body;

    // Login user
    const result = await authService.login(email, password);

    // Set session cookie
    res.cookie('session_id', result.session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/'
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username,
          createdAt: result.user.createdAt.toISOString(),
          updatedAt: result.user.updatedAt.toISOString()
        },
        sessionId: result.session.id,
        expiresAt: result.session.expiresAt.toISOString()
      },
      message: 'Login successful'
    });
  } catch (error: any) {
    console.error('Login error:', error);
    
    if (error.message === 'Invalid credentials') {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    if (error.message.includes('locked')) {
      res.status(423).json({
        success: false,
        message: error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = req.cookies?.session_id;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        message: 'No session found'
      });
      return;
    }

    // Delete session
    await authService.logout(sessionId);

    // Clear session cookie
    res.clearCookie('session_id', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout'
    });
  }
});

/**
 * GET /api/auth/session
 * Get current session info
 */
router.get('/session', async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = req.cookies?.session_id;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        message: 'No session found'
      });
      return;
    }

    // Validate session
    const sessionData = await authService.validateSession(sessionId);

    if (!sessionData) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired session'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: sessionData.user.id,
          email: sessionData.user.email,
          username: sessionData.user.username,
          createdAt: sessionData.user.createdAt.toISOString(),
          updatedAt: sessionData.user.updatedAt.toISOString()
        },
        session: {
          id: sessionData.session.id,
          expiresAt: sessionData.session.expiresAt.toISOString(),
          createdAt: sessionData.session.createdAt.toISOString()
        }
      }
    });
  } catch (error: any) {
    console.error('Session validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during session validation'
    });
  }
});

/**
 * GET /api/auth/profile
 * Get current user profile (protected route)
 */
router.get('/profile', tierBasedRateLimit, requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    
    // Get user stats
    const userStats = await userService.getUserStats(userId);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user!.id,
          email: req.user!.email,
          username: req.user!.username,
          createdAt: req.user!.createdAt.toISOString(),
          updatedAt: req.user!.updatedAt.toISOString()
        },
        stats: userStats ? {
          createdAt: userStats.createdAt.toISOString(),
          lastLogin: userStats.lastLogin?.toISOString() || null,
          failedLoginAttempts: userStats.failedLoginAttempts,
          isLocked: userStats.isLocked
        } : null
      }
    });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error fetching profile'
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile (protected route)
 */
router.put('/profile', tierBasedRateLimit, requireAuth, [
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens')
], async (req: Request, res: Response): Promise<void> => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const userId = req.user!.id;
    const { username } = req.body;

    // Update profile
    const updatedUser = await userService.updateProfile(userId, { username });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          createdAt: updatedUser.createdAt.toISOString(),
          updatedAt: updatedUser.updatedAt.toISOString()
        }
      },
      message: 'Profile updated successfully'
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    
    if (error.message.includes('already taken') || error.message.includes('Username')) {
      res.status(400).json({
        success: false,
        message: error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error updating profile'
    });
  }
});

export { router as authRoutes };