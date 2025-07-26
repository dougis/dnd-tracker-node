import { Router, Request, Response } from 'express';
import { param } from 'express-validator';
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
 * POST /api/encounters/:id/start
 * Start an encounter (initialize combat)
 */
router.post('/:id/start', tierBasedRateLimit, requireAuth, [
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

    const updatedEncounter = await encounterService.startCombat(id, userId);

    res.json({
      success: true,
      data: updatedEncounter
    });
  } catch (error) {
    console.error('Error starting encounter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start encounter'
    });
  }
});

/**
 * POST /api/encounters/:id/end
 * End an encounter
 */
router.post('/:id/end', tierBasedRateLimit, requireAuth, [
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

    const updatedEncounter = await encounterService.endCombat(id, userId);

    res.json({
      success: true,
      data: updatedEncounter
    });
  } catch (error) {
    console.error('Error ending encounter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end encounter'
    });
  }
});

export { router as lifecycleRoutes };