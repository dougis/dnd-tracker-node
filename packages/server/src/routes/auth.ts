import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/auth.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
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

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email address'),
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters long and contain only letters, numbers, and underscores')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters long and contain only letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

function handleValidationErrors(req: Request, res: Response): boolean {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true;
  }
  return false;
}

function getClientInfo(req: Request): { ipAddress: string; userAgent: string } {
  const ipAddress = 
    req.ip || 
    req.connection.remoteAddress || 
    req.socket.remoteAddress || 
    (req.connection as { socket?: { remoteAddress?: string } })?.socket?.remoteAddress || 
    '127.0.0.1';

  const userAgent = req.get('User-Agent') || 'Unknown';

  return { ipAddress, userAgent };
}

// POST /auth/register
router.post('/register', registerValidation, async (req: Request, res: Response): Promise<void> => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { email, username, password } = req.body;

    const user = await getAuthService().registerUser(email, username, password);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isEmailVerified: user.isEmailVerified,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('already exists')) {
      res.status(409).json({ error: error.message });
    } else {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// POST /auth/login
router.post('/login', loginValidation, async (req: Request, res: Response): Promise<void> => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { email, password } = req.body;
    const { ipAddress, userAgent } = getClientInfo(req);

    const user = await getAuthService().authenticateUser(email, password);
    const session = await getAuthService().createSession(user.id, ipAddress, userAgent);

    // Set session cookie
    res.cookie('session', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isEmailVerified: user.isEmailVerified,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('Invalid email or password')) {
        res.status(401).json({ error: error.message });
      } else if (error.message.includes('Account is locked')) {
        res.status(423).json({ error: error.message });
      } else {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    } else {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// POST /auth/logout
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.session?.id) {
      await getAuthService().invalidateSession(req.session.id);
    }

    // Clear session cookie
    res.clearCookie('session');

    res.status(200).json({ message: 'Logout successful' });
  } catch (error: unknown) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /auth/me
router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    res.status(200).json({
      user: {
        id: req.user.id,
        email: req.user.email,
        username: req.user.username,
        isEmailVerified: req.user.isEmailVerified,
        isAdmin: req.user.isAdmin,
      },
    });
  } catch (error: unknown) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as authRoutes };