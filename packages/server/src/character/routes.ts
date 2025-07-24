import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { CharacterService } from '../services/CharacterService';
import { requireAuth } from '../auth/middleware';
import { 
  handleValidationErrors, 
  sendSuccessResponse, 
  sendErrorResponse, 
  sendNotFoundResponse,
  asyncHandler
} from '../utils/routeHelpers';

const router = Router();
const prisma = new PrismaClient();
const characterService = new CharacterService(prisma);

// Apply authentication to all routes
router.use(requireAuth);

/**
 * POST /api/characters
 * Create a new character
 */
router.post(
  '/',
  [
    body('partyId')
      .notEmpty()
      .withMessage('Party ID is required')
      .isString()
      .withMessage('Party ID must be a string'),
    body('name')
      .notEmpty()
      .withMessage('Character name is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Character name must be between 1 and 100 characters'),
    body('playerName')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Player name must not exceed 100 characters'),
    body('race')
      .notEmpty()
      .withMessage('Character race is required')
      .isLength({ min: 1, max: 50 })
      .withMessage('Race must be between 1 and 50 characters'),
    body('classes')
      .isArray({ min: 1 })
      .withMessage('Character must have at least one class'),
    body('classes.*.className')
      .notEmpty()
      .withMessage('Class name is required'),
    body('classes.*.level')
      .isInt({ min: 1, max: 20 })
      .withMessage('Class level must be between 1 and 20'),
    body('level')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Character level must be between 1 and 20'),
    body('ac')
      .optional()
      .isInt({ min: 1, max: 30 })
      .withMessage('AC must be between 1 and 30'),
    body('maxHp')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Max HP must be between 1 and 1000'),
    body('currentHp')
      .optional()
      .isInt({ min: 0, max: 1000 })
      .withMessage('Current HP must be between 0 and 1000'),
    body('tempHp')
      .optional()
      .isInt({ min: 0, max: 500 })
      .withMessage('Temporary HP must be between 0 and 500'),
    body('speed')
      .optional()
      .isInt({ min: 0, max: 120 })
      .withMessage('Speed must be between 0 and 120'),
    body('abilities')
      .optional()
      .isObject()
      .withMessage('Abilities must be an object'),
    body('abilities.str')
      .optional()
      .isInt({ min: 1, max: 30 })
      .withMessage('Strength must be between 1 and 30'),
    body('abilities.dex')
      .optional()
      .isInt({ min: 1, max: 30 })
      .withMessage('Dexterity must be between 1 and 30'),
    body('abilities.con')
      .optional()
      .isInt({ min: 1, max: 30 })
      .withMessage('Constitution must be between 1 and 30'),
    body('abilities.int')
      .optional()
      .isInt({ min: 1, max: 30 })
      .withMessage('Intelligence must be between 1 and 30'),
    body('abilities.wis')
      .optional()
      .isInt({ min: 1, max: 30 })
      .withMessage('Wisdom must be between 1 and 30'),
    body('abilities.cha')
      .optional()
      .isInt({ min: 1, max: 30 })
      .withMessage('Charisma must be between 1 and 30'),
    body('proficiencyBonus')
      .optional()
      .isInt({ min: 2, max: 6 })
      .withMessage('Proficiency bonus must be between 2 and 6'),
    body('features')
      .optional()
      .isArray()
      .withMessage('Features must be an array'),
    body('equipment')
      .optional()
      .isArray()
      .withMessage('Equipment must be an array'),
    body('notes')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Notes must not exceed 1000 characters'),
  ],
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (handleValidationErrors(req, res)) return;

    const userId = req.user!.id;
    const characterData = req.body;

    try {
      const character = await characterService.create(userId, characterData);
      sendSuccessResponse(res, character, 'Character created successfully', 201);
    } catch (error) {
      sendErrorResponse(res, error, 'Failed to create character');
    }
  })
);

/**
 * GET /api/characters/party/:partyId
 * Get all characters in a party
 */
