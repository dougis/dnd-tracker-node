import { Router } from 'express';

const router = Router();

// Placeholder routes - will be implemented with actual controllers
router.get('/', (_req, res) => {
  res.json({ message: 'Get characters endpoint - to be implemented' });
});

router.post('/', (_req, res) => {
  res.json({ message: 'Create character endpoint - to be implemented' });
});

router.get('/:id', (_req, res) => {
  res.json({ message: 'Get character by ID endpoint - to be implemented' });
});

router.put('/:id', (_req, res) => {
  res.json({ message: 'Update character endpoint - to be implemented' });
});

router.delete('/:id', (_req, res) => {
  res.json({ message: 'Delete character endpoint - to be implemented' });
});

export default router;