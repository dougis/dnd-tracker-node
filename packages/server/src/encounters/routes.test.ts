import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { 
  createMockEncounter,
  createMockParticipant,
  expectEncounterCreationResponse,
  expectEncounterListResponse,
  expectEncounterResponse,
  expectEncounterUpdateResponse,
  expectDeletionResponse,
  expectErrorResponse,
  expectValidationErrorResponse,
  type MockEncounter,
  type MockParticipant
} from '../test/encounter-test-utils';

// Create mock service instance using vi.hoisted to avoid hoisting issues
const { encounterServiceMock } = vi.hoisted(() => ({
  encounterServiceMock: {
    createEncounter: vi.fn(),
    getEncounterById: vi.fn(),
    getUserEncounters: vi.fn(),
    updateEncounter: vi.fn(),
    deleteEncounter: vi.fn(),
    addParticipant: vi.fn(),
    startCombat: vi.fn(),
    endCombat: vi.fn(),
    updateParticipantHp: vi.fn(),
    calculateInitiativeOrder: vi.fn()
  }
}));

// Mock the EncounterService at module level
vi.mock('../services/EncounterService', () => ({
  EncounterService: class MockEncounterService {
    constructor() {
      return encounterServiceMock;
    }
  }
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn()
}));

// Mock rate limiting middleware
vi.mock('../middleware/rate-limiting', () => ({
  createTierBasedRateLimit: vi.fn(() => (req: any, res: any, next: any) => next()),
}));

