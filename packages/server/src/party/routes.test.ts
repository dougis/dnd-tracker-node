import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { partyRoutes } from './routes';
import { PartyService } from '../services/PartyService';

// Mock the service and middleware
vi.mock('../services/PartyService');
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({}))
}));
vi.mock('../auth/middleware', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.user = { id: 'user123', email: 'test@example.com' };
    next();
  }
}));

describe('Party Routes', () => {
  let app: express.Application;
  let mockPartyService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    app = express();
    app.use(express.json());

    mockPartyService = {
      create: vi.fn(),
      findByUserId: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    
    // Mock the constructor to return our mock instance
    vi.mocked(PartyService).mockImplementation(() => mockPartyService);

    app.use('/api/parties', partyRoutes);
  });

  describe('POST /api/parties', () => {
    it('should create a new party successfully', async () => {
      const newParty = {
        name: 'Test Party',
        description: 'A test adventure party'
      };
      
      const mockCreatedParty = {
        id: 'party123',
        userId: 'user123',
        ...newParty,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPartyService.create.mockResolvedValue(mockCreatedParty);

      const response = await request(app)
        .post('/api/parties')
        .send(newParty);

      console.log('Response status:', response.status);
      console.log('Response body:', JSON.stringify(response.body, null, 2));
      console.log('Service create called:', mockPartyService.create.mock.calls);
      console.log('Service create return:', await mockPartyService.create.mock.results[0]?.value);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockCreatedParty);
      expect(mockPartyService.create).toHaveBeenCalledWith('user123', newParty);
    });

    it('should return 400 for invalid party data', async () => {
      const invalidParty = {
        name: '', // Empty name should fail validation
        description: 'A test party'
      };

      const response = await request(app)
        .post('/api/parties')
        .send(invalidParty);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 400 for missing name', async () => {
      const invalidParty = {
        description: 'A test party'
        // Missing name
      };

      const response = await request(app)
        .post('/api/parties')
        .send(invalidParty);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/parties', () => {
    it('should return all parties for authenticated user', async () => {
      const mockParties = [
        {
          id: 'party1',
          userId: 'user123',
          name: 'Party 1',
          description: 'First party',
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'party2',
          userId: 'user123',
          name: 'Party 2',
          description: 'Second party',
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockPartyService.findByUserId.mockResolvedValue(mockParties);

      const response = await request(app)
        .get('/api/parties');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockParties);
      expect(mockPartyService.findByUserId).toHaveBeenCalledWith('user123');
    });

    it('should return empty array when user has no parties', async () => {
      mockPartyService.findByUserId.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/parties');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/parties/:id', () => {
    it('should return specific party by id', async () => {
      const mockParty = {
        id: 'party123',
        userId: 'user123',
        name: 'Test Party',
        description: 'A test party',
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPartyService.findById.mockResolvedValue(mockParty);

      const response = await request(app)
        .get('/api/parties/party123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockParty);
      expect(mockPartyService.findById).toHaveBeenCalledWith('party123', 'user123');
    });

    it('should return 404 when party not found', async () => {
      mockPartyService.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/parties/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Party not found');
    });
  });

  describe('PUT /api/parties/:id', () => {
    it('should update party successfully', async () => {
      const updateData = {
        name: 'Updated Party Name',
        description: 'Updated description'
      };

      const mockUpdatedParty = {
        id: 'party123',
        userId: 'user123',
        ...updateData,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPartyService.update.mockResolvedValue(mockUpdatedParty);

      const response = await request(app)
        .put('/api/parties/party123')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockUpdatedParty);
      expect(mockPartyService.update).toHaveBeenCalledWith('party123', 'user123', updateData);
    });

    it('should return 404 when updating non-existent party', async () => {
      const updateData = {
        name: 'Updated Name'
      };

      mockPartyService.update.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/parties/nonexistent')
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Party not found');
    });

    it('should return 400 for invalid update data', async () => {
      const invalidUpdate = {
        name: '' // Empty name should fail validation
      };

      const response = await request(app)
        .put('/api/parties/party123')
        .send(invalidUpdate);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/parties/:id', () => {
    it('should delete party successfully', async () => {
      mockPartyService.delete.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/parties/party123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Party deleted successfully');
      expect(mockPartyService.delete).toHaveBeenCalledWith('party123', 'user123');
    });

    it('should return 404 when deleting non-existent party', async () => {
      mockPartyService.delete.mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/parties/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Party not found');
    });
  });
});