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
 * POST /api/encounters/:id/participants
 * Add a participant to an encounter
 */
router.post('/:id/participants', tierBasedRateLimit, requireAuth, [
  param('id')
    .isMongoId()
    .withMessage('Invalid encounter ID'),
  body('name')
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Participant name must be between 1 and 100 characters'),
  body('initiative')
    .isInt({ min: -10, max: 50 })
    .withMessage('Initiative must be between -10 and 50'),
  body('hitPoints')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Hit points must be between 1 and 1000'),
  body('maxHitPoints')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Max hit points must be between 1 and 1000'),
  body('armorClass')
    .isInt({ min: 1, max: 30 })
    .withMessage('Armor class must be between 1 and 30'),
  body('type')
    .isIn(['pc', 'npc', 'monster'])
    .withMessage('Type must be pc, npc, or monster'),
  body('isVisible')
    .optional()
    .isBoolean()
    .withMessage('isVisible must be a boolean')
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
    const participantData = req.body;

    // Transform the request data to match the service interface
    const participantServiceData = {
      type: participantData.type === 'pc' ? 'CHARACTER' as const : 'CREATURE' as const,
      name: participantData.name,
      initiative: participantData.initiative,
      currentHp: participantData.hitPoints,
      maxHp: participantData.maxHitPoints,
      ac: participantData.armorClass
    };

    const encounter = await encounterService.addParticipant(id, userId, participantServiceData);

    res.status(201).json({
      success: true,
      data: encounter
    });
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add participant'
    });
  }
});

export { router as participantRoutes };