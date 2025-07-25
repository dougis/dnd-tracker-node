import { Router, Request, Response } from 'express';
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
import { validationSets } from '../utils/validationHelpers';

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
  validationSets.createCharacter,
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
  validationSets.updateCharacter,
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