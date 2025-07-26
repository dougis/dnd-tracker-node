import { Router } from 'express';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Placeholder routes - will be implemented with actual controllers
router.post('/login', rateLimiter.login, (_req, res) => {
  res.json({ message: 'Login endpoint - to be implemented' });
});

router.post('/register', rateLimiter.register, (_req, res) => {
  res.json({ message: 'Register endpoint - to be implemented' });
});

router.post('/logout', (_req, res) => {
  res.json({ message: 'Logout endpoint - to be implemented' });
});

router.get('/profile', (_req, res) => {
  res.json({ message: 'Profile endpoint - to be implemented' });
});

export default router;