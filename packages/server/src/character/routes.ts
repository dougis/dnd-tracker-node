import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { CharacterService } from '../services/CharacterService';
import { requireAuth } from '../auth/middleware';

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
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    try {
      const userId = req.user!.id;
      const characterData = req.body;

      const character = await characterService.create(userId, characterData);

      res.status(201).json({
        success: true,
        data: character,
        message: 'Character created successfully',
      });
    } catch (error) {
      console.error('Error creating character:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create character',
      });
    }
  }
);

/**
 * GET /api/characters/party/:partyId
 * Get all characters in a party
 */
router.get('/party/:partyId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { partyId } = req.params;
    if (!partyId) {
      res.status(400).json({
        success: false,
        message: 'Party ID parameter is required',
      });
      return;
    }

    const userId = req.user!.id;

    const characters = await characterService.findByPartyId(partyId, userId);

    res.status(200).json({
      success: true,
      data: characters,
      message: 'Characters retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching characters:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch characters',
    });
  }
});

/**
 * GET /api/characters/:id
 * Get a specific character by ID
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Character ID parameter is required',
      });
      return;
    }

    const userId = req.user!.id;

    const character = await characterService.findById(id, userId);

    if (!character) {
      res.status(404).json({
        success: false,
        message: 'Character not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: character,
      message: 'Character retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching character:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch character',
    });
  }
});

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
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Character ID parameter is required',
        });
        return;
      }

      const userId = req.user!.id;
      const updateData = req.body;

      const character = await characterService.update(id, userId, updateData);

      if (!character) {
        res.status(404).json({
          success: false,
          message: 'Character not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: character,
        message: 'Character updated successfully',
      });
    } catch (error) {
      console.error('Error updating character:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update character',
      });
    }
  }
);

/**
 * DELETE /api/characters/:id
 * Delete a character
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Character ID parameter is required',
      });
      return;
    }

    const userId = req.user!.id;

    const deleted = await characterService.delete(id, userId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Character not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Character deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting character:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete character',
    });
  }
});

export { router as characterRoutes };