import { Router, Request, Response } from 'express';
import { body, param } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { EncounterService } from '../services/EncounterService';
import { requireAuth } from '../auth/middleware';
import { createTierBasedRateLimit } from '../middleware/rate-limiting';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();
const prisma = new PrismaClient();
const encounterService = new EncounterService(prisma);

// Create tier-based rate limiter for encounter routes
const tierBasedRateLimit = createTierBasedRateLimit();

/**
 * POST /api/encounters
 * Create a new encounter
 */
router.post('/', tierBasedRateLimit, requireAuth, [
  body('name')
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Encounter name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .trim()
    .withMessage('Description must be 1000 characters or less')
], handleValidationErrors, async (req: Request, res: Response): Promise<void> => {
  try {

    const { name, description } = req.body;
    const userId = req.user!.id;

    const encounter = await encounterService.createEncounter(userId, name, description);

    res.status(201).json({
      success: true,
      data: encounter
    });
  } catch (error) {
    console.error('Error creating encounter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create encounter'
    });
  }
});

/**
 * GET /api/encounters
 * Get all encounters for the authenticated user
 */
router.get('/', tierBasedRateLimit, requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const encounters = await encounterService.getUserEncounters(userId);

    res.json({
      success: true,
      data: encounters
    });
  } catch (error) {
    console.error('Error fetching encounters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch encounters'
    });
  }
});

/**
 * GET /api/encounters/:id
 * Get a specific encounter by ID
 */
router.get('/:id', tierBasedRateLimit, requireAuth, [
  param('id')
    .isMongoId()
    .withMessage('Invalid encounter ID')
], handleValidationErrors, async (req: Request, res: Response): Promise<void> => {
  try {

    const { id } = req.params;
    const userId = req.user!.id;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Encounter ID is required'
      });
      return;
    }

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Encounter ID is required'
      });
      return;
    }

    const encounter = await encounterService.getEncounterById(id);

    if (!encounter) {
      res.status(404).json({
        success: false,
        message: 'Encounter not found'
      });
      return;
    }

    // Verify ownership
    if (encounter.userId !== userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    res.json({
      success: true,
      data: encounter
    });
  } catch (error) {
    console.error('Error fetching encounter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch encounter'
    });
  }
});

/**
 * PUT /api/encounters/:id
 * Update an existing encounter
 */
router.put('/:id', tierBasedRateLimit, requireAuth, [
  param('id')
    .isMongoId()
    .withMessage('Invalid encounter ID'),
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Encounter name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .trim()
    .withMessage('Description must be 1000 characters or less'),
  body('round')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Round must be a positive integer'),
  body('currentTurn')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Current turn must be a non-negative integer')
], handleValidationErrors, async (req: Request, res: Response): Promise<void> => {
  try {

    const { id } = req.params;
    const userId = req.user!.id;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Encounter ID is required'
      });
      return;
    }
    const updates = req.body;

    const encounter = await encounterService.updateEncounter(id, userId, updates);

    if (!encounter) {
      res.status(404).json({
        success: false,
        message: 'Encounter not found'
      });
      return;
    }

    res.json({
      success: true,
      data: encounter
    });
  } catch (error) {
    console.error('Error updating encounter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update encounter'
    });
  }
});

/**
 * DELETE /api/encounters/:id
 * Delete an encounter
 */
router.delete('/:id', tierBasedRateLimit, requireAuth, [
  param('id')
    .isMongoId()
    .withMessage('Invalid encounter ID')
], handleValidationErrors, async (req: Request, res: Response): Promise<void> => {
  try {

    const { id } = req.params;
    const userId = req.user!.id;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Encounter ID is required'
      });
      return;
    }

    await encounterService.deleteEncounter(id, userId);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting encounter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete encounter'
    });
  }
});

export { router as encounterCrudRoutes };