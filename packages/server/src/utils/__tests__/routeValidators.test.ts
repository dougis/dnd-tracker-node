import { describe, it, expect, vi } from 'vitest';
import { Request, Response } from 'express';
import { RouteValidators } from '../routeValidators';
import * as routeHelpers from '../routeHelpers';

// Mock the routeHelpers module
vi.mock('../routeHelpers', () => ({
  sendErrorResponse: vi.fn()
}));

describe('RouteValidators', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      params: {},
      user: { 
        id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        failedLoginAttempts: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
    mockRes = {};
    vi.clearAllMocks();
  });

  describe('validateParam', () => {
    it('should return parameter value when present', () => {
      mockReq.params = { id: 'test123' };

      const result = RouteValidators.validateParam(
        mockReq as Request,
        mockRes as Response,
        'id',
        'Test'
      );

      expect(result).toBe('test123');
      expect(routeHelpers.sendErrorResponse).not.toHaveBeenCalled();
    });

    it('should return null and send error when parameter missing', () => {
      mockReq.params = {};

      const result = RouteValidators.validateParam(
        mockReq as Request,
        mockRes as Response,
        'id',
        'Test'
      );

      expect(result).toBeNull();
      expect(routeHelpers.sendErrorResponse).toHaveBeenCalledWith(
        mockRes,
        expect.any(Error),
        'Test ID is required',
        400
      );
    });

    it('should return null and send error when parameter is empty string', () => {
      mockReq.params = { id: '' };

      const result = RouteValidators.validateParam(
        mockReq as Request,
        mockRes as Response,
        'id',
        'Test'
      );

      expect(result).toBeNull();
      expect(routeHelpers.sendErrorResponse).toHaveBeenCalledWith(
        mockRes,
        expect.any(Error),
        'Test ID is required',
        400
      );
    });
  });

  describe('extractUserId', () => {
    it('should return user ID from authenticated request', () => {
      const result = RouteValidators.extractUserId(mockReq as Request);

      expect(result).toBe('user123');
    });

    it('should handle different user ID values', () => {
      mockReq.user = { 
        id: 'different-user-456',
        email: 'different@example.com',
        username: 'differentuser',
        failedLoginAttempts: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = RouteValidators.extractUserId(mockReq as Request);

      expect(result).toBe('different-user-456');
    });
  });

  describe('validateParamAndUser', () => {
    it('should return both ID and user ID when parameter present', () => {
      mockReq.params = { entityId: 'entity123' };

      const result = RouteValidators.validateParamAndUser(
        mockReq as Request,
        mockRes as Response,
        'entityId',
        'Entity'
      );

      expect(result).toEqual({
        id: 'entity123',
        userId: 'user123'
      });
      expect(routeHelpers.sendErrorResponse).not.toHaveBeenCalled();
    });

    it('should return null when parameter validation fails', () => {
      mockReq.params = {};

      const result = RouteValidators.validateParamAndUser(
        mockReq as Request,
        mockRes as Response,
        'entityId',
        'Entity'
      );

      expect(result).toBeNull();
      expect(routeHelpers.sendErrorResponse).toHaveBeenCalledWith(
        mockRes,
        expect.any(Error),
        'Entity ID is required',
        400
      );
    });

    it('should work with different parameter names and entity types', () => {
      mockReq.params = { partyId: 'party456' };

      const result = RouteValidators.validateParamAndUser(
        mockReq as Request,
        mockRes as Response,
        'partyId',
        'Party'
      );

      expect(result).toEqual({
        id: 'party456',
        userId: 'user123'
      });
    });
  });
});