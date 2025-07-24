import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { requireAuth } from '../auth/middleware';
import { encounterService, tierBasedRateLimit, sendEncounterResponse, sendErrorResponse } from './utils';

const router = Router();

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

    const { name, description } = req.body;
    const userId = req.user!.id;

    // Create encounter
    const encounter = await encounterService.createEncounter(userId, name, description);
    sendEncounterResponse(res, encounter, 'Encounter created successfully', 201);
  } catch (error: any) {
    console.error('Encounter creation error:', error);
    
    if (error.message.includes('required') || error.message.includes('characters')) {
      sendErrorResponse(res, error, 400);
      return;
    }

    sendErrorResponse(res, 'Internal server error creating encounter', 500);
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

    res.status(200).json({
      success: true,
      data: {
        encounters: encounters.map(encounter => ({
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
        }))
      }
    });
  } catch (error: any) {
    console.error('Get encounters error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error fetching encounters'
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
    .withMessage('Invalid encounter ID format')
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
    const userId = req.user!.id;

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

    // Check ownership
    if (encounter.userId !== userId) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to access this encounter'
      });
      return;
    }

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
      }
    });
  } catch (error: any) {
    console.error('Get encounter error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error fetching encounter'
    });
  }
});

/**
 * PUT /api/encounters/:id
 * Update an encounter
 */
router.put('/:id', tierBasedRateLimit, requireAuth, [
  param('id')
    .isMongoId()
    .withMessage('Invalid encounter ID format'),
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
  body('status')
    .optional()
    .isIn(['PLANNING', 'ACTIVE', 'PAUSED', 'COMPLETED'])
    .withMessage('Invalid status')
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
    const { name, description, status } = req.body;
    const userId = req.user!.id;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Encounter ID is required'
      });
      return;
    }

    const encounter = await encounterService.updateEncounter(id, userId, {
      name,
      description,
      status
    });

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
      message: 'Encounter updated successfully'
    });
  } catch (error: any) {
    console.error('Update encounter error:', error);
    
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

    if (error.message.includes('required') || error.message.includes('characters')) {
      res.status(400).json({
        success: false,
        message: error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error updating encounter'
    });
  }
});

router.delete('/:id', tierBasedRateLimit, requireAuth, [
  param('id')
    .isMongoId()
    .withMessage('Invalid encounter ID format')
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
    const userId = req.user!.id;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Encounter ID is required'
      });
      return;
    }

    await encounterService.deleteEncounter(id, userId);

    res.status(200).json({
      success: true,
      message: 'Encounter deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete encounter error:', error);
    
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
      message: 'Internal server error deleting encounter'
    });
  }
});

export default router;