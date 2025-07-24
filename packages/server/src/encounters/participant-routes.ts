import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { requireAuth } from '../auth/middleware';
import { encounterService, tierBasedRateLimit } from './utils';

const router = Router();

/**
 * POST /api/encounters/:id/participants
 * Add a participant to an encounter
 */
router.post('/:id/participants', tierBasedRateLimit, requireAuth, [
  param('id')
    .isMongoId()
    .withMessage('Invalid encounter ID format'),
  body('type')
    .isIn(['CHARACTER', 'CREATURE'])
    .withMessage('Type must be CHARACTER or CREATURE'),
  body('name')
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Participant name must be between 1 and 100 characters'),
  body('initiative')
    .isInt({ min: 0, max: 100 })
    .withMessage('Initiative must be between 0 and 100'),
  body('currentHp')
    .isInt({ min: 0 })
    .withMessage('Current HP must be a non-negative integer'),
  body('maxHp')
    .isInt({ min: 1 })
    .withMessage('Max HP must be a positive integer'),
  body('ac')
    .isInt({ min: 0, max: 50 })
    .withMessage('AC must be between 0 and 50'),
  body('characterId')
    .optional()
    .isMongoId()
    .withMessage('Invalid character ID format'),
  body('creatureId')
    .optional()
    .isMongoId()
    .withMessage('Invalid creature ID format'),
  body('initiativeRoll')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Initiative roll must be between 1 and 20'),
  body('tempHp')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Temp HP must be a non-negative integer'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be 500 characters or less')
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

    const { id } = req.params;
    const participantData = req.body;
    const userId = req.user!.id;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Encounter ID is required'
      });
      return;
    }

    const encounter = await encounterService.addParticipant(id, userId, participantData);

    res.status(201).json({
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
      message: 'Participant added successfully'
    });
  } catch (error: any) {
    console.error('Add participant error:', error);
    
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
      message: 'Internal server error adding participant'
    });
  }
});

export default router;