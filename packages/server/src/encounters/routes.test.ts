import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

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
  }
}));

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

// Mock authentication middleware
vi.mock('../auth/middleware', () => ({
  requireAuth: vi.fn((req: any, res: any, next: any) => {
    req.user = {
      id: '674f1234567890abcdef5678',
      email: 'test@example.com',
      username: 'testuser',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    next();
  }),
}));

// Mock rate limiting
vi.mock('../middleware/rate-limiting', () => ({
  createTierBasedRateLimit: vi.fn(() => (req: any, res: any, next: any) => next()),
}));

import { encounterRoutes } from './routes';

describe('Encounter Routes', () => {
  let app: express.Application;

  const mockEncounter = {
    id: '674f1234567890abcdef1234',
    userId: '674f1234567890abcdef5678',
    name: 'Dragon Fight',
    description: 'An epic battle with a red dragon',
    status: 'PLANNING',
    round: 1,
    turn: 0,
    isActive: false,
    participants: [],
    lairActions: null,
    combatLogs: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/encounters', encounterRoutes);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /api/encounters', () => {
    it('should create a new encounter with valid data', async () => {
      encounterServiceMock.createEncounter.mockResolvedValue(mockEncounter);

      const response = await request(app)
        .post('/api/encounters')
        .send({
          name: 'Dragon Fight',
          description: 'An epic battle with a red dragon'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.encounter).toEqual(mockEncounter);
      expect(encounterServiceMock.createEncounter).toHaveBeenCalledWith(
        '674f1234567890abcdef5678',
        'Dragon Fight',
        'An epic battle with a red dragon'
      );
    });

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/api/encounters')
        .send({ description: 'A battle' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 400 for name too long', async () => {
      const response = await request(app)
        .post('/api/encounters')
        .send({ name: 'a'.repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 400 for description too long', async () => {
      const response = await request(app)
        .post('/api/encounters')
        .send({
          name: 'Test',
          description: 'a'.repeat(1001)
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('GET /api/encounters', () => {
    it('should return all encounters for authenticated user', async () => {
      const encounters = [mockEncounter];
      encounterServiceMock.getUserEncounters.mockResolvedValue(encounters);

      const response = await request(app)
        .get('/api/encounters');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.encounters).toEqual(encounters);
      expect(encounterServiceMock.getUserEncounters).toHaveBeenCalledWith('674f1234567890abcdef5678');
    });

    it('should return empty array when user has no encounters', async () => {
      encounterServiceMock.getUserEncounters.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/encounters');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.encounters).toEqual([]);
    });
  });

  describe('GET /api/encounters/:id', () => {
    it('should return specific encounter for owner', async () => {
      encounterServiceMock.getEncounterById.mockResolvedValue(mockEncounter);

      const response = await request(app)
        .get('/api/encounters/674f1234567890abcdef1234');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.encounter).toEqual(mockEncounter);
      expect(encounterServiceMock.getEncounterById).toHaveBeenCalledWith('674f1234567890abcdef1234');
    });

    it('should return 404 for non-existent encounter', async () => {
      encounterServiceMock.getEncounterById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/encounters/674f1234567890abcdef9999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Encounter not found');
    });

    it('should return 403 for encounter owned by different user', async () => {
      const otherUserEncounter = { ...mockEncounter, userId: 'other_user_id' };
      encounterServiceMock.getEncounterById.mockResolvedValue(otherUserEncounter);

      const response = await request(app)
        .get('/api/encounters/674f1234567890abcdef1234');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Not authorized to access this encounter');
    });

    it('should return 400 for invalid encounter ID format', async () => {
      const response = await request(app)
        .get('/api/encounters/invalid_id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('PUT /api/encounters/:id', () => {
    it('should update encounter with valid data', async () => {
      const updatedEncounter = { ...mockEncounter, name: 'Updated Fight' };
      encounterServiceMock.updateEncounter.mockResolvedValue(updatedEncounter);

      const response = await request(app)
        .put('/api/encounters/674f1234567890abcdef1234')
        .send({ name: 'Updated Fight' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.encounter).toEqual(updatedEncounter);
      expect(encounterServiceMock.updateEncounter).toHaveBeenCalledWith(
        '674f1234567890abcdef1234',
        '674f1234567890abcdef5678',
        { name: 'Updated Fight' }
      );
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .put('/api/encounters/674f1234567890abcdef1234')
        .send({ status: 'INVALID_STATUS' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 400 for name too long', async () => {
      const response = await request(app)
        .put('/api/encounters/674f1234567890abcdef1234')
        .send({ name: 'a'.repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('DELETE /api/encounters/:id', () => {
    it('should delete encounter successfully', async () => {
      encounterServiceMock.deleteEncounter.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/encounters/674f1234567890abcdef1234');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Encounter deleted successfully');
      expect(encounterServiceMock.deleteEncounter).toHaveBeenCalledWith(
        '674f1234567890abcdef1234',
        '674f1234567890abcdef5678'
      );
    });

    it('should return 400 for invalid encounter ID format', async () => {
      const response = await request(app)
        .delete('/api/encounters/invalid_id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/encounters/:id/participants', () => {
    it('should add participant successfully', async () => {
      const updatedEncounter = {
        ...mockEncounter,
        participants: [{
          id: 'participant_123',
          type: 'CHARACTER',
          name: 'Aragorn',
          initiative: 15,
          currentHp: 30,
          maxHp: 30,
          ac: 18
        }]
      };
      encounterServiceMock.addParticipant.mockResolvedValue(updatedEncounter);

      const response = await request(app)
        .post('/api/encounters/674f1234567890abcdef1234/participants')
        .send({
          type: 'CHARACTER',
          name: 'Aragorn',
          initiative: 15,
          currentHp: 30,
          maxHp: 30,
          ac: 18
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.encounter).toEqual(updatedEncounter);
      expect(encounterServiceMock.addParticipant).toHaveBeenCalled();
    });

    it('should return 400 for invalid participant type', async () => {
      const response = await request(app)
        .post('/api/encounters/674f1234567890abcdef1234/participants')
        .send({
          type: 'INVALID_TYPE',
          name: 'Test',
          initiative: 10,
          currentHp: 20,
          maxHp: 20,
          ac: 15
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 400 for negative HP values', async () => {
      const response = await request(app)
        .post('/api/encounters/674f1234567890abcdef1234/participants')
        .send({
          type: 'CHARACTER',
          name: 'Test',
          initiative: 10,
          currentHp: -5,
          maxHp: 20,
          ac: 15
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/encounters/:id/start', () => {
    it('should start combat successfully', async () => {
      const activeEncounter = { ...mockEncounter, status: 'ACTIVE', isActive: true };
      encounterServiceMock.startCombat.mockResolvedValue(activeEncounter);

      const response = await request(app)
        .post('/api/encounters/674f1234567890abcdef1234/start');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.encounter).toEqual(activeEncounter);
      expect(encounterServiceMock.startCombat).toHaveBeenCalledWith(
        '674f1234567890abcdef1234',
        '674f1234567890abcdef5678'
      );
    });

    it('should return 400 for invalid encounter ID', async () => {
      const response = await request(app)
        .post('/api/encounters/invalid_id/start');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/encounters/:id/end', () => {
    it('should end combat successfully', async () => {
      const completedEncounter = { ...mockEncounter, status: 'COMPLETED', isActive: false };
      encounterServiceMock.endCombat.mockResolvedValue(completedEncounter);

      const response = await request(app)
        .post('/api/encounters/674f1234567890abcdef1234/end');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.encounter).toEqual(completedEncounter);
      expect(encounterServiceMock.endCombat).toHaveBeenCalledWith(
        '674f1234567890abcdef1234',
        '674f1234567890abcdef5678'
      );
    });

    it('should return 400 for invalid encounter ID', async () => {
      const response = await request(app)
        .post('/api/encounters/invalid_id/end');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });
});