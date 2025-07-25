import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock services
const mockEncounterService = {
  createEncounter: vi.fn(),
  getUserEncounters: vi.fn(),
  getEncounterById: vi.fn(),
  updateEncounter: vi.fn(),
  deleteEncounter: vi.fn(),
  addParticipant: vi.fn(),
  startCombat: vi.fn(),
  endCombat: vi.fn()
};

// Mock rate limiting middleware
const mockRateLimit = vi.fn((req, res, next) => next());

vi.mock('../services/EncounterService', () => ({
  EncounterService: vi.fn(() => mockEncounterService)
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn()
}));

vi.mock('../middleware/rate-limiting', () => ({
  createTierBasedRateLimit: () => mockRateLimit
}));

vi.mock('../auth/middleware', () => ({
  requireAuth: vi.fn((req, res, next) => {
    req.user = {
      id: 'user123',
      email: 'test@example.com',
      username: 'testuser'
    };
    next();
  })
}));

import { encounterRoutes } from '../routes';

describe('Encounter Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/encounters', encounterRoutes);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /', () => {
    const validEncounterData = {
      name: 'Test Encounter',
      description: 'A test encounter'
    };

    it('should create encounter successfully', async () => {
      const mockEncounter = {
        id: 'encounter123',
        name: 'Test Encounter',
        description: 'A test encounter',
        status: 'PLANNING',
        round: 0,
        turn: 0,
        isActive: false,
        participants: [],
        lairActions: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      };

      mockEncounterService.createEncounter.mockResolvedValue(mockEncounter);

      const response = await request(app)
        .post('/api/encounters')
        .send(validEncounterData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: {
          encounter: {
            id: 'encounter123',
            name: 'Test Encounter',
            description: 'A test encounter',
            status: 'PLANNING',
            round: 0,
            turn: 0,
            isActive: false,
            participants: [],
            lairActions: [],
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          }
        },
        message: 'Encounter created successfully'
      });

      expect(mockEncounterService.createEncounter).toHaveBeenCalledWith(
        'user123',
        'Test Encounter',
        'A test encounter'
      );
    });

    it('should return 400 for validation errors', async () => {
      const response = await request(app)
        .post('/api/encounters')
        .send({ name: '' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: expect.any(Array)
      });
    });

    it('should return 400 for service validation error', async () => {
      mockEncounterService.createEncounter.mockRejectedValue(new Error('Name is required'));

      const response = await request(app)
        .post('/api/encounters')
        .send(validEncounterData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Name is required'
      });
    });

    it('should return 500 for internal server error', async () => {
      mockEncounterService.createEncounter.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/encounters')
        .send(validEncounterData)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Internal server error creating encounter'
      });
    });
  });

  describe('GET /', () => {
    it('should get user encounters successfully', async () => {
      const mockEncounters = [
        {
          id: 'encounter123',
          name: 'Test Encounter',
          description: 'A test encounter',
          status: 'PLANNING',
          round: 0,
          turn: 0,
          isActive: false,
          participants: [],
          lairActions: [],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        }
      ];

      mockEncounterService.getUserEncounters.mockResolvedValue(mockEncounters);

      const response = await request(app)
        .get('/api/encounters')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          encounters: [
            {
              id: 'encounter123',
              name: 'Test Encounter',
              description: 'A test encounter',
              status: 'PLANNING',
              round: 0,
              turn: 0,
              isActive: false,
              participants: [],
              lairActions: [],
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z'
            }
          ]
        }
      });

      expect(mockEncounterService.getUserEncounters).toHaveBeenCalledWith('user123');
    });

    it('should return 500 for internal server error', async () => {
      mockEncounterService.getUserEncounters.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/encounters')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Internal server error fetching encounters'
      });
    });
  });

  describe('GET /:id', () => {
    it('should get encounter by ID successfully', async () => {
      const mockEncounter = {
        id: 'encounter123',
        name: 'Test Encounter',
        description: 'A test encounter',
        status: 'PLANNING',
        round: 0,
        turn: 0,
        isActive: false,
        participants: [],
        lairActions: [],
        userId: 'user123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      };

      mockEncounterService.getEncounterById.mockResolvedValue(mockEncounter);

      const response = await request(app)
        .get('/api/encounters/507f1f77bcf86cd799439011')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          encounter: {
            id: 'encounter123',
            name: 'Test Encounter',
            description: 'A test encounter',
            status: 'PLANNING',
            round: 0,
            turn: 0,
            isActive: false,
            participants: [],
            lairActions: [],
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          }
        }
      });

      expect(mockEncounterService.getEncounterById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should return 400 for invalid encounter ID format', async () => {
      const response = await request(app)
        .get('/api/encounters/invalid-id')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: expect.any(Array)
      });
    });

    it('should return 404 for encounter not found', async () => {
      mockEncounterService.getEncounterById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/encounters/507f1f77bcf86cd799439011')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        message: 'Encounter not found'
      });
    });

    it('should return 403 for unauthorized access', async () => {
      const mockEncounter = {
        id: 'encounter123',
        userId: 'otheruser',
        name: 'Test Encounter'
      };

      mockEncounterService.getEncounterById.mockResolvedValue(mockEncounter);

      const response = await request(app)
        .get('/api/encounters/507f1f77bcf86cd799439011')
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        message: 'Not authorized to access this encounter'
      });
    });

    it('should return 500 for internal server error', async () => {
      mockEncounterService.getEncounterById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/encounters/507f1f77bcf86cd799439011')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Internal server error fetching encounter'
      });
    });
  });

  describe('PUT /:id', () => {
    const updateData = {
      name: 'Updated Encounter',
      description: 'Updated description',
      status: 'ACTIVE'
    };

    it('should update encounter successfully', async () => {
      const mockUpdatedEncounter = {
        id: 'encounter123',
        name: 'Updated Encounter',
        description: 'Updated description',
        status: 'ACTIVE',
        round: 1,
        turn: 0,
        isActive: true,
        participants: [],
        lairActions: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02')
      };

      mockEncounterService.updateEncounter.mockResolvedValue(mockUpdatedEncounter);

      const response = await request(app)
        .put('/api/encounters/507f1f77bcf86cd799439011')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          encounter: {
            id: 'encounter123',
            name: 'Updated Encounter',
            description: 'Updated description',
            status: 'ACTIVE',
            round: 1,
            turn: 0,
            isActive: true,
            participants: [],
            lairActions: [],
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-02T00:00:00.000Z'
          }
        },
        message: 'Encounter updated successfully'
      });

      expect(mockEncounterService.updateEncounter).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'user123',
        updateData
      );
    });

    it('should return 400 for validation errors', async () => {
      const response = await request(app)
        .put('/api/encounters/invalid-id')
        .send(updateData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: expect.any(Array)
      });
    });

    it('should return 404 for encounter not found', async () => {
      mockEncounterService.updateEncounter.mockRejectedValue(new Error('Encounter not found'));

      const response = await request(app)
        .put('/api/encounters/507f1f77bcf86cd799439011')
        .send(updateData)
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        message: 'Encounter not found'
      });
    });

    it('should return 403 for unauthorized access', async () => {
      mockEncounterService.updateEncounter.mockRejectedValue(new Error('Not authorized'));

      const response = await request(app)
        .put('/api/encounters/507f1f77bcf86cd799439011')
        .send(updateData)
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        message: 'Not authorized'
      });
    });

    it('should return 500 for internal server error', async () => {
      mockEncounterService.updateEncounter.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/encounters/507f1f77bcf86cd799439011')
        .send(updateData)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Internal server error updating encounter'
      });
    });
  });

  describe('DELETE /:id', () => {
    it('should delete encounter successfully', async () => {
      mockEncounterService.deleteEncounter.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/encounters/507f1f77bcf86cd799439011')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Encounter deleted successfully'
      });

      expect(mockEncounterService.deleteEncounter).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'user123'
      );
    });

    it('should return 400 for validation errors', async () => {
      const response = await request(app)
        .delete('/api/encounters/invalid-id')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: expect.any(Array)
      });
    });

    it('should return 404 for encounter not found', async () => {
      mockEncounterService.deleteEncounter.mockRejectedValue(new Error('Encounter not found'));

      const response = await request(app)
        .delete('/api/encounters/507f1f77bcf86cd799439011')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        message: 'Encounter not found'
      });
    });

    it('should return 403 for unauthorized access', async () => {
      mockEncounterService.deleteEncounter.mockRejectedValue(new Error('Not authorized'));

      const response = await request(app)
        .delete('/api/encounters/507f1f77bcf86cd799439011')
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        message: 'Not authorized'
      });
    });

    it('should return 500 for internal server error', async () => {
      mockEncounterService.deleteEncounter.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/api/encounters/507f1f77bcf86cd799439011')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Internal server error deleting encounter'
      });
    });
  });

  describe('POST /:id/participants', () => {
    const participantData = {
      type: 'CHARACTER',
      name: 'Test Character',
      initiative: 15,
      currentHp: 20,
      maxHp: 20,
      ac: 15,
      characterId: '507f1f77bcf86cd799439012',
      initiativeRoll: 10,
      tempHp: 0,
      notes: 'Test notes'
    };

    it('should add participant successfully', async () => {
      const mockEncounter = {
        id: 'encounter123',
        name: 'Test Encounter',
        description: 'A test encounter',
        status: 'PLANNING',
        round: 0,
        turn: 0,
        isActive: false,
        participants: [participantData],
        lairActions: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      };

      mockEncounterService.addParticipant.mockResolvedValue(mockEncounter);

      const response = await request(app)
        .post('/api/encounters/507f1f77bcf86cd799439011/participants')
        .send(participantData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: {
          encounter: {
            id: 'encounter123',
            name: 'Test Encounter',
            description: 'A test encounter',
            status: 'PLANNING',
            round: 0,
            turn: 0,
            isActive: false,
            participants: [participantData],
            lairActions: [],
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          }
        },
        message: 'Participant added successfully'
      });

      expect(mockEncounterService.addParticipant).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'user123',
        participantData
      );
    });

    it('should return 400 for validation errors', async () => {
      const response = await request(app)
        .post('/api/encounters/507f1f77bcf86cd799439011/participants')
        .send({ type: 'INVALID' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: expect.any(Array)
      });
    });

    it('should return 404 for encounter not found', async () => {
      mockEncounterService.addParticipant.mockRejectedValue(new Error('Encounter not found'));

      const response = await request(app)
        .post('/api/encounters/507f1f77bcf86cd799439011/participants')
        .send(participantData)
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        message: 'Encounter not found'
      });
    });

    it('should return 500 for internal server error', async () => {
      mockEncounterService.addParticipant.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/encounters/507f1f77bcf86cd799439011/participants')
        .send(participantData)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Internal server error adding participant'
      });
    });
  });

  describe('POST /:id/start', () => {
    it('should start combat successfully', async () => {
      const mockEncounter = {
        id: 'encounter123',
        name: 'Test Encounter',
        description: 'A test encounter',
        status: 'ACTIVE',
        round: 1,
        turn: 0,
        isActive: true,
        participants: [],
        lairActions: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      };

      mockEncounterService.startCombat.mockResolvedValue(mockEncounter);

      const response = await request(app)
        .post('/api/encounters/507f1f77bcf86cd799439011/start')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          encounter: {
            id: 'encounter123',
            name: 'Test Encounter',
            description: 'A test encounter',
            status: 'ACTIVE',
            round: 1,
            turn: 0,
            isActive: true,
            participants: [],
            lairActions: [],
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          }
        },
        message: 'Combat started successfully'
      });

      expect(mockEncounterService.startCombat).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'user123'
      );
    });

    it('should return 400 for no participants error', async () => {
      mockEncounterService.startCombat.mockRejectedValue(new Error('Cannot start combat: no participants'));

      const response = await request(app)
        .post('/api/encounters/507f1f77bcf86cd799439011/start')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Cannot start combat: no participants'
      });
    });

    it('should return 500 for internal server error', async () => {
      mockEncounterService.startCombat.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/encounters/507f1f77bcf86cd799439011/start')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Internal server error starting combat'
      });
    });
  });

  describe('POST /:id/end', () => {
    it('should end combat successfully', async () => {
      const mockEncounter = {
        id: 'encounter123',
        name: 'Test Encounter',
        description: 'A test encounter',
        status: 'COMPLETED',
        round: 5,
        turn: 0,
        isActive: false,
        participants: [],
        lairActions: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      };

      mockEncounterService.endCombat.mockResolvedValue(mockEncounter);

      const response = await request(app)
        .post('/api/encounters/507f1f77bcf86cd799439011/end')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          encounter: {
            id: 'encounter123',
            name: 'Test Encounter',
            description: 'A test encounter',
            status: 'COMPLETED',
            round: 5,
            turn: 0,
            isActive: false,
            participants: [],
            lairActions: [],
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          }
        },
        message: 'Combat ended successfully'
      });

      expect(mockEncounterService.endCombat).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'user123'
      );
    });

    it('should return 500 for internal server error', async () => {
      mockEncounterService.endCombat.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/encounters/507f1f77bcf86cd799439011/end')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Internal server error ending combat'
      });
    });
  });

  describe('GET /:id/stream', () => {
    it('should setup SSE stream successfully', async () => {
      const mockEncounter = {
        id: 'encounter123',
        name: 'Test Encounter',
        description: 'A test encounter',
        status: 'ACTIVE',
        round: 1,
        turn: 0,
        isActive: true,
        participants: [],
        lairActions: [],
        userId: 'user123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      };

      mockEncounterService.getEncounterById.mockResolvedValue(mockEncounter);

      // Note: SSE testing is complex, this is a basic test
      const response = await request(app)
        .get('/api/encounters/507f1f77bcf86cd799439011/stream')
        .expect(200);

      expect(mockEncounterService.getEncounterById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should return 404 for encounter not found', async () => {
      mockEncounterService.getEncounterById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/encounters/507f1f77bcf86cd799439011/stream')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        message: 'Encounter not found'
      });
    });

    it('should return 403 for unauthorized access', async () => {
      const mockEncounter = {
        id: 'encounter123',
        userId: 'otheruser',
        name: 'Test Encounter'
      };

      mockEncounterService.getEncounterById.mockResolvedValue(mockEncounter);

      const response = await request(app)
        .get('/api/encounters/507f1f77bcf86cd799439011/stream')
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        message: 'Not authorized to access this encounter'
      });
    });
  });
});