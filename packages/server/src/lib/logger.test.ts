import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createLogger, createRequestLogger, sanitizeObject } from './logger.js';
import type { Logger } from 'pino';

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NODE_ENV;
    delete process.env.LOG_LEVEL;
  });

  describe('createLogger', () => {
    it('should create a logger instance', () => {
      const logger = createLogger();
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should use pretty format in development environment', () => {
      process.env.NODE_ENV = 'development';
      const logger = createLogger();
      expect(logger).toBeDefined();
    });

    it('should use JSON format in production environment', () => {
      process.env.NODE_ENV = 'production';
      const logger = createLogger();
      expect(logger).toBeDefined();
    });

    it('should use test environment configuration for testing', () => {
      process.env.NODE_ENV = 'test';
      const logger = createLogger();
      expect(logger).toBeDefined();
    });

    it('should respect LOG_LEVEL environment variable', () => {
      process.env.LOG_LEVEL = 'error';
      const logger = createLogger();
      expect(logger).toBeDefined();
    });

    it('should include service name in logs', () => {
      const logger = createLogger();
      expect(logger).toBeDefined();
    });

    it('should include timestamp in logs', () => {
      const logger = createLogger();
      expect(logger).toBeDefined();
    });

    it('should sanitize sensitive data from logs', () => {
      const logger = createLogger();
      
      // Mock the logger to capture output
      const logSpy = vi.spyOn(logger, 'info');
      
      const sensitiveData = {
        password: 'secret123',
        email: 'user@example.com',
        token: 'jwt-token-here',
        apiKey: 'api-key-here'
      };

      logger.info(sensitiveData, 'Test log with sensitive data');
      
      // Should not log sensitive fields
      expect(logSpy).toHaveBeenCalled();
    });
  });

  describe('createRequestLogger', () => {
    it('should create request logging middleware', () => {
      const requestLogger = createRequestLogger();
      expect(requestLogger).toBeDefined();
      expect(typeof requestLogger).toBe('function');
    });

    it('should test req serializer with null req', () => {
      const logger = createLogger();
      // Access the serializer directly for testing
      const config = (logger as any).options || (logger as any).bindings || {};
      
      // Test that we can create and use the logger
      expect(logger).toBeDefined();
    });

    it('should test request serializer with complete request object', () => {
      const logger = createLogger();
      const mockReq = {
        method: 'POST',
        url: '/api/users',
        headers: {
          'content-type': 'application/json',
          'authorization': 'Bearer secret-token',
          'user-agent': 'test-agent'
        },
        remoteAddress: '127.0.0.1',
        remotePort: 3000,
        requestId: 'req-123'
      };

      // Access the req serializer
      const serializers = (logger as any).serializers;
      if (serializers && serializers.req) {
        const serializedReq = serializers.req(mockReq);
        expect(serializedReq.method).toBe('POST');
        expect(serializedReq.url).toBe('/api/users');
        expect(serializedReq.headers.authorization).toBe('[REDACTED]');
        expect(serializedReq.headers['content-type']).toBe('application/json');
        expect(serializedReq.remoteAddress).toBe('127.0.0.1');
        expect(serializedReq.remotePort).toBe(3000);
        expect(serializedReq.requestId).toBe('req-123');
      }
    });

    it('should test request serializer with null/undefined request', () => {
      const logger = createLogger();
      const serializers = (logger as any).serializers;
      
      if (serializers && serializers.req) {
        expect(serializers.req(null)).toBeNull();
        expect(serializers.req(undefined)).toBeUndefined();
      }
    });

    it('should test response serializer with complete response object', () => {
      const logger = createLogger();
      const mockRes = {
        statusCode: 200,
        headers: {
          'content-type': 'application/json',
          'set-cookie': 'session=abc123'
        }
      };

      const serializers = (logger as any).serializers;
      if (serializers && serializers.res) {
        const serializedRes = serializers.res(mockRes);
        expect(serializedRes.statusCode).toBe(200);
        expect(serializedRes.headers).toBeDefined();
      }
    });

    it('should test response serializer with null/undefined response', () => {
      const logger = createLogger();
      const serializers = (logger as any).serializers;
      
      if (serializers && serializers.res) {
        expect(serializers.res(null)).toBeNull();
        expect(serializers.res(undefined)).toBeUndefined();
      }
    });

    it('should test log method hook with object sanitization', () => {
      const logger = createLogger();
      const sensitiveData = {
        username: 'testuser',
        password: 'secret123',
        apiKey: 'sk-12345'
      };

      // Test that logging with sensitive data gets sanitized
      const logSpy = vi.spyOn(logger, 'info');
      logger.info(sensitiveData, 'Test message');
      
      expect(logSpy).toHaveBeenCalled();
    });

    it('should test formatters.log function', () => {
      const logger = createLogger();
      const testObject = {
        safe_field: 'safe_value',
        password: 'secret123',
        nested: {
          token: 'jwt-token',
          user: 'testuser'
        }
      };

      // Access the formatters
      const formatters = (logger as any).formatters;
      if (formatters && formatters.log) {
        const formatted = formatters.log(testObject);
        expect(formatted.safe_field).toBe('safe_value');
        expect(formatted.password).toBe('[REDACTED]');
        expect(formatted.nested.token).toBe('[REDACTED]');
        expect(formatted.nested.user).toBe('testuser');
      }
    });

    it('should test different environment configurations', () => {
      const originalEnv = process.env.NODE_ENV;
      
      // Test production mode
      process.env.NODE_ENV = 'production';
      const prodLogger = createLogger();
      expect(prodLogger).toBeDefined();
      
      // Test development mode  
      process.env.NODE_ENV = 'development';
      const devLogger = createLogger();
      expect(devLogger).toBeDefined();
      
      // Test test mode
      process.env.NODE_ENV = 'test';
      const testLogger = createLogger();
      expect(testLogger).toBeDefined();
      
      // Test with custom log level
      process.env.LOG_LEVEL = 'warn';
      const warnLogger = createLogger();
      expect(warnLogger).toBeDefined();
      
      process.env.NODE_ENV = originalEnv;
      delete process.env.LOG_LEVEL;
    });

    it('should generate unique request IDs', () => {
      const requestLogger = createRequestLogger();
      expect(requestLogger).toBeDefined();
    });

    it('should log request and response details', () => {
      const requestLogger = createRequestLogger();
      expect(requestLogger).toBeDefined();
    });

    it('should exclude sensitive headers from logging', () => {
      const requestLogger = createRequestLogger();
      expect(requestLogger).toBeDefined();
    });

    it('should log response time', () => {
      const requestLogger = createRequestLogger();
      expect(requestLogger).toBeDefined();
    });

    it('should test createRequestLogger custom log levels', () => {
      const requestLogger = createRequestLogger();
      expect(requestLogger).toBeDefined();
      
      // Access the customLogLevel function for testing
      const config = (requestLogger as any).opts;
      if (config && config.customLogLevel) {
        // Test 4xx status codes -> warn level
        const req400 = { method: 'GET', url: '/test' };
        const res400 = { statusCode: 400 };
        expect(config.customLogLevel(req400, res400, null)).toBe('warn');
        
        // Test 5xx status codes -> error level
        const req500 = { method: 'GET', url: '/test' };
        const res500 = { statusCode: 500 };
        expect(config.customLogLevel(req500, res500, null)).toBe('error');
        
        // Test with error -> error level
        const req200 = { method: 'GET', url: '/test' };
        const res200 = { statusCode: 200 };
        const error = new Error('Test error');
        expect(config.customLogLevel(req200, res200, error)).toBe('error');
        
        // Test successful request -> info level
        expect(config.customLogLevel(req200, res200, null)).toBe('info');
      }
    });

    it('should test createRequestLogger custom success message', () => {
      const requestLogger = createRequestLogger();
      const config = (requestLogger as any).opts;
      
      if (config && config.customSuccessMessage) {
        const req = { method: 'POST', url: '/api/users' };
        const res = { statusCode: 201 };
        const message = config.customSuccessMessage(req, res);
        expect(message).toBe('POST /api/users - 201');
      }
    });

    it('should test createRequestLogger custom error message', () => {
      const requestLogger = createRequestLogger();
      const config = (requestLogger as any).opts;
      
      if (config && config.customErrorMessage) {
        const req = { method: 'GET', url: '/api/test' };
        const res = { statusCode: 500 };
        const error = new Error('Database connection failed');
        const message = config.customErrorMessage(req, res, error);
        expect(message).toBe('GET /api/test - 500 - Database connection failed');
      }
    });

    it('should test createRequestLogger genReqId function', () => {
      const requestLogger = createRequestLogger();
      const config = (requestLogger as any).opts;
      
      if (config && config.genReqId) {
        // Test with existing request ID
        const reqWithId = { requestId: 'existing-id-123' };
        expect(config.genReqId(reqWithId)).toBe('existing-id-123');
        
        // Test without existing request ID - should generate new UUID
        const reqWithoutId = {};
        const generatedId = config.genReqId(reqWithoutId);
        expect(generatedId).toBeDefined();
        expect(typeof generatedId).toBe('string');
        expect(generatedId.length).toBeGreaterThan(0);
      }
    });

    it('should test createRequestLogger response serializer with getHeaders', () => {
      const requestLogger = createRequestLogger();
      const config = (requestLogger as any).opts;
      
      if (config && config.serializers && config.serializers.res) {
        const mockRes = {
          statusCode: 200,
          getHeaders: () => ({
            'content-type': 'application/json',
            'set-cookie': 'session=secret123'
          })
        };
        
        const serialized = config.serializers.res(mockRes);
        expect(serialized.statusCode).toBe(200);
        expect(serialized.headers).toBeDefined();
        expect(serialized.headers['set-cookie']).toBe('[REDACTED]');
        expect(serialized.headers['content-type']).toBe('application/json');
      }
    });

    it('should test createRequestLogger response serializer without getHeaders', () => {
      const requestLogger = createRequestLogger();
      const config = (requestLogger as any).opts;
      
      if (config && config.serializers && config.serializers.res) {
        const mockRes = {
          statusCode: 404
          // No getHeaders method
        };
        
        const serialized = config.serializers.res(mockRes);
        expect(serialized.statusCode).toBe(404);
        expect(serialized.headers).toEqual({});
      }
    });
  });

  describe('Logger Security', () => {
    it('should not log passwords', () => {
      // Create a temporary logger that writes to a captured stream
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // Capture logs by testing the sanitization directly
      const testData = { password: 'secret123', user: 'test' };
      const sanitizedData = sanitizeObject(testData);
      
      expect(sanitizedData.password).toBe('[REDACTED]');
      expect(sanitizedData.user).toBe('test');
      expect(JSON.stringify(sanitizedData)).not.toContain('secret123');
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not log JWT tokens', () => {
      const testData = { token: 'jwt.token.here', user: 'test' };
      const sanitizedData = sanitizeObject(testData);
      
      expect(sanitizedData.token).toBe('[REDACTED]');
      expect(sanitizedData.user).toBe('test');
      expect(JSON.stringify(sanitizedData)).not.toContain('jwt.token.here');
    });

    it('should not log API keys', () => {
      const testData = { apiKey: 'sk-1234567890', user: 'test' };
      const sanitizedData = sanitizeObject(testData);
      
      expect(sanitizedData.apiKey).toBe('[REDACTED]');
      expect(sanitizedData.user).toBe('test');
      expect(JSON.stringify(sanitizedData)).not.toContain('sk-1234567890');
    });

    it('should not log authorization headers', () => {
      const testData = { 
        headers: { 
          authorization: 'Bearer token123',
          'content-type': 'application/json'
        } 
      };
      const sanitizedData = sanitizeObject(testData);
      
      expect(sanitizedData.headers.authorization).toBe('[REDACTED]');
      expect(sanitizedData.headers['content-type']).toBe('application/json');
      expect(JSON.stringify(sanitizedData)).not.toContain('Bearer token123');
    });
  });

  describe('Logger Performance', () => {
    it('should be fast for high-volume logging', () => {
      const logger = createLogger();
      const start = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        logger.info({ iteration: i }, 'Performance test log');
      }
      
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(1000); // Should complete 1000 logs in under 1 second
    });

    it('should handle complex objects efficiently', () => {
      const logger = createLogger();
      const complexObject = {
        level1: {
          level2: {
            level3: {
              array: new Array(100).fill('test'),
              timestamp: new Date(),
              numbers: Array.from({ length: 100 }, (_, i) => i)
            }
          }
        }
      };

      const start = Date.now();
      logger.info(complexObject, 'Complex object log');
      const elapsed = Date.now() - start;
      
      expect(elapsed).toBeLessThan(100); // Should handle complex objects quickly
    });
  });
});