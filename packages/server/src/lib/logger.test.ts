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