import { Router } from 'express';

const router = Router();

// Placeholder routes - will be implemented with actual controllers
router.get('/', (_req, res) => {
  res.success({ status: 'placeholder' }, 'Get characters endpoint - to be implemented');
});

router.post('/', (_req, res) => {
  res.success({ status: 'placeholder' }, 'Create character endpoint - to be implemented');
});

router.get('/:id', (_req, res) => {
  res.success({ status: 'placeholder' }, 'Get character by ID endpoint - to be implemented');
});

router.put('/:id', (_req, res) => {
  res.success({ status: 'placeholder' }, 'Update character endpoint - to be implemented');
});

router.delete('/:id', (_req, res) => {
  res.success({ status: 'placeholder' }, 'Delete character endpoint - to be implemented');
});

export default router;