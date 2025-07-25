import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CharacterService } from '../services/CharacterService';
import { requireAuth } from '../auth/middleware';
import { 
  handleValidationErrors, 
  sendSuccessResponse, 
  sendNotFoundResponse,
  asyncHandler
} from '../utils/routeHelpers';
import { validationSets } from '../utils/validationHelpers';
import { RouteValidators } from '../utils/routeValidators';

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

    const character = await characterService.create(userId, characterData);
    sendSuccessResponse(res, character, 'Character created successfully', 201);
  })
);

/**
 * GET /api/characters/party/:partyId
 * Get all characters in a party
 */
router.get('/party/:partyId', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validation = RouteValidators.validateParamAndUser(req, res, 'partyId', 'Party');
  if (!validation) return;

  const { id: partyId, userId } = validation;
  const characters = await characterService.findByPartyId(partyId, userId);
  sendSuccessResponse(res, characters, 'Characters retrieved successfully');
}));

/**
 * GET /api/characters/:id
 * Get a specific character by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validation = RouteValidators.validateParamAndUser(req, res, 'id', 'Character');
  if (!validation) return;

  const { id, userId } = validation;
  const character = await characterService.findById(id, userId);
  if (!character) {
    sendNotFoundResponse(res, 'Character not found');
    return;
  }

  sendSuccessResponse(res, character, 'Character retrieved successfully');
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
    
    const validation = RouteValidators.validateParamAndUser(req, res, 'id', 'Character');
    if (!validation) return;

    const { id, userId } = validation;
    const updateData = req.body;

    const character = await characterService.update(id, userId, updateData);
    if (!character) {
      sendNotFoundResponse(res, 'Character not found');
      return;
    }

    sendSuccessResponse(res, character, 'Character updated successfully');
  })
);

/**
 * DELETE /api/characters/:id
 * Delete a character
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validation = RouteValidators.validateParamAndUser(req, res, 'id', 'Character');
  if (!validation) return;

  const { id, userId } = validation;
  const deleted = await characterService.delete(id, userId);
  if (!deleted) {
    sendNotFoundResponse(res, 'Character not found');
    return;
  }

  sendSuccessResponse(res, null, 'Character deleted successfully');
}));

export { router as characterRoutes };