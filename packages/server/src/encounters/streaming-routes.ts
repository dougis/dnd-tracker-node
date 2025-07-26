import { Router, Request, Response } from 'express';
import { param } from 'express-validator';
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
 * GET /api/encounters/:id/stream
 * Server-Sent Events stream for encounter updates
 */
router.get('/:id/stream', tierBasedRateLimit, requireAuth, [
  param('id')
    .isMongoId()
    .withMessage('Invalid encounter ID')
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

    // Verify encounter exists
    const encounter = await encounterService.getEncounterById(id);
    if (!encounter) {
      res.status(404).json({
        success: false,
        message: 'Encounter not found'
      });
      return;
    }

    // Verify ownership
    if (encounter.userId !== userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial data
    const welcomeData = {
      type: 'welcome',
      encounterId: id,
      timestamp: new Date().toISOString()
    };
    res.write(`data: ${JSON.stringify(welcomeData)}\n\n`);

    // Send current encounter state
    const encounterData = {
      type: 'encounter_update',
      data: encounter,
      timestamp: new Date().toISOString()
    };
    res.write(`data: ${JSON.stringify(encounterData)}\n\n`);

    // Keep connection alive with periodic heartbeat
    const heartbeat = setInterval(() => {
      res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`);
    }, 30000);

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(heartbeat);
    });

    req.on('aborted', () => {
      clearInterval(heartbeat);
    });

  } catch (error) {
    console.error('Error setting up encounter stream:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set up encounter stream'
    });
  }
});

export { router as streamingRoutes };