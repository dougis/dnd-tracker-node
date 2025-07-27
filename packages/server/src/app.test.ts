import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { HTTP_STATUS, API_VERSION } from '@dnd-tracker/shared/constants';

// Import app components to create a test version
import { apiVersioningMiddleware } from './middleware/apiVersioning.js';
import { apiResponseMiddleware } from './middleware/apiResponse.js';

describe('App Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(apiVersioningMiddleware);
    app.use(apiResponseMiddleware);

    // Test routes
    app.get('/health', (_req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    app.get('/api/v1/test', (_req, res) => {
      res.success({ test: 'data' }, 'Test endpoint successful');
    });

    app.get('/api/v1/users', (_req, res) => {
      const users = [{ id: 1, name: 'User 1' }, { id: 2, name: 'User 2' }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1
      };
      res.paginated(users, pagination, 'Users retrieved successfully');
    });

    app.get('/api/v1/error-test', (_req, res) => {
      const error = new Error('Test error');
      res.error(error, HTTP_STATUS.BAD_REQUEST, 'This is a test error');
    });
  });

  describe('API Versioning Integration', () => {
    it('should handle versioned API requests correctly', async () => {
      const response = await request(app)
        .get('/api/v1/test')
        .expect(HTTP_STATUS.OK);

      expect(response.body).toEqual({
        success: true,
        data: { test: 'data' },
        message: 'Test endpoint successful',
        timestamp: expect.any(String),
        version: API_VERSION.CURRENT
      });

      expect(response.headers['api-version']).toBe(API_VERSION.V1);
    });

    it('should reject unsupported API versions', async () => {
      const response = await request(app)
        .get('/api/v2/test')
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Unsupported API Version',
        statusCode: HTTP_STATUS.BAD_REQUEST
      });
    });

    it('should handle version from header', async () => {
      app.get('/api/header-test', (_req, res) => {
        res.success({ header: 'test' }, 'Header version test');
      });

      const response = await request(app)
        .get('/api/header-test')
        .set('API-Version', 'v1')
        .expect(HTTP_STATUS.OK);

      expect(response.body.version).toBe(API_VERSION.V1);
      expect(response.headers['api-version']).toBe(API_VERSION.V1);
    });
  });

  describe('Response Format Integration', () => {
    it('should format success responses consistently', async () => {
      const response = await request(app)
        .get('/api/v1/test')
        .expect(HTTP_STATUS.OK);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Object),
        message: expect.any(String),
        timestamp: expect.any(String),
        version: expect.any(String)
      });

      // Verify timestamp is valid ISO string
      expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);
    });

    it('should format paginated responses correctly', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .expect(HTTP_STATUS.OK);

      expect(response.body).toEqual({
        success: true,
        data: [
          { id: 1, name: 'User 1' },
          { id: 2, name: 'User 2' }
        ],
        message: 'Users retrieved successfully',
        timestamp: expect.any(String),
        version: API_VERSION.CURRENT,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1
        }
      });
    });

    it('should format error responses consistently', async () => {
      const response = await request(app)
        .get('/api/v1/error-test')
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body).toEqual({
        success: false,
        error: 'Error',
        message: 'Test error',
        statusCode: HTTP_STATUS.BAD_REQUEST,
        timestamp: expect.any(String),
        version: API_VERSION.CURRENT,
        details: 'This is a test error'
      });
    });
  });

  describe('Non-versioned endpoints', () => {
    it('should allow health check without versioning', async () => {
      const response = await request(app)
        .get('/health')
        .expect(HTTP_STATUS.OK);

      expect(response.body).toMatchObject({
        status: 'ok',
        timestamp: expect.any(String)
      });

      // Health check should not have version headers
      expect(response.headers['api-version']).toBeUndefined();
    });
  });

  describe('Error handling for missing versions', () => {
    it('should require version for API endpoints without explicit version', async () => {
      app.get('/api/no-version', (_req, res) => {
        res.success({ data: 'test' }, 'Should not reach here');
      });

      const response = await request(app)
        .get('/api/no-version')
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Missing API Version',
        statusCode: HTTP_STATUS.BAD_REQUEST
      });
    });
  });
});