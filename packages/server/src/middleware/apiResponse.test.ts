import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { apiResponseMiddleware, successResponse, errorResponse } from './apiResponse.js';
import { HTTP_STATUS, API_VERSION } from '@dnd-tracker/shared';

describe('API Response Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(apiResponseMiddleware);
  });

  describe('successResponse helper', () => {
    it('should create a standardized success response with data', () => {
      const testData = { id: 1, name: 'Test' };
      const response = successResponse(testData, 'Operation successful');

      expect(response).toEqual({
        success: true,
        data: testData,
        message: 'Operation successful',
        timestamp: expect.any(String),
        version: API_VERSION.CURRENT
      });

      // Verify timestamp is valid ISO string
      expect(new Date(response.timestamp).toISOString()).toBe(response.timestamp);
    });

    it('should create a success response without data', () => {
      const response = successResponse(null, 'Operation completed');

      expect(response).toEqual({
        success: true,
        data: null,
        message: 'Operation completed',
        timestamp: expect.any(String),
        version: API_VERSION.CURRENT
      });
    });

    it('should create a success response with pagination metadata', () => {
      const testData = [{ id: 1 }, { id: 2 }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 50,
        totalPages: 5
      };
      
      const response = successResponse(testData, 'Data retrieved', pagination);

      expect(response).toEqual({
        success: true,
        data: testData,
        message: 'Data retrieved',
        timestamp: expect.any(String),
        version: API_VERSION.CURRENT,
        pagination
      });
    });
  });

  describe('errorResponse helper', () => {
    it('should create a standardized error response', () => {
      const error = new Error('Test error');
      const response = errorResponse(error, HTTP_STATUS.BAD_REQUEST, 'Validation failed');

      expect(response).toEqual({
        success: false,
        error: 'Error',
        message: 'Test error',
        statusCode: HTTP_STATUS.BAD_REQUEST,
        timestamp: expect.any(String),
        version: API_VERSION.CURRENT,
        details: 'Validation failed'
      });
    });

    it('should handle custom error types', () => {
      const customError = {
        name: 'ValidationError',
        message: 'Invalid input'
      };
      
      const response = errorResponse(customError, HTTP_STATUS.UNPROCESSABLE_ENTITY);

      expect(response).toEqual({
        success: false,
        error: 'ValidationError',
        message: 'Invalid input',
        statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
        timestamp: expect.any(String),
        version: API_VERSION.CURRENT
      });
    });
  });

  describe('apiResponseMiddleware', () => {
    it('should add response helpers to res object', async () => {
      app.get('/test-success', (_req, res) => {
        const testData = { test: 'data' };
        res.success(testData, 'Success message');
      });

      const response = await request(app)
        .get('/test-success')
        .expect(HTTP_STATUS.OK);

      expect(response.body).toEqual({
        success: true,
        data: { test: 'data' },
        message: 'Success message',
        timestamp: expect.any(String),
        version: API_VERSION.CURRENT
      });
    });

    it('should add error response helper to res object', async () => {
      app.get('/test-error', (_req, res) => {
        const error = new Error('Test error');
        res.error(error, HTTP_STATUS.NOT_FOUND, 'Resource not found');
      });

      const response = await request(app)
        .get('/test-error')
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(response.body).toEqual({
        success: false,
        error: 'Error',
        message: 'Test error',
        statusCode: HTTP_STATUS.NOT_FOUND,
        timestamp: expect.any(String),
        version: API_VERSION.CURRENT,
        details: 'Resource not found'
      });
    });

    it('should add pagination response helper to res object', async () => {
      app.get('/test-pagination', (_req, res) => {
        const testData = [{ id: 1 }, { id: 2 }];
        const pagination = {
          page: 2,
          limit: 10,
          total: 25,
          totalPages: 3
        };
        res.paginated(testData, pagination, 'Data retrieved successfully');
      });

      const response = await request(app)
        .get('/test-pagination')
        .expect(HTTP_STATUS.OK);

      expect(response.body).toEqual({
        success: true,
        data: [{ id: 1 }, { id: 2 }],
        message: 'Data retrieved successfully',
        timestamp: expect.any(String),
        version: API_VERSION.CURRENT,
        pagination: {
          page: 2,
          limit: 10,
          total: 25,
          totalPages: 3
        }
      });
    });
  });
});