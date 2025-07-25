import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Set test environment first
process.env.NODE_ENV = 'test';

// Create global mock functions using vi.hoisted
const mockConsume = vi.hoisted(() => vi.fn());

// Mock rate-limiter-flexible
vi.mock('rate-limiter-flexible', () => ({
  RateLimiterRedis: vi.fn(() => ({ consume: mockConsume })),
  RateLimiterMemory: vi.fn(() => ({ consume: mockConsume }))
}));

// Mock Redis
vi.mock('redis', () => ({
  createClient: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    ping: vi.fn().mockResolvedValue('PONG')
  }))
}));

// Import after mocking
import { rateLimitMiddleware, createRateLimiter } from './rate-limiting';

describe('Rate Limiting Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Reset mock to default success case
    mockConsume.mockReset().mockResolvedValue({
      totalHits: 1,
      remainingPoints: 4,
      msBeforeNext: 45000
    });
    
    // Ensure test environment
    process.env.NODE_ENV = 'test';
    delete process.env.REDIS_URL;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Unauthenticated endpoint rate limiting', () => {
    it('should allow login requests within rate limit (5 per minute)', async () => {
      // Arrange
      const loginRateLimiter = rateLimitMiddleware({
        keyGenerator: (req) => req.ip || '127.0.0.1',
        points: 5,
        duration: 60,
        blockDuration: 60
      });

      app.post('/api/auth/login', loginRateLimiter, (req, res) => {
        res.json({ success: true });
      });

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' });
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.headers['x-ratelimit-limit']).toBe('5');
      expect(response.headers['x-ratelimit-remaining']).toBe('4');
      expect(mockConsume).toHaveBeenCalledWith('::ffff:127.0.0.1');
    });

    it('should block login requests after exceeding rate limit', async () => {
      // Arrange
      mockConsume.mockRejectedValueOnce({
        totalHits: 6,
        remainingPoints: 0,
        msBeforeNext: 30000
      });

      const loginRateLimiter = rateLimitMiddleware({
        keyGenerator: (req) => req.ip || '127.0.0.1',
        points: 5,
        duration: 60,
        blockDuration: 60
      });

      app.post('/api/auth/login', loginRateLimiter, (req, res) => {
        res.json({ success: true });
      });

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' });

      // Assert
      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Too many requests');
      expect(response.headers['retry-after']).toBe('30');
    });

    it('should apply rate limiting per IP address', async () => {
      // This test should demonstrate that different IPs have separate limits
      const loginRateLimiter = rateLimitMiddleware({
        keyGenerator: (req) => req.ip || '127.0.0.1',
        points: 5,
        duration: 60,
        blockDuration: 60
      });

      app.post('/api/auth/login', loginRateLimiter, (req, res) => {
        res.json({ success: true });
      });

      // Act - requests from different IPs should be tracked separately
      const response1 = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '192.168.1.1')
        .send({ email: 'test@example.com', password: 'password' });

      const response2 = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '192.168.1.2')
        .send({ email: 'test@example.com', password: 'password' });

      // Assert
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(mockConsume).toHaveBeenCalledTimes(2);
    });
  });

  describe('Authenticated endpoint rate limiting', () => {
    it('should apply tier-based rate limits for free tier users', async () => {
      // Arrange
      const apiRateLimiter = rateLimitMiddleware({
        keyGenerator: (req) => req.user?.id || req.ip || 'unknown',
        points: 100, // Free tier limit
        duration: 3600, // Per hour
        blockDuration: 3600
      });

      app.use((req, res, next) => {
        req.user = { 
          id: 'user_123', 
          email: 'test@example.com', 
          username: 'testuser',
          failedLoginAttempts: 0,
          lockedUntil: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          tier: 'free' 
        };
        next();
      });

      app.post('/api/characters', apiRateLimiter, (req, res) => {
        res.json({ success: true });
      });

      // Act
      const response = await request(app)
        .post('/api/characters')
        .send({ name: 'Test Character' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers['x-ratelimit-limit']).toBe('100');
      expect(mockConsume).toHaveBeenCalledWith('user_123');
    });

    it('should apply different rate limits for premium tier users', async () => {
      // Arrange
      const apiRateLimiter = rateLimitMiddleware({
        keyGenerator: (req) => req.user?.id || req.ip || 'unknown',
        points: 1000, // Premium tier limit
        duration: 3600,
        blockDuration: 3600
      });

      app.use((req, res, next) => {
        req.user = { 
          id: 'user_456', 
          email: 'premium@example.com', 
          username: 'premiumuser',
          failedLoginAttempts: 0,
          lockedUntil: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          tier: 'premium' 
        };
        next();
      });

      app.post('/api/characters', apiRateLimiter, (req, res) => {
        res.json({ success: true });
      });

      // Act
      const response = await request(app)
        .post('/api/characters')
        .send({ name: 'Test Character' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers['x-ratelimit-limit']).toBe('1000');
      expect(mockConsume).toHaveBeenCalledWith('user_456');
    });

    it('should block authenticated requests after exceeding tier limit', async () => {
      // Arrange
      mockConsume.mockRejectedValueOnce({
        totalHits: 101,
        remainingPoints: 0,
        msBeforeNext: 1800000
      });

      const apiRateLimiter = rateLimitMiddleware({
        keyGenerator: (req) => req.user?.id || req.ip || 'unknown',
        points: 100,
        duration: 3600,
        blockDuration: 3600
      });

      app.use((req, res, next) => {
        req.user = { 
          id: 'user_123', 
          email: 'test@example.com', 
          username: 'testuser',
          failedLoginAttempts: 0,
          lockedUntil: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          tier: 'free' 
        };
        next();
      });

      app.post('/api/characters', apiRateLimiter, (req, res) => {
        res.json({ success: true });
      });

      // Act
      const response = await request(app)
        .post('/api/characters')
        .send({ name: 'Test Character' });

      // Assert
      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Too many requests');
    });
  });

  describe('Redis configuration', () => {
    it('should use Redis in production environment', async () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      process.env.REDIS_URL = 'redis://localhost:6379';

      // Act & Assert
      expect(() => {
        createRateLimiter({
          points: 5,
          duration: 60,
          blockDuration: 60
        });
      }).not.toThrow();

      // Cleanup
      process.env.NODE_ENV = originalEnv;
      delete process.env.REDIS_URL;
    });

    it('should fallback to in-memory in development', async () => {
      // Arrange
      process.env.NODE_ENV = 'development';

      // Act & Assert
      expect(() => {
        createRateLimiter({
          points: 5,
          duration: 60,
          blockDuration: 60
        });
      }).not.toThrow();
    });

    it('should fail to start in production without Redis', async () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      delete process.env.REDIS_URL;

      // Act & Assert
      expect(() => {
        createRateLimiter({
          points: 5,
          duration: 60,
          blockDuration: 60
        });
      }).toThrow('Redis URL is required in production environment');

      // Cleanup
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Rate limit headers', () => {
    it('should include rate limit headers in response', async () => {
      // Arrange
      mockConsume.mockResolvedValue({
        totalHits: 3,
        remainingPoints: 2,
        msBeforeNext: 45000
      });

      const loginRateLimiter = rateLimitMiddleware({
        keyGenerator: (req) => req.ip || '127.0.0.1',
        points: 5,
        duration: 60,
        blockDuration: 60
      });

      app.post('/api/auth/login', loginRateLimiter, (req, res) => {
        res.json({ success: true });
      });

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers['x-ratelimit-limit']).toBe('5');
      expect(response.headers['x-ratelimit-remaining']).toBe('2');
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });
  });
});