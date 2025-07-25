import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { EncounterService } from '../services/EncounterService';
import { requireAuth } from '../auth/middleware';
import { createTierBasedRateLimit } from '../middleware/rate-limiting';

/**
 * Sanitize data for SSE output to prevent XSS
 */
function sanitizeForSSE(data: any): any {
  if (typeof data === 'string') {
    // Basic HTML entity encoding for strings
    return data
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeForSSE);
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeForSSE(value);
    }
    return sanitized;
  }
  
  return data;
}

/**
 * Safe SSE write function that ensures data is properly sanitized
 */
function writeSSEData(res: Response, data: any): void {
  // Double sanitization and JSON validation for security
  const sanitizedData = sanitizeForSSE(data);
  const jsonString = JSON.stringify(sanitizedData);
  
  // Validate JSON was created successfully
  if (jsonString === undefined) {
    throw new Error('Failed to serialize SSE data');
  }
  
  // Write to response with explicit sanitized data
  res.write(`data: ${jsonString}\n\n`);
}

const router = Router();
const prisma = new PrismaClient();
const encounterService = new EncounterService(prisma);

// Create tier-based rate limiter for encounter routes
const tierBasedRateLimit = createTierBasedRateLimit();

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
      message: 'Encounter created successfully'
    });
  } catch (error: any) {
    console.error('Encounter creation error:', error);
    
    if (error.message.includes('required') || error.message.includes('characters')) {
      res.status(400).json({
        success: false,
        message: error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error creating encounter'
    });
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

/**
 * DELETE /api/encounters/:id
 * Delete an encounter
 */
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

/**
 * GET /api/encounters/:id/stream
 * Server-Sent Events endpoint for real-time updates
 */
router.get('/:id/stream', tierBasedRateLimit, requireAuth, [
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

    // Verify encounter exists and user has access
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

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || 'http://localhost:3000',
      'Access-Control-Allow-Credentials': 'true',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    });

    // Send initial connection event
    const welcomeData = {
      type: 'connection',
      message: 'Connected to encounter stream',
      encounterId: id,
      timestamp: new Date().toISOString()
    };
    writeSSEData(res, welcomeData);

    // Send current encounter state
    const encounterData = {
      type: 'encounter_update',
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
      timestamp: new Date().toISOString()
    };
    writeSSEData(res, encounterData);

    // Keep connection alive with heartbeat
    const heartbeatInterval = setInterval(() => {
      const heartbeat = {
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      };
      writeSSEData(res, heartbeat);
    }, 30000); // Send heartbeat every 30 seconds

    // Clean up on client disconnect
    req.on('close', () => {
      console.log(`SSE connection closed for encounter ${id}`);
      clearInterval(heartbeatInterval);
    });

    req.on('end', () => {
      console.log(`SSE connection ended for encounter ${id}`);
      clearInterval(heartbeatInterval);
    });

  } catch (error: any) {
    console.error('SSE stream error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Internal server error setting up encounter stream'
      });
    }
  }
});

export { router as encounterRoutes };