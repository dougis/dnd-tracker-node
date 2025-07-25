import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestApp, standardMocks } from '../utils/testHelpers';

// Use vi.hoisted to ensure mocks are available during hoisting
const { mockCreate, mockFindByUserId, mockFindById, mockUpdate, mockDelete } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockFindByUserId: vi.fn(),
  mockFindById: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
}));

// Helper functions to reduce duplication
const createMockParty = (overrides: any = {}) => ({
  id: 'party123',
  userId: 'user123',
  name: 'Test Party',
  description: 'A test party',
  isArchived: false,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  ...overrides
});

const expectSuccessResponse = (response: any, expectedData: any, expectedStatus = 200) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body.success).toBe(true);
  expect(response.body.data).toEqual(expectedData);
};

const expectErrorResponse = (response: any, expectedMessage: string, expectedStatus = 400) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body.success).toBe(false);
  expect(response.body.message).toBe(expectedMessage);
};

// Mock the service and middleware using standard patterns
vi.mock('../services/PartyService', () => ({
  PartyService: vi.fn().mockImplementation(() => ({
    create: mockCreate,
    findByUserId: mockFindByUserId,
    findById: mockFindById,
    update: mockUpdate,
    delete: mockDelete,
  }))
}));

vi.mock('@prisma/client', () => standardMocks.prismaClient);
vi.mock('../auth/middleware', () => standardMocks.authMiddleware);

import { partyRoutes } from './routes';

describe('Party Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp('/api/parties', partyRoutes);
  });

  describe('POST /api/parties', () => {
    it('should create a new party successfully', async () => {
      const newParty = {
        name: 'Test Party',
        description: 'A test adventure party'
      };
      
      const mockCreatedParty = createMockParty(newParty);
      mockCreate.mockResolvedValue(mockCreatedParty);

      const response = await request(app)
        .post('/api/parties')
        .send(newParty);

      expectSuccessResponse(response, mockCreatedParty, 201);
      expect(mockCreate).toHaveBeenCalledWith('user123', newParty);
    });

    it('should return 400 for invalid party data', async () => {
      const invalidParty = {
        name: '', // Empty name should fail validation
        description: 'A test party'
      };

      const response = await request(app)
        .post('/api/parties')
        .send(invalidParty);

      expectErrorResponse(response, 'Validation failed');
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
        createMockParty({ id: 'party1', name: 'Party 1', description: 'First party' }),
        createMockParty({ id: 'party2', name: 'Party 2', description: 'Second party' })
      ];

      mockFindByUserId.mockResolvedValue(mockParties);

      const response = await request(app)
        .get('/api/parties');

      expectSuccessResponse(response, mockParties);
      expect(mockFindByUserId).toHaveBeenCalledWith('user123', false);
    });

    it('should return empty array when user has no parties', async () => {
      mockFindByUserId.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/parties');

      expectSuccessResponse(response, []);
    });
  });

  describe('GET /api/parties/:id', () => {
    it('should return specific party by id', async () => {
      const mockParty = createMockParty();
      mockFindById.mockResolvedValue(mockParty);

      const response = await request(app)
        .get('/api/parties/party123');

      expectSuccessResponse(response, mockParty);
      expect(mockFindById).toHaveBeenCalledWith('party123', 'user123');
    });

    it('should return 404 when party not found', async () => {
      mockFindById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/parties/nonexistent');

      expectErrorResponse(response, 'Party not found', 404);
    });
  });

  describe('PUT /api/parties/:id', () => {
    it('should update party successfully', async () => {
      const updateData = {
        name: 'Updated Party Name',
        description: 'Updated description'
      };

      const mockUpdatedParty = createMockParty(updateData);
      mockUpdate.mockResolvedValue(mockUpdatedParty);

      const response = await request(app)
        .put('/api/parties/party123')
        .send(updateData);

      expectSuccessResponse(response, mockUpdatedParty);
      expect(mockUpdate).toHaveBeenCalledWith('party123', 'user123', updateData);
    });

    it('should return 404 when updating non-existent party', async () => {
      const updateData = {
        name: 'Updated Name'
      };

      mockUpdate.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/parties/nonexistent')
        .send(updateData);

      expectErrorResponse(response, 'Party not found', 404);
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
      mockDelete.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/parties/party123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Party deleted successfully');
      expect(mockDelete).toHaveBeenCalledWith('party123', 'user123');
    });

    it('should return 404 when deleting non-existent party', async () => {
      mockDelete.mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/parties/nonexistent');

      expectErrorResponse(response, 'Party not found', 404);
    });
  });
});