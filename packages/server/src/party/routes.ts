import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { PartyService } from '../services/PartyService';
import { requireAuth } from '../auth/middleware';

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
  [
    body('name')
      .notEmpty()
      .withMessage('Party name is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Party name must be between 1 and 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters'),
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
      const { name, description } = req.body;
      const userId = req.user!.id;

      const party = await partyService.create(userId, { name, description });

      res.status(201).json({
        success: true,
        data: party,
        message: 'Party created successfully',
      });
    } catch (error) {
      console.error('Error creating party:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create party',
      });
    }
  }
);

/**
 * GET /api/parties
 * Get all parties for the authenticated user
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const includeArchived = req.query.includeArchived === 'true';

    const parties = await partyService.findByUserId(userId, includeArchived);

    res.status(200).json({
      success: true,
      data: parties,
      message: 'Parties retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching parties:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch parties',
    });
  }
});

/**
 * GET /api/parties/:id
 * Get a specific party by ID
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Party ID is required',
      });
      return;
    }
    
    const userId = req.user!.id;
    const party = await partyService.findById(id, userId);

    if (!party) {
      res.status(404).json({
        success: false,
        message: 'Party not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: party,
      message: 'Party retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching party:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch party',
    });
  }
});

/**
 * PUT /api/parties/:id
 * Update a party
 */
router.put(
  '/:id',
  [
    body('name')
      .optional()
      .notEmpty()
      .withMessage('Party name cannot be empty')
      .isLength({ min: 1, max: 100 })
      .withMessage('Party name must be between 1 and 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters'),
    body('isArchived')
      .optional()
      .isBoolean()
      .withMessage('isArchived must be a boolean'),
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
          message: 'Party ID is required',
        });
        return;
      }
      
      const userId = req.user!.id;
      const updateData = req.body;

      const party = await partyService.update(id, userId, updateData);

      if (!party) {
        res.status(404).json({
          success: false,
          message: 'Party not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: party,
        message: 'Party updated successfully',
      });
    } catch (error) {
      console.error('Error updating party:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update party',
      });
    }
  }
);

/**
 * DELETE /api/parties/:id
 * Delete (archive) a party
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Party ID is required',
      });
      return;
    }
    
    const userId = req.user!.id;
    const deleted = await partyService.delete(id, userId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Party not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Party deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting party:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete party',
    });
  }
});

export { router as partyRoutes };