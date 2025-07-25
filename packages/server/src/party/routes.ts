import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PartyService } from '../services/PartyService';
import { requireAuth } from '../auth/middleware';
import { validationSets } from '../utils/validationHelpers';
import { 
  handleValidationErrors, 
  sendSuccessResponse, 
  sendNotFoundResponse, 
  asyncHandler 
} from '../utils/routeHelpers';
import { RouteValidators } from '../utils/routeValidators';

const router = Router();
const prisma = new PrismaClient();
const partyService = new PartyService(prisma);

// Apply authentication to all routes
router.use(requireAuth);

/**
 * POST /api/parties
 * Create a new party
 */
router.post(
  '/',
  validationSets.createParty,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (handleValidationErrors(req, res)) return;

    const { name, description } = req.body;
    const userId = req.user!.id;

    const party = await partyService.create(userId, { name, description });
    sendSuccessResponse(res, party, 'Party created successfully', 201);
  })
);

/**
 * GET /api/parties
 * Get all parties for the authenticated user
 */
router.get('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const includeArchived = req.query.includeArchived === 'true';

  const parties = await partyService.findByUserId(userId, includeArchived);
  sendSuccessResponse(res, parties, 'Parties retrieved successfully');
}));

/**
 * GET /api/parties/:id
 * Get a specific party by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validation = RouteValidators.validateParamAndUser(req, res, 'id', 'Party');
  if (!validation) return;

  const { id, userId } = validation;
  const party = await partyService.findById(id, userId);
  if (!party) {
    sendNotFoundResponse(res, 'Party not found');
    return;
  }

  sendSuccessResponse(res, party, 'Party retrieved successfully');
}));

/**
 * PUT /api/parties/:id
 * Update a party
 */
router.put(
  '/:id',
  validationSets.updateParty,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (handleValidationErrors(req, res)) return;
    
    const validation = RouteValidators.validateParamAndUser(req, res, 'id', 'Party');
    if (!validation) return;

    const { id, userId } = validation;
    const updateData = req.body;

    const party = await partyService.update(id, userId, updateData);
    if (!party) {
      sendNotFoundResponse(res, 'Party not found');
      return;
    }

    sendSuccessResponse(res, party, 'Party updated successfully');
  })
);

/**
 * DELETE /api/parties/:id
 * Delete (archive) a party
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validation = RouteValidators.validateParamAndUser(req, res, 'id', 'Party');
  if (!validation) return;

  const { id, userId } = validation;
  const deleted = await partyService.delete(id, userId);
  if (!deleted) {
    sendNotFoundResponse(res, 'Party not found');
    return;
  }

  sendSuccessResponse(res, null, 'Party deleted successfully');
}));

export { router as partyRoutes };