import { Router } from 'express';

const router = Router();

// Placeholder routes - will be implemented with actual controllers
router.get('/', (_req, res) => {
  res.json({ message: 'Get encounters endpoint - to be implemented' });
});

router.post('/', (_req, res) => {
  res.json({ message: 'Create encounter endpoint - to be implemented' });
});

router.get('/:id', (_req, res) => {
  res.json({ message: 'Get encounter by ID endpoint - to be implemented' });
});

router.put('/:id', (_req, res) => {
  res.json({ message: 'Update encounter endpoint - to be implemented' });
});

router.delete('/:id', (_req, res) => {
  res.json({ message: 'Delete encounter endpoint - to be implemented' });
});

router.post('/:id/damage', (_req, res) => {
  res.json({ message: 'Apply damage endpoint - to be implemented' });
});

router.post('/:id/heal', (_req, res) => {
  res.json({ message: 'Apply healing endpoint - to be implemented' });
});

router.post('/:id/next-turn', (_req, res) => {
  res.json({ message: 'Next turn endpoint - to be implemented' });
});

export default router;