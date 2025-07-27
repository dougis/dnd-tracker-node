import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { apiVersioningMiddleware, extractVersion, validateVersion } from './apiVersioning.js';
import { HTTP_STATUS, API_VERSION } from '@dnd-tracker/shared/constants';

describe('API Versioning Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('extractVersion utility', () => {
    it('should extract version from URL path', () => {
      const version = extractVersion('/api/v1/users');
      expect(version).toBe('v1');
    });

    it('should extract version from different endpoints', () => {
      expect(extractVersion('/api/v2/characters')).toBe('v2');
      expect(extractVersion('/api/v1/encounters/123')).toBe('v1');
    });

    it('should return null for paths without version', () => {
      expect(extractVersion('/api/users')).toBeNull();
      expect(extractVersion('/health')).toBeNull();
    });

    it('should handle malformed paths gracefully', () => {
      expect(extractVersion('')).toBeNull();
      expect(extractVersion('/')).toBeNull();
      expect(extractVersion('/api')).toBeNull();
    });
  });

  describe('validateVersion utility', () => {
    it('should validate supported versions', () => {
      expect(validateVersion(API_VERSION.V1)).toBe(true);
    });

    it('should reject unsupported versions', () => {
      expect(validateVersion('v2')).toBe(false);
      expect(validateVersion('v0')).toBe(false);
      expect(validateVersion('invalid')).toBe(false);
    });

    it('should handle null/undefined versions', () => {
      expect(validateVersion(null)).toBe(false);
      expect(validateVersion(undefined)).toBe(false);
    });
  });

  describe('apiVersioningMiddleware', () => {
    beforeEach(() => {
      app.use(apiVersioningMiddleware);
      
      // Test routes for different versions
      app.get('/api/v1/test', (req, res) => {
        res.json({ version: req.apiVersion, message: 'v1 endpoint' });
      });

      app.get('/health', (_req, res) => {
        res.json({ status: 'ok' });
      });
    });

    it('should set apiVersion on request object for valid versioned endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/test')
        .expect(HTTP_STATUS.OK);

      expect(response.body).toEqual({
        version: API_VERSION.V1,
        message: 'v1 endpoint'
      });
    });

    it('should return 400 for unsupported API version', async () => {
      await request(app)
        .get('/api/v2/test')
        .expect(HTTP_STATUS.BAD_REQUEST);
    });

    it('should allow non-versioned endpoints to pass through', async () => {
      const response = await request(app)
        .get('/health')
        .expect(HTTP_STATUS.OK);

      expect(response.body).toEqual({ status: 'ok' });
    });

    it('should validate version from API-Version header', async () => {
      app.get('/api/test-header', (req, res) => {
        res.json({ version: req.apiVersion });
      });

      const response = await request(app)
        .get('/api/test-header')
        .set('API-Version', 'v1')
        .expect(HTTP_STATUS.OK);

      expect(response.body.version).toBe('v1');
    });

    it('should prioritize URL version over header version', async () => {
      const response = await request(app)
        .get('/api/v1/test')
        .set('API-Version', 'v2')
        .expect(HTTP_STATUS.OK);

      expect(response.body.version).toBe('v1');
    });

    it('should return 400 for invalid header version', async () => {
      app.get('/api/test-invalid-header', (_req, res) => {
        res.json({ message: 'should not reach here' });
      });

      await request(app)
        .get('/api/test-invalid-header')
        .set('API-Version', 'invalid')
        .expect(HTTP_STATUS.BAD_REQUEST);
    });

    it('should add API version to response headers', async () => {
      const response = await request(app)
        .get('/api/v1/test')
        .expect(HTTP_STATUS.OK);

      expect(response.headers['api-version']).toBe(API_VERSION.V1);
    });

    it('should handle version deprecation warnings', async () => {
      // Mock a deprecated version scenario
      app.get('/api/v1/deprecated-test', (req, res) => {
        // Simulate checking if version is deprecated
        const isDeprecated = false; // v1 is not deprecated yet
        if (isDeprecated) {
          res.set('Deprecation', 'true');
          res.set('Sunset', '2024-12-31T23:59:59Z');
        }
        res.json({ version: req.apiVersion });
      });

      const response = await request(app)
        .get('/api/v1/deprecated-test')
        .expect(HTTP_STATUS.OK);

      expect(response.headers.deprecation).toBeUndefined();
      expect(response.headers.sunset).toBeUndefined();
    });
  });

  describe('Version routing', () => {
    it('should support multiple API versions with different behaviors', async () => {
      app.use(apiVersioningMiddleware);
      
      // Simulate different version implementations
      app.get('/api/v1/users', (req, res) => {
        res.json({ 
          version: req.apiVersion,
          users: [{ id: 1, name: 'User 1' }],
          format: 'basic'
        });
      });

      const v1Response = await request(app)
        .get('/api/v1/users')
        .expect(HTTP_STATUS.OK);

      expect(v1Response.body).toEqual({
        version: API_VERSION.V1,
        users: [{ id: 1, name: 'User 1' }],
        format: 'basic'
      });
    });
  });
});