router.get('/party/:partyId', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { partyId } = req.params;
  if (!partyId) {
    return sendErrorResponse(res, new Error('Party ID parameter is required'), 'Party ID parameter is required', 400);
  }

  const userId = req.user!.id;

  try {
    const characters = await characterService.findByPartyId(partyId, userId);
    sendSuccessResponse(res, characters, 'Characters retrieved successfully');
  } catch (error) {
    sendErrorResponse(res, error, 'Failed to fetch characters');
  }
}));

/**
 * GET /api/characters/:id
 * Get a specific character by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id) {
    return sendErrorResponse(res, new Error('Character ID parameter is required'), 'Character ID parameter is required', 400);
  }

  const userId = req.user!.id;

  try {
    const character = await characterService.findById(id, userId);

    if (!character) {
      return sendNotFoundResponse(res, 'Character not found');
    }

    sendSuccessResponse(res, character, 'Character retrieved successfully');
  } catch (error) {
    sendErrorResponse(res, error, 'Failed to fetch character');
  }
}));

/**
 * PUT /api/characters/:id
 * Update a character
 */
router.put(
  '/:id',
  [
    body('name')
      .optional()
      .notEmpty()
      .withMessage('Character name cannot be empty')
      .isLength({ min: 1, max: 100 })
      .withMessage('Character name must be between 1 and 100 characters'),
    body('playerName')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Player name must not exceed 100 characters'),
    body('race')
      .optional()
      .notEmpty()
      .withMessage('Character race cannot be empty')
      .isLength({ min: 1, max: 50 })
      .withMessage('Race must be between 1 and 50 characters'),
    body('classes')
      .optional()
      .isArray({ min: 1 })
      .withMessage('Character must have at least one class'),
    body('classes.*.className')
      .optional()
      .notEmpty()
      .withMessage('Class name is required'),
    body('classes.*.level')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Class level must be between 1 and 20'),
    body('level')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Character level must be between 1 and 20'),
    body('ac')
      .optional()
      .isInt({ min: 1, max: 30 })
      .withMessage('AC must be between 1 and 30'),
    body('maxHp')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Max HP must be between 1 and 1000'),
    body('currentHp')
      .optional()
      .isInt({ min: 0, max: 1000 })
      .withMessage('Current HP must be between 0 and 1000'),
    body('tempHp')
      .optional()
      .isInt({ min: 0, max: 500 })
      .withMessage('Temporary HP must be between 0 and 500'),
    body('speed')
      .optional()
      .isInt({ min: 0, max: 120 })
      .withMessage('Speed must be between 0 and 120'),
    body('abilities')
      .optional()
      .isObject()
      .withMessage('Abilities must be an object'),
    body('proficiencyBonus')
      .optional()
      .isInt({ min: 2, max: 6 })
      .withMessage('Proficiency bonus must be between 2 and 6'),
    body('features')
      .optional()
      .isArray()
      .withMessage('Features must be an array'),
    body('equipment')
      .optional()
      .isArray()
      .withMessage('Equipment must be an array'),
    body('notes')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Notes must not exceed 1000 characters'),
  ],
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (handleValidationErrors(req, res)) return;

    const { id } = req.params;
    if (!id) {
      return sendErrorResponse(res, new Error('Character ID parameter is required'), 'Character ID parameter is required', 400);
    }

    const userId = req.user!.id;
    const updateData = req.body;

    try {
      const character = await characterService.update(id, userId, updateData);

      if (!character) {
        return sendNotFoundResponse(res, 'Character not found');
      }

      sendSuccessResponse(res, character, 'Character updated successfully');
    } catch (error) {
      sendErrorResponse(res, error, 'Failed to update character');
    }
  })
);

/**
 * DELETE /api/characters/:id
 * Delete a character
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id) {
    return sendErrorResponse(res, new Error('Character ID parameter is required'), 'Character ID parameter is required', 400);
  }

  const userId = req.user!.id;

  try {
    const deleted = await characterService.delete(id, userId);

    if (!deleted) {
      return sendNotFoundResponse(res, 'Character not found');
    }

    sendSuccessResponse(res, null, 'Character deleted successfully');
  } catch (error) {
    sendErrorResponse(res, error, 'Failed to delete character');
  }
}));

export { router as characterRoutes };