import { describe, it, expect } from 'vitest';
import type { 
  StandardApiResponse, 
  StandardSuccessResponse, 
  StandardErrorResponse,
  PaginatedApiResponse,
  PaginationMetadata
} from './api.js';

describe('API Types', () => {
  describe('StandardSuccessResponse', () => {
    it('should have correct structure for success response with data', () => {
      const response: StandardSuccessResponse<{ id: number; name: string }> = {
        success: true,
        data: { id: 1, name: 'Test' },
        message: 'Success',
        timestamp: '2024-01-01T00:00:00.000Z',
        version: 'v1'
      };

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ id: 1, name: 'Test' });
      expect(response.message).toBe('Success');
      expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
      expect(response.version).toBe('v1');
    });

    it('should support null data for success responses', () => {
      const response: StandardSuccessResponse<null> = {
        success: true,
        data: null,
        message: 'Operation completed',
        timestamp: '2024-01-01T00:00:00.000Z',
        version: 'v1'
      };

      expect(response.success).toBe(true);
      expect(response.data).toBeNull();
    });
  });

  describe('StandardErrorResponse', () => {
    it('should have correct structure for error response', () => {
      const response: StandardErrorResponse = {
        success: false,
        error: 'ValidationError',
        message: 'Invalid input provided',
        statusCode: 400,
        timestamp: '2024-01-01T00:00:00.000Z',
        version: 'v1'
      };

      expect(response.success).toBe(false);
      expect(response.error).toBe('ValidationError');
      expect(response.message).toBe('Invalid input provided');
      expect(response.statusCode).toBe(400);
    });

    it('should support optional details field', () => {
      const response: StandardErrorResponse = {
        success: false,
        error: 'ValidationError',
        message: 'Invalid input',
        statusCode: 400,
        timestamp: '2024-01-01T00:00:00.000Z',
        version: 'v1',
        details: 'Field "email" is required'
      };

      expect(response.details).toBe('Field "email" is required');
    });
  });

  describe('PaginatedApiResponse', () => {
    it('should extend success response with pagination metadata', () => {
      const response: PaginatedApiResponse<{ id: number }> = {
        success: true,
        data: [{ id: 1 }, { id: 2 }],
        message: 'Data retrieved',
        timestamp: '2024-01-01T00:00:00.000Z',
        version: 'v1',
        pagination: {
          page: 1,
          limit: 10,
          total: 50,
          totalPages: 5
        }
      };

      expect(response.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 50,
        totalPages: 5
      });
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe('PaginationMetadata', () => {
    it('should have correct structure', () => {
      const pagination: PaginationMetadata = {
        page: 2,
        limit: 20,
        total: 100,
        totalPages: 5
      };

      expect(pagination.page).toBe(2);
      expect(pagination.limit).toBe(20);
      expect(pagination.total).toBe(100);
      expect(pagination.totalPages).toBe(5);
    });
  });

  describe('StandardApiResponse Union Type', () => {
    it('should accept success response', () => {
      const response: StandardApiResponse<string> = {
        success: true,
        data: 'test data',
        message: 'Success',
        timestamp: '2024-01-01T00:00:00.000Z',
        version: 'v1'
      };

      if (response.success) {
        expect(response.data).toBe('test data');
      }
    });

    it('should accept error response', () => {
      const response: StandardApiResponse<string> = {
        success: false,
        error: 'Error',
        message: 'Something went wrong',
        statusCode: 500,
        timestamp: '2024-01-01T00:00:00.000Z',
        version: 'v1'
      };

      if (!response.success) {
        expect(response.error).toBe('Error');
        expect(response.statusCode).toBe(500);
      }
    });
  });
});