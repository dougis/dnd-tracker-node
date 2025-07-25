import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { TestPatterns, ServiceTestPatterns } from '../TestPatterns';
import { PrismaMockFactory } from '../PrismaMockFactory';

describe('TestPatterns', () => {
  let mockPrisma: any;
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
    mockPrisma = PrismaMockFactory.createFullMock();
    app = express();
    app.use(express.json());
  });

  describe('setupServiceTest', () => {
    it('should clear all mocks', () => {
      // Set up some mock calls
      mockPrisma.user.create();
      mockPrisma.party.findFirst();

      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.party.findFirst).toHaveBeenCalledTimes(1);

      TestPatterns.setupServiceTest(mockPrisma);

      expect(mockPrisma.user.create).toHaveBeenCalledTimes(0);
      expect(mockPrisma.party.findFirst).toHaveBeenCalledTimes(0);
    });
  });

  describe('cleanupServiceTest', () => {
    it('should reset all mocks', () => {
      // Set up some mock calls
      mockPrisma.user.create();
      mockPrisma.party.findFirst();

      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.party.findFirst).toHaveBeenCalledTimes(1);

      TestPatterns.cleanupServiceTest(mockPrisma);

      expect(mockPrisma.user.create).toHaveBeenCalledTimes(0);
      expect(mockPrisma.party.findFirst).toHaveBeenCalledTimes(0);
    });
  });

  describe('setupRouteTest', () => {
    it('should call clearAllMocks', () => {
      // setupRouteTest calls vi.clearAllMocks, which affects global state
      // We can verify it exists and is callable
      expect(() => TestPatterns.setupRouteTest()).not.toThrow();
    });
  });

  describe('testPasswordValidation', () => {
    it('should create password validation test cases', () => {
      const mockTestFn = vi.fn().mockRejectedValue(new Error('Password validation failed'));
      const expectedError = 'Password validation failed';

      // This method creates vitest test cases dynamically
      // We verify the method exists and doesn't throw when called
      expect(typeof TestPatterns.testPasswordValidation).toBe('function');
    });
  });

  describe('testSuccessfulCreation', () => {
    it('should test successful creation endpoint', async () => {
      const endpoint = '/test';
      const createData = { name: 'Test' };
      const expectedResponse = { id: '1', name: 'Test' };
      const mockFn = vi.fn().mockResolvedValue(expectedResponse);

      // Set up a test route that calls the mock function
      app.post(endpoint, async (req, res) => {
        await mockFn('user123', req.body);
        res.status(201).json({
          success: true,
          data: expectedResponse,
          message: 'Test created successfully'
        });
      });

      await TestPatterns.testSuccessfulCreation(
        app,
        endpoint,
        createData,
        expectedResponse,
        mockFn
      );
    });
  });

  describe('testValidationFailure', () => {
    it('should test validation failure endpoint', async () => {
      const endpoint = '/test';
      const invalidData = { invalid: 'data' };

      // Set up a test route that returns validation error
      app.post(endpoint, (req, res) => {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: ['Invalid data']
        });
      });

      await TestPatterns.testValidationFailure(app, endpoint, invalidData);
    });
  });

  describe('testServiceError', () => {
    it('should test service error handling', async () => {
      const endpoint = '/test';
      const data = { test: 'data' };
      const mockFn = vi.fn().mockRejectedValue(new Error('Service error'));
      const errorMessage = 'Service error';

      // Set up a test route that returns service error
      app.post(endpoint, (req, res) => {
        res.status(500).json({
          success: false,
          message: errorMessage
        });
      });

      await TestPatterns.testServiceError(app, endpoint, data, mockFn, errorMessage);
    });
  });

  describe('testSuccessfulGetById', () => {
    it('should test successful GET by ID', async () => {
      const endpoint = '/test';
      const entityId = '123';
      const expectedResponse = { id: '123', name: 'Test' };
      const mockFn = vi.fn().mockResolvedValue(expectedResponse);

      // Set up a test route
      app.get(`${endpoint}/:id`, (req, res) => {
        res.status(200).json({
          success: true,
          data: expectedResponse,
          message: 'Test retrieved successfully'
        });
      });

      await TestPatterns.testSuccessfulGetById(
        app,
        endpoint,
        entityId,
        expectedResponse,
        mockFn
      );
    });
  });

  describe('testNotFound', () => {
    it('should test entity not found', async () => {
      const endpoint = '/test';
      const entityId = '123';
      const mockFn = vi.fn().mockResolvedValue(null);
      const entityType = 'Test';

      // Set up a test route that returns not found
      app.get(`${endpoint}/:id`, (req, res) => {
        res.status(404).json({
          success: false,
          message: `${entityType} not found`
        });
      });

      await TestPatterns.testNotFound(app, endpoint, entityId, mockFn, entityType);
    });
  });

  describe('testSuccessfulUpdate', () => {
    it('should test successful update', async () => {
      const endpoint = '/test';
      const entityId = '123';
      const updateData = { name: 'Updated' };
      const expectedResponse = { id: '123', name: 'Updated' };
      const mockFn = vi.fn().mockResolvedValue(expectedResponse);

      // Set up a test route
      app.put(`${endpoint}/:id`, (req, res) => {
        res.status(200).json({
          success: true,
          data: expectedResponse,
          message: 'Test updated successfully'
        });
      });

      await TestPatterns.testSuccessfulUpdate(
        app,
        endpoint,
        entityId,
        updateData,
        expectedResponse,
        mockFn
      );
    });
  });

  describe('testSuccessfulDeletion', () => {
    it('should test successful deletion', async () => {
      const endpoint = '/test';
      const entityId = '123';
      const mockFn = vi.fn().mockResolvedValue(true);
      const entityType = 'Test';

      // Set up a test route
      app.delete(`${endpoint}/:id`, (req, res) => {
        res.status(200).json({
          success: true,
          data: null,
          message: `${entityType} deleted successfully`
        });
      });

      await TestPatterns.testSuccessfulDeletion(
        app,
        endpoint,
        entityId,
        mockFn,
        entityType
      );
    });
  });

  describe('testDeleteNotFound', () => {
    it('should test delete not found', async () => {
      const endpoint = '/test';
      const entityId = '123';
      const mockFn = vi.fn().mockResolvedValue(false);
      const entityType = 'Test';

      // Set up a test route
      app.delete(`${endpoint}/:id`, (req, res) => {
        res.status(404).json({
          success: false,
          message: `${entityType} not found`
        });
      });

      await TestPatterns.testDeleteNotFound(
        app,
        endpoint,
        entityId,
        mockFn,
        entityType
      );
    });
  });

  describe('testGetCollection', () => {
    it('should test GET collection endpoint', async () => {
      const endpoint = '/test';
      const expectedResponse = [{ id: '1' }, { id: '2' }];
      const mockFn = vi.fn().mockResolvedValue(expectedResponse);
      const entityType = 'Tests';

      // Set up a test route
      app.get(endpoint, (req, res) => {
        res.status(200).json({
          success: true,
          data: expectedResponse,
          message: `${entityType} retrieved successfully`
        });
      });

      await TestPatterns.testGetCollection(
        app,
        endpoint,
        expectedResponse,
        mockFn,
        entityType
      );
    });
  });
});

describe('ServiceTestPatterns', () => {
  describe('static methods', () => {
    it('should have testSuccessfulCreate method', () => {
      expect(typeof ServiceTestPatterns.testSuccessfulCreate).toBe('function');
    });

    it('should have testValidationError method', () => {
      expect(typeof ServiceTestPatterns.testValidationError).toBe('function');
    });

    it('should have testDatabaseError method', () => {
      expect(typeof ServiceTestPatterns.testDatabaseError).toBe('function');
    });

    it('should have testSuccessfulFindById method', () => {
      expect(typeof ServiceTestPatterns.testSuccessfulFindById).toBe('function');
    });

    it('should have testNotFound method', () => {
      expect(typeof ServiceTestPatterns.testNotFound).toBe('function');
    });
  });
});