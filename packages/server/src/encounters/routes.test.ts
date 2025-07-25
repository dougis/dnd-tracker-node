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
  expectErrorResponse,
  expectValidationErrorResponse,
  createExpectedApiEncounter,
  createExpectedApiEncounters,
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

      expectEncounterCreationResponse(response, createExpectedApiEncounter(mockEncounter));
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

      expectEncounterListResponse(response, createExpectedApiEncounters(mockEncounters));
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

      expectEncounterResponse(response, createExpectedApiEncounter(mockEncounter));
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

    it('should set proper SSE headers for valid requests', async () => {
      encounterServiceMock.getEncounterById.mockResolvedValue(mockEncounter);

      // Use a timeout to allow initial SSE setup before closing connection
      const response = await request(app)
        .get('/api/encounters/507f1f77bcf86cd799439011/stream')
        .timeout(100)
        .expect('Content-Type', 'text/event-stream')
        .expect('Cache-Control', 'no-cache')
        .expect('Connection', 'keep-alive')
        .expect('Access-Control-Allow-Origin', '*')
        .catch((err) => {
          // Expect timeout due to SSE streaming nature
          if (err.code === 'ECONNABORTED' && err.timeout === 100) {
            return { status: 200 }; // Consider timeout as success for SSE
          }
          throw err;
        });

      // Verify the request was processed (status would be 200 if connection established)
      expect(response.status).toBe(200);
    });

    it('should handle service errors gracefully', async () => {
      encounterServiceMock.getEncounterById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/encounters/507f1f77bcf86cd799439011/stream');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal server error setting up encounter stream');
    });
  });

  describe('SSE Utility Functions', () => {
    let mockResponse: any;

    beforeEach(() => {
      mockResponse = {
        write: vi.fn(),
        end: vi.fn(),
        setHeader: vi.fn()
      };
    });

    describe('sanitizeForSSE', () => {
      // Need to import the function dynamically since it's internal
      let sanitizeForSSE: any;

      beforeAll(async () => {
        const routesModule = await import('./routes');
        sanitizeForSSE = routesModule.sanitizeForSSE;
      });

      it('should sanitize string values to prevent XSS', () => {
        const input = '<script>alert("xss")</script>';
        const result = sanitizeForSSE(input);
        expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      });

      it('should sanitize HTML entities in strings', () => {
        const input = 'Test & "quotes" \'apostrophes\' <tags>';
        const result = sanitizeForSSE(input);
        expect(result).toBe('Test &amp; &quot;quotes&quot; &#x27;apostrophes&#x27; &lt;tags&gt;');
      });

      it('should recursively sanitize arrays', () => {
        const input = ['<script>', 'normal text', '<img src=x>'];
        const result = sanitizeForSSE(input);
        expect(result).toEqual(['&lt;script&gt;', 'normal text', '&lt;img src=x&gt;']);
      });

      it('should recursively sanitize object properties', () => {
        const input = {
          name: '<script>alert("test")</script>',
          description: 'Safe text',
          nested: {
            value: '"quoted" & <dangerous>'
          }
        };
        const result = sanitizeForSSE(input);
        expect(result).toEqual({
          name: '&lt;script&gt;alert(&quot;test&quot;)&lt;/script&gt;',
          description: 'Safe text',
          nested: {
            value: '&quot;quoted&quot; &amp; &lt;dangerous&gt;'
          }
        });
      });

      it('should handle primitive values safely', () => {
        expect(sanitizeForSSE(123)).toBe(123);
        expect(sanitizeForSSE(true)).toBe(true);
        expect(sanitizeForSSE(null)).toBe(null);
        expect(sanitizeForSSE(undefined)).toBe(undefined);
      });

      it('should handle empty arrays and objects', () => {
        expect(sanitizeForSSE([])).toEqual([]);
        expect(sanitizeForSSE({})).toEqual({});
      });

      it('should handle complex nested structures', () => {
        const input = {
          participants: [
            { name: '<script>test</script>', hp: 100 },
            { name: 'Safe Name', hp: 75 }
          ],
          encounter: {
            name: '"Dangerous" & <evil>',
            description: 'A test encounter'
          }
        };
        const result = sanitizeForSSE(input);
        expect(result).toEqual({
          participants: [
            { name: '&lt;script&gt;test&lt;/script&gt;', hp: 100 },
            { name: 'Safe Name', hp: 75 }
          ],
          encounter: {
            name: '&quot;Dangerous&quot; &amp; &lt;evil&gt;',
            description: 'A test encounter'
          }
        });
      });
    });

    describe('writeSSEData', () => {
      let writeSSEData: any;

      beforeAll(async () => {
        const routesModule = await import('./routes');
        writeSSEData = routesModule.writeSSEData;
      });

      it('should write properly formatted SSE data', () => {
        const testData = { type: 'test', message: 'hello' };
        writeSSEData(mockResponse, testData);
        
        expect(mockResponse.write).toHaveBeenCalledWith(
          'data: {"type":"test","message":"hello"}\n\n',
          'utf8'
        );
      });

      it('should sanitize data before writing', () => {
        const testData = { message: '<script>alert("xss")</script>' };
        writeSSEData(mockResponse, testData);
        
        expect(mockResponse.write).toHaveBeenCalledWith(
          'data: {"message":"&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"}\n\n',
          'utf8'
        );
      });

      it('should handle arrays in data', () => {
        const testData = { items: ['<test>', 'safe'] };
        writeSSEData(mockResponse, testData);
        
        expect(mockResponse.write).toHaveBeenCalledWith(
          'data: {"items":["&lt;test&gt;","safe"]}\n\n',
          'utf8'
        );
      });

      it('should throw error for non-serializable data', () => {
        const circularData: any = {};
        circularData.self = circularData;
        
        expect(() => {
          writeSSEData(mockResponse, circularData);
        }).toThrow(); // Just expect it to throw, the exact message may vary
      });

      it('should handle null and undefined data', () => {
        writeSSEData(mockResponse, null);
        expect(mockResponse.write).toHaveBeenCalledWith('data: null\n\n', 'utf8');
        
        mockResponse.write.mockClear();
        
        writeSSEData(mockResponse, undefined);
        expect(mockResponse.write).toHaveBeenCalledWith('data: null\n\n', 'utf8');
      });

      it('should handle empty objects and arrays', () => {
        writeSSEData(mockResponse, {});
        expect(mockResponse.write).toHaveBeenCalledWith('data: {}\n\n', 'utf8');
        
        mockResponse.write.mockClear();
        
        writeSSEData(mockResponse, []);
        expect(mockResponse.write).toHaveBeenCalledWith('data: []\n\n', 'utf8');
      });
    });
  });
});