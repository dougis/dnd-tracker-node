import { Router, Request, Response } from 'express';
import { param, validationResult } from 'express-validator';
import { requireAuth } from '../auth/middleware';
import { encounterService, tierBasedRateLimit, formatSSEData } from './utils';

const router = Router();

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
    res.write(formatSSEData(welcomeData));

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
    res.write(formatSSEData(encounterData));

    // Keep connection alive with heartbeat
    const heartbeatInterval = setInterval(() => {
      const heartbeat = {
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      };
      res.write(formatSSEData(heartbeat));
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

export default router;