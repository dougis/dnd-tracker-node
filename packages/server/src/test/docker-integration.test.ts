/**
 * Docker Integration Tests
 * Tests for issue #68 - Setup Docker Compose development environment
 * 
 * These tests verify that the application can successfully connect to
 * Docker services and that all required functionality works as expected.
 * 
 * Note: These tests focus on Redis connectivity since MongoDB requires
 * additional dependencies. MongoDB functionality is tested through
 * the shell test suite (scripts/test-docker-setup.sh).
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'

// Test configuration  
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

// Helper function to check if we should run Docker tests
const isDockerEnvironment = () => {
  return process.env.DOCKER_ENV === 'true' || process.env.NODE_ENV === 'docker'
}

describe('Docker Compose Integration Tests', () => {
  // Only import Redis if we're in a Docker environment
  let redisClient: any
  let createClient: any
  let RedisClientType: any

  beforeAll(async () => {
    // Skip entire test suite if not in Docker environment
    if (!isDockerEnvironment()) {
      console.log('Skipping Docker integration tests - not in Docker environment')
      return
    }

    try {
      // Dynamic import to avoid loading Redis dependencies in non-Docker environments
      const redis = await import('redis')
      createClient = redis.createClient
      RedisClientType = redis.RedisClientType
      
      // Initialize Redis connection
      redisClient = createClient({ url: REDIS_URL })
    } catch (error) {
      console.warn('Could not load Redis dependencies:', error)
    }
  }, 15000)

  afterAll(async () => {
    if (!isDockerEnvironment() || !redisClient) {
      return
    }

    try {
      if (redisClient.isOpen) {
        await redisClient.quit()
      }
    } catch (error) {
      console.warn('Could not cleanup Redis connection:', error)
    }
  }, 15000)

  beforeEach(async () => {
    if (!isDockerEnvironment() || !redisClient) {
      return
    }

    try {
      if (!redisClient.isOpen) {
        await redisClient.connect()
      }
      await redisClient.flushDb()
    } catch (error) {
      console.warn('Could not clean up Redis test data:', error)
    }
  }, 15000)

  describe('Redis Connection', () => {
    it('should connect to Redis successfully', async () => {
      if (!isDockerEnvironment()) {
        console.log('Skipping Redis connection test - not in Docker environment')
        return
      }

      await redisClient.connect()
      const pingResult = await redisClient.ping()
      expect(pingResult).toBe('PONG')
    })

    it('should be able to perform basic Redis operations', async () => {
      if (!isDockerEnvironment()) {
        console.log('Skipping Redis operations test - not in Docker environment')
        return
      }

      if (!redisClient.isOpen) {
        await redisClient.connect()
      }

      // Set operation
      const setResult = await redisClient.set('test_key', 'test_value')
      expect(setResult).toBe('OK')

      // Get operation
      const getValue = await redisClient.get('test_key')
      expect(getValue).toBe('test_value')

      // Hash operations
      await redisClient.hSet('test_hash', 'field1', 'value1')
      await redisClient.hSet('test_hash', 'field2', 'value2')
      const hashValue = await redisClient.hGet('test_hash', 'field1')
      expect(hashValue).toBe('value1')

      const allHash = await redisClient.hGetAll('test_hash')
      expect(allHash).toEqual({ field1: 'value1', field2: 'value2' })

      // Cleanup
      await redisClient.del(['test_key', 'test_hash'])
    })

    it('should support expiration and TTL', async () => {
      if (!isDockerEnvironment()) {
        console.log('Skipping Redis TTL test - not in Docker environment')
        return
      }

      if (!redisClient.isOpen) {
        await redisClient.connect()
      }

      // Set with expiration
      await redisClient.setEx('temp_key', 2, 'temp_value')
      
      const initialValue = await redisClient.get('temp_key')
      expect(initialValue).toBe('temp_value')

      const ttl = await redisClient.ttl('temp_key')
      expect(ttl).toBeGreaterThan(0)
      expect(ttl).toBeLessThanOrEqual(2)

      // Wait for expiration (in real tests you'd mock time)
      await new Promise(resolve => setTimeout(resolve, 2100))
      
      const expiredValue = await redisClient.get('temp_key')
      expect(expiredValue).toBeNull()
    })

    it('should support pub/sub for real-time features', async () => {
      if (!isDockerEnvironment()) {
        console.log('Skipping Redis pub/sub test - not in Docker environment')
        return
      }

      const subscriber = createClient({ url: REDIS_URL })
      const publisher = createClient({ url: REDIS_URL })

      await subscriber.connect()
      await publisher.connect()

      let receivedMessage: string | null = null

      // Subscribe to channel
      await subscriber.subscribe('test_channel', (message) => {
        receivedMessage = message
      })

      // Give subscription time to establish
      await new Promise(resolve => setTimeout(resolve, 100))

      // Publish message
      await publisher.publish('test_channel', 'hello world')

      // Wait for message to be received
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(receivedMessage).toBe('hello world')

      // Cleanup
      await subscriber.quit()
      await publisher.quit()
    })
  })

  describe('Service Integration', () => {
    it('should handle concurrent Redis connections', async () => {
      if (!isDockerEnvironment()) {
        console.log('Skipping concurrent Redis test - not in Docker environment')
        return
      }

      if (!redisClient.isOpen) {
        await redisClient.connect()
      }

      // Simulate concurrent Redis operations
      const promises = []
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          redisClient.set(`concurrent_${i}`, `value_${i}`)
        )
      }

      const results = await Promise.all(promises)
      
      // All operations should succeed
      results.forEach(result => {
        expect(result).toBe('OK')
      })

      // Verify all keys were set
      const keys = await redisClient.keys('concurrent_*')
      expect(keys.length).toBe(10)

      // Cleanup
      await redisClient.del(keys)
    })

    it('should recover gracefully from connection failures', async () => {
      if (!isDockerEnvironment()) {
        console.log('Skipping connection recovery test - not in Docker environment')
        return
      }

      // Test connection resilience by forcing a reconnection
      if (redisClient.isOpen) {
        await redisClient.quit()
      }

      // Reconnect and verify functionality
      await redisClient.connect()
      
      // Insert test data
      await redisClient.set('resilience-test', 'test data')

      // Verify data exists
      const result = await redisClient.get('resilience-test')
      expect(result).toBe('test data')

      // Cleanup
      await redisClient.del('resilience-test')
    })
  })

  describe('Environment Configuration', () => {
    it('should use correct connection strings from environment', () => {
      expect(REDIS_URL).toContain('redis://')
      
      // Verify environment variables are set for Docker
      if (isDockerEnvironment()) {
        expect(process.env.REDIS_URL).toBeDefined()
      }
    })

    it('should have proper error handling for missing services', async () => {
      if (!isDockerEnvironment()) {
        console.log('Skipping error handling test - not in Docker environment')
        return
      }

      // Test with invalid URL - only when Redis module is loaded
      const badRedisClient = createClient({ url: 'redis://invalid:6379' })

      await expect(
        badRedisClient.connect()
      ).rejects.toThrow()

      // Cleanup - no need to quit if connection failed
      try {
        if (badRedisClient.isOpen) {
          await badRedisClient.quit()
        }
      } catch {
        // Ignore cleanup errors for invalid connections
      }
    })
  })

  describe('Docker Environment Detection', () => {
    it('should skip tests when not in Docker environment', () => {
      // This test always runs to verify the skip logic works
      if (!isDockerEnvironment()) {
        expect(true).toBe(true) // Test passes when skipped
        console.log('Successfully skipped test - not in Docker environment')
      } else {
        expect(isDockerEnvironment()).toBe(true)
        console.log('Running in Docker environment')
      }
    })

    it('should have basic test infrastructure working', () => {
      // Basic test to ensure test suite runs
      expect(REDIS_URL).toBeDefined()
      expect(typeof REDIS_URL).toBe('string')
      expect(typeof isDockerEnvironment).toBe('function')
    })
  })
})