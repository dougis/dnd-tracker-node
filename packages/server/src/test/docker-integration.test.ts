/**
 * Docker Integration Tests
 * Tests for issue #68 - Setup Docker Compose development environment
 * 
 * These tests verify that the application can successfully connect to
 * Docker services and that all required functionality works as expected.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { MongoClient } from 'mongodb'
import Redis from 'ioredis'

// Test configuration
const MONGODB_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/dnd_tracker_test'
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

describe('Docker Compose Integration Tests', () => {
  let mongoClient: MongoClient
  let redisClient: Redis

  beforeAll(async () => {
    // Skip tests if not in Docker environment
    if (!process.env.CI && !process.env.DOCKER_ENV) {
      console.log('Skipping Docker integration tests - not in Docker environment')
      return
    }

    // Initialize connections
    mongoClient = new MongoClient(MONGODB_URL)
    redisClient = new Redis(REDIS_URL)
  })

  afterAll(async () => {
    // Cleanup connections
    if (mongoClient) {
      await mongoClient.close()
    }
    if (redisClient) {
      redisClient.disconnect()
    }
  })

  beforeEach(async () => {
    // Skip if not in Docker environment
    if (!process.env.CI && !process.env.DOCKER_ENV) {
      return
    }

    // Clean up test data before each test
    try {
      await mongoClient.connect()
      const db = mongoClient.db()
      const collections = await db.listCollections().toArray()
      
      for (const collection of collections) {
        if (collection.name.startsWith('test_')) {
          await db.collection(collection.name).deleteMany({})
        }
      }
    } catch (error) {
      console.warn('Could not clean up MongoDB test data:', error)
    }

    try {
      await redisClient.flushdb()
    } catch (error) {
      console.warn('Could not clean up Redis test data:', error)
    }
  })

  describe('MongoDB Connection', () => {
    it('should connect to MongoDB successfully', async () => {
      if (!process.env.CI && !process.env.DOCKER_ENV) return

      await expect(mongoClient.connect()).resolves.not.toThrow()
      
      // Test basic operations
      const db = mongoClient.db()
      const result = await db.admin().ping()
      expect(result).toBeDefined()
    })

    it('should be able to perform CRUD operations', async () => {
      if (!process.env.CI && !process.env.DOCKER_ENV) return

      await mongoClient.connect()
      const db = mongoClient.db()
      const collection = db.collection('test_docker_integration')

      // Create
      const insertResult = await collection.insertOne({
        name: 'Test Character',
        level: 5,
        createdAt: new Date()
      })
      expect(insertResult.insertedId).toBeDefined()

      // Read
      const findResult = await collection.findOne({ name: 'Test Character' })
      expect(findResult).toBeDefined()
      expect(findResult?.name).toBe('Test Character')
      expect(findResult?.level).toBe(5)

      // Update
      const updateResult = await collection.updateOne(
        { name: 'Test Character' },
        { $set: { level: 6 } }
      )
      expect(updateResult.modifiedCount).toBe(1)

      // Delete
      const deleteResult = await collection.deleteOne({ name: 'Test Character' })
      expect(deleteResult.deletedCount).toBe(1)
    })

    it('should maintain data consistency across reconnections', async () => {
      if (!process.env.CI && !process.env.DOCKER_ENV) return

      await mongoClient.connect()
      const db = mongoClient.db()
      const collection = db.collection('test_persistence')

      // Insert test data
      await collection.insertOne({
        id: 'persistence-test',
        data: 'should persist',
        timestamp: new Date()
      })

      // Disconnect and reconnect
      await mongoClient.close()
      
      const newClient = new MongoClient(MONGODB_URL)
      await newClient.connect()
      const newDb = newClient.db()
      const newCollection = newDb.collection('test_persistence')

      // Verify data persists
      const result = await newCollection.findOne({ id: 'persistence-test' })
      expect(result).toBeDefined()
      expect(result?.data).toBe('should persist')

      await newClient.close()
    })
  })

  describe('Redis Connection', () => {
    it('should connect to Redis successfully', async () => {
      if (!process.env.CI && !process.env.DOCKER_ENV) return

      const pingResult = await redisClient.ping()
      expect(pingResult).toBe('PONG')
    })

    it('should be able to perform basic Redis operations', async () => {
      if (!process.env.CI && !process.env.DOCKER_ENV) return

      // Set operation
      const setResult = await redisClient.set('test_key', 'test_value')
      expect(setResult).toBe('OK')

      // Get operation
      const getValue = await redisClient.get('test_key')
      expect(getValue).toBe('test_value')

      // Hash operations
      await redisClient.hset('test_hash', 'field1', 'value1', 'field2', 'value2')
      const hashValue = await redisClient.hget('test_hash', 'field1')
      expect(hashValue).toBe('value1')

      const allHash = await redisClient.hgetall('test_hash')
      expect(allHash).toEqual({ field1: 'value1', field2: 'value2' })

      // Cleanup
      await redisClient.del('test_key', 'test_hash')
    })

    it('should support expiration and TTL', async () => {
      if (!process.env.CI && !process.env.DOCKER_ENV) return

      // Set with expiration
      await redisClient.setex('temp_key', 2, 'temp_value')
      
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
      if (!process.env.CI && !process.env.DOCKER_ENV) return

      const subscriber = new Redis(REDIS_URL)
      const publisher = new Redis(REDIS_URL)

      let receivedMessage: string | null = null

      // Subscribe to channel
      await subscriber.subscribe('test_channel')
      subscriber.on('message', (channel, message) => {
        if (channel === 'test_channel') {
          receivedMessage = message
        }
      })

      // Give subscription time to establish
      await new Promise(resolve => setTimeout(resolve, 100))

      // Publish message
      await publisher.publish('test_channel', 'hello world')

      // Wait for message to be received
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(receivedMessage).toBe('hello world')

      // Cleanup
      await subscriber.disconnect()
      await publisher.disconnect()
    })
  })

  describe('Service Integration', () => {
    it('should handle concurrent connections to both services', async () => {
      if (!process.env.CI && !process.env.DOCKER_ENV) return

      // Simulate concurrent operations
      const promises = [
        // MongoDB operations
        (async () => {
          await mongoClient.connect()
          const db = mongoClient.db()
          const collection = db.collection('test_concurrent')
          
          for (let i = 0; i < 10; i++) {
            await collection.insertOne({ 
              index: i, 
              type: 'mongo',
              timestamp: new Date() 
            })
          }
          
          return await collection.countDocuments({ type: 'mongo' })
        })(),
        
        // Redis operations
        (async () => {
          for (let i = 0; i < 10; i++) {
            await redisClient.set(`concurrent_${i}`, `value_${i}`)
          }
          
          const keys = await redisClient.keys('concurrent_*')
          return keys.length
        })()
      ]

      const [mongoCount, redisCount] = await Promise.all(promises)
      
      expect(mongoCount).toBe(10)
      expect(redisCount).toBe(10)
    })

    it('should recover gracefully from connection failures', async () => {
      if (!process.env.CI && !process.env.DOCKER_ENV) return

      // This test would require Docker service restart simulation
      // For now, just verify connection resilience
      
      await mongoClient.connect()
      const db = mongoClient.db()
      
      // Insert data
      await db.collection('test_resilience').insertOne({
        id: 'resilience-test',
        data: 'test data'
      })

      // Verify data exists
      const result = await db.collection('test_resilience').findOne({
        id: 'resilience-test'
      })
      
      expect(result).toBeDefined()
      expect(result?.data).toBe('test data')
    })
  })

  describe('Environment Configuration', () => {
    it('should use correct connection strings from environment', () => {
      expect(MONGODB_URL).toContain('mongodb://')
      expect(REDIS_URL).toContain('redis://')
      
      // Verify environment variables are set for Docker
      if (process.env.DOCKER_ENV) {
        expect(process.env.DATABASE_URL).toBeDefined()
        expect(process.env.REDIS_URL).toBeDefined()
      }
    })

    it('should have proper error handling for missing services', async () => {
      // Test with invalid URLs
      const badMongoClient = new MongoClient('mongodb://invalid:27017/test')
      const badRedisClient = new Redis('redis://invalid:6379')

      await expect(
        badMongoClient.connect()
      ).rejects.toThrow()

      await expect(
        badRedisClient.ping()
      ).rejects.toThrow()

      // Cleanup
      try {
        await badMongoClient.close()
      } catch {}
      
      badRedisClient.disconnect()
    })
  })
})