// Mock auth middleware
vi.mock('../auth/middleware', () => ({
  requireAuth: vi.fn((req: any, res: any, next: any) => {
    req.user = {
      id: 'user_123',
      email: 'test@example.com',
      username: 'testuser',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    next();
  })
}));

import { encounterRoutes } from './routes';

describe('Encounter Routes', () => {
  let app: express.Application;
  let mockEncounter: MockEncounter;
  let mockParticipant: MockParticipant;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/encounters', encounterRoutes);
    
    // Initialize mock data for each test
    mockEncounter = createMockEncounter({
      id: 'encounter_123',
      userId: 'user_123',
      name: 'Test Encounter',
      description: 'Test description'
    });
    
    mockParticipant = createMockParticipant({
      id: 'participant_123',
      encounterId: 'encounter_123',
      characterId: 'character_123',
      name: 'Test Character'
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /api/encounters', () => {
    const validEncounterData = {
      name: 'Test Encounter',
      description: 'Test description'
    };

    it('should create encounter successfully', async () => {
      encounterServiceMock.createEncounter.mockResolvedValue(mockEncounter);

      const response = await request(app)
        .post('/api/encounters')
        .send(validEncounterData);

      // API response excludes userId and uses ISO string dates
      const expectedApiEncounter = {
        id: mockEncounter.id,
        name: mockEncounter.name,
        description: mockEncounter.description,
        status: mockEncounter.status,
        round: mockEncounter.round,
        turn: mockEncounter.turn,
        isActive: mockEncounter.isActive,
        participants: mockEncounter.participants,
        lairActions: mockEncounter.lairActions,
        createdAt: mockEncounter.createdAt.toISOString(),
        updatedAt: mockEncounter.updatedAt.toISOString()
      };

      expectEncounterCreationResponse(response, expectedApiEncounter);
      expect(encounterServiceMock.createEncounter).toHaveBeenCalledWith(
        'user_123',
        'Test Encounter',
        'Test description'
      );
    });

    it('should create encounter without description', async () => {
      encounterServiceMock.createEncounter.mockResolvedValue(mockEncounter);

      const response = await request(app)
        .post('/api/encounters')
        .send({ name: 'Test Encounter' });

      expect(response.status).toBe(201);
      expect(encounterServiceMock.createEncounter).toHaveBeenCalledWith(
        'user_123',
        'Test Encounter',
        undefined
      );
    });

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/api/encounters')
        .send({ description: 'Test description' });

      expectValidationErrorResponse(response, [
        {
          location: 'body',
          msg: 'Encounter name must be between 1 and 100 characters',
          path: 'name',
          type: 'field'
        }
      ]);
    });

    it('should return 400 for empty name', async () => {
      const response = await request(app)
        .post('/api/encounters')
        .send({ name: '', description: 'Test description' });

      expectValidationErrorResponse(response, [
        {
          location: 'body',
          msg: 'Encounter name must be between 1 and 100 characters',
          path: 'name',
          type: 'field',
          value: ''
        }
      ]);
    });

    it('should return 400 for name too long', async () => {
      const response = await request(app)
        .post('/api/encounters')
        .send({ name: 'a'.repeat(101), description: 'Test description' });

      expectValidationErrorResponse(response, [
        {
          location: 'body',
          msg: 'Encounter name must be between 1 and 100 characters',
          path: 'name',
          type: 'field',
          value: 'a'.repeat(101)
        }
      ]);
    });

    it('should return 400 for description too long', async () => {
      const response = await request(app)
        .post('/api/encounters')
        .send({ name: 'Test', description: 'a'.repeat(1001) });

      expectValidationErrorResponse(response, [
        {
          location: 'body',
          msg: 'Description must be 1000 characters or less',
          path: 'description',
          type: 'field',
          value: 'a'.repeat(1001)
        }
      ]);
    });

    it('should handle service errors', async () => {
      encounterServiceMock.createEncounter.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/encounters')
        .send(validEncounterData);

      expectErrorResponse(response, 500, 'Internal server error creating encounter');
    });

    it('should handle validation errors from service', async () => {
      encounterServiceMock.createEncounter.mockRejectedValue(new Error('Encounter name is required'));

      const response = await request(app)
        .post('/api/encounters')
        .send(validEncounterData);

      expectErrorResponse(response, 400, 'Encounter name is required');
    });
  });

  describe('GET /api/encounters', () => {
    it('should return all user encounters', async () => {
      const mockEncounters = [mockEncounter];
      encounterServiceMock.getUserEncounters.mockResolvedValue(mockEncounters);

      const response = await request(app)
        .get('/api/encounters');

      // API response excludes userId and uses ISO string dates
      const expectedApiEncounters = mockEncounters.map(encounter => ({
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
      }));

      expectEncounterListResponse(response, expectedApiEncounters);
      expect(encounterServiceMock.getUserEncounters).toHaveBeenCalledWith('user_123');
    });

    it('should handle service errors', async () => {
      encounterServiceMock.getUserEncounters.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/encounters');

      expectErrorResponse(response, 500, 'Internal server error fetching encounters');
    });
  });

  describe('GET /api/encounters/:id', () => {
    it('should return specific encounter', async () => {
      encounterServiceMock.getEncounterById.mockResolvedValue(mockEncounter);

      const response = await request(app)
        .get('/api/encounters/507f1f77bcf86cd799439011');

      // API response excludes userId and uses ISO string dates
      const expectedApiEncounter = {
        id: mockEncounter.id,
        name: mockEncounter.name,
        description: mockEncounter.description,
        status: mockEncounter.status,
        round: mockEncounter.round,
        turn: mockEncounter.turn,
        isActive: mockEncounter.isActive,
        participants: mockEncounter.participants,
        lairActions: mockEncounter.lairActions,
        createdAt: mockEncounter.createdAt.toISOString(),
        updatedAt: mockEncounter.updatedAt.toISOString()
      };

      expectEncounterResponse(response, expectedApiEncounter);
      expect(encounterServiceMock.getEncounterById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/encounters/invalid_id');

      expectValidationErrorResponse(response, [
        {
          location: 'params',
          msg: 'Invalid encounter ID format',
          path: 'id',
          type: 'field',
          value: 'invalid_id'
        }
      ]);
    });

    it('should return 404 when encounter not found', async () => {
      encounterServiceMock.getEncounterById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/encounters/507f1f77bcf86cd799439011');

      expectErrorResponse(response, 404, 'Encounter not found');
    });

    it('should return 403 for unauthorized access', async () => {
      const unauthorizedEncounter = { ...mockEncounter, userId: 'other_user' };
      encounterServiceMock.getEncounterById.mockResolvedValue(unauthorizedEncounter);

      const response = await request(app)
        .get('/api/encounters/507f1f77bcf86cd799439011');

      expectErrorResponse(response, 403, 'Not authorized to access this encounter');
    });
  });

  describe('PUT /api/encounters/:id', () => {
    it('should update encounter successfully', async () => {
      const updatedEncounter = { ...mockEncounter, name: 'Updated Name' };
      encounterServiceMock.updateEncounter.mockResolvedValue(updatedEncounter);

      const response = await request(app)
        .put('/api/encounters/507f1f77bcf86cd799439011')
        .send({ name: 'Updated Name', description: 'Updated description' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Encounter updated successfully');

      expect(encounterServiceMock.updateEncounter).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'user_123',
        { name: 'Updated Name', description: 'Updated description', status: undefined }
      );
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .put('/api/encounters/invalid_id')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 when encounter not found', async () => {
      encounterServiceMock.updateEncounter.mockRejectedValue(new Error('Encounter not found'));

      const response = await request(app)
        .put('/api/encounters/507f1f77bcf86cd799439011')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Encounter not found');
    });

    it('should return 403 for unauthorized access', async () => {
      encounterServiceMock.updateEncounter.mockRejectedValue(new Error('Not authorized to modify this encounter'));

      const response = await request(app)
        .put('/api/encounters/507f1f77bcf86cd799439011')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Not authorized to modify this encounter');
    });
  });

  describe('DELETE /api/encounters/:id', () => {
    it('should delete encounter successfully', async () => {
      encounterServiceMock.deleteEncounter.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/encounters/507f1f77bcf86cd799439011');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Encounter deleted successfully'
      });

      expect(encounterServiceMock.deleteEncounter).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'user_123'
      );
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .delete('/api/encounters/invalid_id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 when encounter not found', async () => {
      encounterServiceMock.deleteEncounter.mockRejectedValue(new Error('Encounter not found'));

      const response = await request(app)
        .delete('/api/encounters/507f1f77bcf86cd799439011');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Encounter not found');
    });
  });

  describe('POST /api/encounters/:id/participants', () => {
    const validParticipantData = {
      type: 'CHARACTER',
      characterId: '507f1f77bcf86cd799439012', // Use valid MongoDB ObjectId
      name: 'Test Character',
      initiative: 15,
      currentHp: 25,
      maxHp: 25,
      ac: 16
    };

    it('should add participant successfully', async () => {
      const encounterWithParticipant = {
        ...mockEncounter,
        participants: [mockParticipant]
      };
      encounterServiceMock.addParticipant.mockResolvedValue(encounterWithParticipant);

      const response = await request(app)
        .post('/api/encounters/507f1f77bcf86cd799439011/participants')
        .send(validParticipantData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Participant added successfully');

      expect(encounterServiceMock.addParticipant).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'user_123',
        validParticipantData
      );
    });

    it('should return 400 for invalid participant type', async () => {
      const response = await request(app)
        .post('/api/encounters/507f1f77bcf86cd799439011/participants')
        .send({ ...validParticipantData, type: 'INVALID' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/encounters/507f1f77bcf86cd799439011/participants')
        .send({ type: 'CHARACTER' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid initiative value', async () => {
      const response = await request(app)
        .post('/api/encounters/507f1f77bcf86cd799439011/participants')
        .send({ ...validParticipantData, initiative: -1 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid HP values', async () => {
      const response = await request(app)
        .post('/api/encounters/507f1f77bcf86cd799439011/participants')
        .send({ ...validParticipantData, currentHp: -1 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/encounters/:id/start', () => {
    it('should start combat successfully', async () => {
      const activeEncounter = { ...mockEncounter, status: 'ACTIVE', isActive: true };
      encounterServiceMock.startCombat.mockResolvedValue(activeEncounter);

      const response = await request(app)
        .post('/api/encounters/507f1f77bcf86cd799439011/start');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Combat started successfully');

      expect(encounterServiceMock.startCombat).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'user_123'
      );
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .post('/api/encounters/invalid_id/start');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 when encounter not found', async () => {
      encounterServiceMock.startCombat.mockRejectedValue(new Error('Encounter not found'));

      const response = await request(app)
        .post('/api/encounters/507f1f77bcf86cd799439011/start');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Encounter not found');
    });

    it('should return 400 when no participants', async () => {
      encounterServiceMock.startCombat.mockRejectedValue(new Error('Cannot start combat with no participants'));

      const response = await request(app)
        .post('/api/encounters/507f1f77bcf86cd799439011/start');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cannot start combat with no participants');
    });
  });

  describe('POST /api/encounters/:id/end', () => {
    it('should end combat successfully', async () => {
      const completedEncounter = { ...mockEncounter, status: 'COMPLETED', isActive: false };
      encounterServiceMock.endCombat.mockResolvedValue(completedEncounter);

      const response = await request(app)
        .post('/api/encounters/507f1f77bcf86cd799439011/end');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Combat ended successfully');

      expect(encounterServiceMock.endCombat).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'user_123'
      );
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .post('/api/encounters/invalid_id/end');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 when encounter not found', async () => {
      encounterServiceMock.endCombat.mockRejectedValue(new Error('Encounter not found'));

      const response = await request(app)
        .post('/api/encounters/507f1f77bcf86cd799439011/end');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Encounter not found');
    });
  });

  describe('GET /api/encounters/:id/stream', () => {
    // Note: SSE endpoint testing is complex with supertest due to streaming nature
    // The functionality is verified by the route implementation
    // Focus on critical validation tests only

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/encounters/invalid_id/stream');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 when encounter not found', async () => {
      encounterServiceMock.getEncounterById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/encounters/507f1f77bcf86cd799439011/stream');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Encounter not found');
    });

    it('should return 403 for unauthorized access', async () => {
      const unauthorizedEncounter = { ...mockEncounter, userId: 'other_user' };
      encounterServiceMock.getEncounterById.mockResolvedValue(unauthorizedEncounter);

      const response = await request(app)
        .get('/api/encounters/507f1f77bcf86cd799439011/stream');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Not authorized to access this encounter');
    });
  });
});