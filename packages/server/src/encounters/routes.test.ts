import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import { EncounterService } from '../services/EncounterService';

// Mock EncounterService
vi.mock('../services/EncounterService');

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
vi.mock('../middleware/rate-limiting', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    createTierBasedRateLimit: vi.fn(() => (req: any, res: any, next: any) => next()),
    loginRateLimit: vi.fn((req: any, res: any, next: any) => next()),
    registerRateLimit: vi.fn((req: any, res: any, next: any) => next()),
  };
});

describe('Encounter Routes', () => {
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

  let mockEncounterService: {
    createEncounter: MockedFunction<any>;
    getEncounterById: MockedFunction<any>;
    getUserEncounters: MockedFunction<any>;
    updateEncounter: MockedFunction<any>;
    deleteEncounter: MockedFunction<any>;
    addParticipant: MockedFunction<any>;
    startCombat: MockedFunction<any>;
    endCombat: MockedFunction<any>;
  };

  beforeEach(() => {
    mockEncounterService = {
      createEncounter: vi.fn(),
      getEncounterById: vi.fn(),
      getUserEncounters: vi.fn(),
      updateEncounter: vi.fn(),
      deleteEncounter: vi.fn(),
      addParticipant: vi.fn(),
      startCombat: vi.fn(),
      endCombat: vi.fn(),
    };
    
    (EncounterService as any).mockImplementation(() => mockEncounterService);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /api/encounters', () => {
    it('should create a new encounter with valid data', async () => {
      mockEncounterService.createEncounter.mockResolvedValue(mockEncounter);

      const response = await request(app)
        .post('/api/encounters')
        .send({
          name: 'Dragon Fight',
          description: 'An epic battle with a red dragon',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.encounter.name).toBe('Dragon Fight');
      expect(response.body.message).toBe('Encounter created successfully');
    });

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/api/encounters')
        .send({
          description: 'A battle without a name',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 400 for name too long', async () => {
      const longName = 'a'.repeat(101);
      const response = await request(app)
        .post('/api/encounters')
        .send({
          name: longName,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 400 for description too long', async () => {
      const longDescription = 'a'.repeat(1001);
      const response = await request(app)
        .post('/api/encounters')
        .send({
          name: 'Test Encounter',
          description: longDescription,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('GET /api/encounters', () => {
    it('should return all encounters for authenticated user', async () => {
      const mockEncounters = [mockEncounter];
      mockEncounterService.getUserEncounters.mockResolvedValue(mockEncounters);

      const response = await request(app)
        .get('/api/encounters');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.encounters).toHaveLength(1);
      expect(response.body.data.encounters[0].name).toBe('Dragon Fight');
    });

    it('should return empty array when user has no encounters', async () => {
      mockEncounterService.getUserEncounters.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/encounters');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.encounters).toHaveLength(0);
    });
  });

  describe('GET /api/encounters/:id', () => {
    it('should return specific encounter for owner', async () => {
      mockEncounterService.getEncounterById.mockResolvedValue(mockEncounter);

      const response = await request(app)
        .get(`/api/encounters/${mockEncounter.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.encounter.name).toBe('Dragon Fight');
    });

    it('should return 404 for non-existent encounter', async () => {
      mockEncounterService.getEncounterById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/encounters/674f1234567890abcdef9999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Encounter not found');
    });

    it('should return 403 for encounter owned by different user', async () => {
      const otherUserEncounter = {
        ...mockEncounter,
        userId: '674f1234567890abcdef9999', // Different user
      };
      mockEncounterService.getEncounterById.mockResolvedValue(otherUserEncounter);

      const response = await request(app)
        .get(`/api/encounters/${mockEncounter.id}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Not authorized to access this encounter');
    });

    it('should return 400 for invalid encounter ID format', async () => {
      const response = await request(app)
        .get('/api/encounters/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('PUT /api/encounters/:id', () => {
    it('should update encounter with valid data', async () => {
      const updatedEncounter = {
        ...mockEncounter,
        name: 'Updated Dragon Fight',
        description: 'An updated epic battle',
      };

      mockEncounterService.updateEncounter.mockResolvedValue(updatedEncounter);

      const response = await request(app)
        .put(`/api/encounters/${mockEncounter.id}`)
        .send({
          name: 'Updated Dragon Fight',
          description: 'An updated epic battle',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.encounter.name).toBe('Updated Dragon Fight');
      expect(response.body.message).toBe('Encounter updated successfully');
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .put(`/api/encounters/${mockEncounter.id}`)
        .send({
          status: 'INVALID_STATUS',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 400 for name too long', async () => {
      const longName = 'a'.repeat(101);
      const response = await request(app)
        .put(`/api/encounters/${mockEncounter.id}`)
        .send({
          name: longName,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('DELETE /api/encounters/:id', () => {
    it('should delete encounter successfully', async () => {
      mockEncounterService.deleteEncounter.mockResolvedValue(undefined);

      const response = await request(app)
        .delete(`/api/encounters/${mockEncounter.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Encounter deleted successfully');
    });

    it('should return 400 for invalid encounter ID format', async () => {
      const response = await request(app)
        .delete('/api/encounters/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/encounters/:id/participants', () => {
    it('should add participant successfully', async () => {
      const encounterWithParticipant = {
        ...mockEncounter,
        participants: [{
          id: '674f1234567890abcdef3456',
          type: 'CHARACTER',
          name: 'Test Character',
          initiative: 15,
          currentHp: 20,
          maxHp: 20,
          ac: 15,
        }],
      };

      mockEncounterService.addParticipant.mockResolvedValue(encounterWithParticipant);

      const response = await request(app)
        .post(`/api/encounters/${mockEncounter.id}/participants`)
        .send({
          type: 'CHARACTER',
          name: 'Test Character',
          initiative: 15,
          currentHp: 20,
          maxHp: 20,
          ac: 15,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Participant added successfully');
    });

    it('should return 400 for invalid participant type', async () => {
      const response = await request(app)
        .post(`/api/encounters/${mockEncounter.id}/participants`)
        .send({
          type: 'INVALID_TYPE',
          name: 'Test Character',
          initiative: 15,
          currentHp: 20,
          maxHp: 20,
          ac: 15,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 400 for negative HP values', async () => {
      const response = await request(app)
        .post(`/api/encounters/${mockEncounter.id}/participants`)
        .send({
          type: 'CHARACTER',
          name: 'Test Character',
          initiative: 15,
          currentHp: -5,
          maxHp: 20,
          ac: 15,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/encounters/:id/start', () => {
    it('should start combat successfully', async () => {
      const activeEncounter = {
        ...mockEncounter,
        status: 'ACTIVE',
        isActive: true,
      };

      mockEncounterService.startCombat.mockResolvedValue(activeEncounter);

      const response = await request(app)
        .post(`/api/encounters/${mockEncounter.id}/start`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.encounter.status).toBe('ACTIVE');
      expect(response.body.message).toBe('Combat started successfully');
    });

    it('should return 400 for invalid encounter ID', async () => {
      const response = await request(app)
        .post('/api/encounters/invalid-id/start');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/encounters/:id/end', () => {
    it('should end combat successfully', async () => {
      const completedEncounter = {
        ...mockEncounter,
        status: 'COMPLETED',
        isActive: false,
      };

      mockEncounterService.endCombat.mockResolvedValue(completedEncounter);

      const response = await request(app)
        .post(`/api/encounters/${mockEncounter.id}/end`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.encounter.status).toBe('COMPLETED');
      expect(response.body.message).toBe('Combat ended successfully');
    });

    it('should return 400 for invalid encounter ID', async () => {
      const response = await request(app)
        .post('/api/encounters/invalid-id/end');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });
});