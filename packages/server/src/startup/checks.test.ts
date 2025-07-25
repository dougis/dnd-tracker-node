import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { checkRedisConnection, validateProductionEnvironment } from './checks';

// Mock Redis
vi.mock('redis', () => ({
  createClient: vi.fn(() => ({
    connect: vi.fn(),
    ping: vi.fn(),
    disconnect: vi.fn()
  }))
}));

describe('Production Environment Checks', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    // Reset environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('checkRedisConnection', () => {
    it('should successfully connect to Redis with valid configuration', async () => {
      process.env.NODE_ENV = 'production';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.REDIS_PASSWORD = 'testpassword';

      const { createClient } = await import('redis');
      const mockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        ping: vi.fn().mockResolvedValue('PONG'),
        disconnect: vi.fn().mockResolvedValue(undefined)
      };
      (createClient as any).mockReturnValue(mockClient);

      const result = await checkRedisConnection();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Redis connection successful');
      expect(createClient).toHaveBeenCalledWith({
        url: 'redis://localhost:6379',
        password: 'testpassword'
      });
      expect(mockClient.connect).toHaveBeenCalled();
      expect(mockClient.ping).toHaveBeenCalled();
      expect(mockClient.disconnect).toHaveBeenCalled();
    });

    it('should skip Redis check in non-production environment', async () => {
      process.env.NODE_ENV = 'development';

      const result = await checkRedisConnection();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Redis check skipped (non-production environment)');
    });

    it('should fail when REDIS_URL is missing in production', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.REDIS_URL;

      const result = await checkRedisConnection();

      expect(result.success).toBe(false);
      expect(result.message).toBe('REDIS_URL environment variable is required in production');
    });

    it('should handle Redis connection failure', async () => {
      process.env.NODE_ENV = 'production';
      process.env.REDIS_URL = 'redis://localhost:6379';

      const { createClient } = await import('redis');
      const mockClient = {
        connect: vi.fn().mockRejectedValue(new Error('Connection failed')),
        ping: vi.fn(),
        disconnect: vi.fn().mockResolvedValue(undefined)
      };
      (createClient as any).mockReturnValue(mockClient);

      const result = await checkRedisConnection();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to connect to Redis: Connection failed');
      expect(mockClient.disconnect).toHaveBeenCalled();
    });

    it('should handle Redis ping failure', async () => {
      process.env.NODE_ENV = 'production';
      process.env.REDIS_URL = 'redis://localhost:6379';

      const { createClient } = await import('redis');
      const mockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        ping: vi.fn().mockRejectedValue(new Error('Ping failed')),
        disconnect: vi.fn().mockResolvedValue(undefined)
      };
      (createClient as any).mockReturnValue(mockClient);

      const result = await checkRedisConnection();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Redis ping failed: Ping failed');
      expect(mockClient.disconnect).toHaveBeenCalled();
    });

    it('should use default password when REDIS_PASSWORD is not set', async () => {
      process.env.NODE_ENV = 'production';
      process.env.REDIS_URL = 'redis://localhost:6379';
      delete process.env.REDIS_PASSWORD;

      const { createClient } = await import('redis');
      const mockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        ping: vi.fn().mockResolvedValue('PONG'),
        disconnect: vi.fn().mockResolvedValue(undefined)
      };
      (createClient as any).mockReturnValue(mockClient);

      const result = await checkRedisConnection();

      expect(result.success).toBe(true);
      expect(createClient).toHaveBeenCalledWith({
        url: 'redis://localhost:6379',
        password: 'redispassword'
      });
    });
  });

  describe('validateProductionEnvironment', () => {
    it('should validate successful production environment', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'mongodb://localhost:27017/test';
      process.env.REDIS_URL = 'redis://localhost:6379';

      const { createClient } = await import('redis');
      const mockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        ping: vi.fn().mockResolvedValue('PONG'),
        disconnect: vi.fn().mockResolvedValue(undefined)
      };
      (createClient as any).mockReturnValue(mockClient);

      const result = await validateProductionEnvironment();

      expect(result.success).toBe(true);
      expect(result.checks).toHaveLength(2);
      expect(result.checks[0]?.name).toBe('Database URL');
      expect(result.checks[0]?.success).toBe(true);
      expect(result.checks[1]?.name).toBe('Redis Connection');
      expect(result.checks[1]?.success).toBe(true);
    });

    it('should skip validation in non-production environment', async () => {
      process.env.NODE_ENV = 'development';

      const result = await validateProductionEnvironment();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Environment validation skipped (non-production)');
      expect(result.checks).toHaveLength(0);
    });

    it('should fail when DATABASE_URL is missing in production', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.DATABASE_URL;
      process.env.REDIS_URL = 'redis://localhost:6379';

      const result = await validateProductionEnvironment();

      expect(result.success).toBe(false);
      const databaseCheck = result.checks.find(c => c.name === 'Database URL');
      expect(databaseCheck).toBeDefined();
      expect(databaseCheck!.success).toBe(false);
    });

    it('should fail when Redis connection fails in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'mongodb://localhost:27017/test';
      process.env.REDIS_URL = 'redis://localhost:6379';

      const { createClient } = await import('redis');
      const mockClient = {
        connect: vi.fn().mockRejectedValue(new Error('Connection failed')),
        ping: vi.fn(),
        disconnect: vi.fn().mockResolvedValue(undefined)
      };
      (createClient as any).mockReturnValue(mockClient);

      const result = await validateProductionEnvironment();

      expect(result.success).toBe(false);
      const redisCheck = result.checks.find(c => c.name === 'Redis Connection');
      expect(redisCheck).toBeDefined();
      expect(redisCheck!.success).toBe(false);
    });
  });
});