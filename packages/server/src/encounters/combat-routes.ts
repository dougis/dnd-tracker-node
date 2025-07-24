import { Router, Request, Response } from 'express';
import { param } from 'express-validator';
import { requireAuth } from '../auth/middleware';
import { encounterService, tierBasedRateLimit, handleValidationErrors, sendEncounterResponse, sendErrorResponse } from './utils';

const router = Router();

/**
 * POST /api/encounters/:id/start
 * Start combat for an encounter
 */
router.post('/:id/start', tierBasedRateLimit, requireAuth, [
  param('id')
    .isMongoId()
    .withMessage('Invalid encounter ID format')
], async (req: Request, res: Response): Promise<void> => {
  try {
    if (!handleValidationErrors(req, res)) return;

    const { id } = req.params;
    const userId = req.user!.id;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Encounter ID is required'
      });
      return;
    }

    const encounter = await encounterService.startCombat(id, userId);

    res.status(200).json({
      success: true,
      data: {
        encounter: {
          id: encounter.id,
          name: encounter.name,
          description: encounter.description,
          status: encounter.status,
          round: encounter.round,
          turn: encounter.turn,
          isActive: encounter.isActive,
          participants: encounter.participants,
          lairActions: encounter.lairActions,
          createdAt: encounter.createdAt.toISOString(),
          updatedAt: encounter.updatedAt.toISOString()
        }
      },
      message: 'Combat started successfully'
    });
  } catch (error: any) {
    console.error('Start combat error:', error);
    
    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        message: error.message
      });
      return;
    }

    if (error.message.includes('Not authorized')) {
      res.status(403).json({
        success: false,
        message: error.message
      });
      return;
    }

    if (error.message.includes('no participants')) {
      res.status(400).json({
        success: false,
        message: error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error starting combat'
    });
  }
});

/**
 * POST /api/encounters/:id/end
 * End combat for an encounter
 */
router.post('/:id/end', tierBasedRateLimit, requireAuth, [
  param('id')
    .isMongoId()
    .withMessage('Invalid encounter ID format')
], async (req: Request, res: Response): Promise<void> => {
  try {
    if (!handleValidationErrors(req, res)) return;

    const { id } = req.params;
    const userId = req.user!.id;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Encounter ID is required'
      });
      return;
    }

    const encounter = await encounterService.endCombat(id, userId);

    res.status(200).json({
      success: true,
      data: {
        encounter: {
          id: encounter.id,
          name: encounter.name,
          description: encounter.description,
          status: encounter.status,
          round: encounter.round,
          turn: encounter.turn,
          isActive: encounter.isActive,
          participants: encounter.participants,
          lairActions: encounter.lairActions,
          createdAt: encounter.createdAt.toISOString(),
          updatedAt: encounter.updatedAt.toISOString()
        }
      },
      message: 'Combat ended successfully'
    });
  } catch (error: any) {
    console.error('End combat error:', error);
    
    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        message: error.message
      });
      return;
    }

    if (error.message.includes('Not authorized')) {
      res.status(403).json({
        success: false,
        message: error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error ending combat'
    });
  }
});

export default router;