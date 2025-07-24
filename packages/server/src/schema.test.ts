import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

// Test suite for Prisma schema validation and seeding
describe('Prisma Schema and Seeding Tests', () => {
  let prisma: PrismaClient;

  beforeEach(async () => {
    // Reset database before each test
    prisma = new PrismaClient();
    
    // Clear all collections for clean test state
    const models = [
      'user', 'processedEvent', 'session', 'subscription', 'usage',
      'party', 'character', 'encounter', 'participant', 'creature',
      'lairAction', 'combatLog', 'payment'
    ];

    for (const model of models) {
      try {
        await (prisma as any)[model].deleteMany({});
      } catch (error) {
        // Model might not exist yet, ignore
      }
    }
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('Schema Push', () => {
    it('should successfully run prisma db push', () => {
      expect(() => {
        execSync('npx prisma db push --accept-data-loss', { stdio: 'pipe' });
      }).not.toThrow();
    });

    it('should create all required collections', async () => {
      // Test that all main models exist by trying to query them
      const models = [
        'user',
        'processedEvent', 
        'session',
        'subscription',
        'usage',
        'party',
        'character',
        'encounter',
        'participant',
        'creature',
        'lairAction',
        'combatLog',
        'payment'
      ];

      for (const model of models) {
        await expect((prisma as any)[model].findMany()).resolves.toBeDefined();
      }
    });
  });

  describe('User Model', () => {
    it('should have required security fields for account lockout', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          username: 'testuser',
          passwordHash: 'hashedpassword',
          failedLoginAttempts: 3,
          lockedUntil: new Date(Date.now() + 1000 * 60 * 15) // 15 minutes
        }
      });

      expect(user.failedLoginAttempts).toBe(3);
      expect(user.lockedUntil).toBeInstanceOf(Date);
      expect(user.isEmailVerified).toBe(false); // default
      expect(user.isAdmin).toBe(false); // default
    });

    it('should enforce unique constraints on email and username', async () => {
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          username: 'testuser',
          passwordHash: 'hashedpassword'
        }
      });

      // Duplicate email should fail
      await expect(
        prisma.user.create({
          data: {
            email: 'test@example.com',
            username: 'different',
            passwordHash: 'hashedpassword'
          }
        })
      ).rejects.toThrow();

      // Duplicate username should fail  
      await expect(
        prisma.user.create({
          data: {
            email: 'different@example.com',
            username: 'testuser',
            passwordHash: 'hashedpassword'
          }
        })
      ).rejects.toThrow();
    });
  });

  describe('ProcessedEvent Model', () => {
    it('should support Stripe idempotency tracking', async () => {
      const event = await prisma.processedEvent.create({
        data: {
          eventId: 'evt_stripe_123456',
          source: 'stripe'
        }
      });

      expect(event.eventId).toBe('evt_stripe_123456');
      expect(event.source).toBe('stripe');
      expect(event.createdAt).toBeInstanceOf(Date);
    });

    it('should enforce unique constraint on eventId', async () => {
      await prisma.processedEvent.create({
        data: {
          eventId: 'evt_duplicate',
          source: 'stripe'
        }
      });

      await expect(
        prisma.processedEvent.create({
          data: {
            eventId: 'evt_duplicate',
            source: 'stripe'
          }
        })
      ).rejects.toThrow();
    });
  });

  describe('Creature Model', () => {
    it('should support system templates with null userId', async () => {
      const systemCreature = await prisma.creature.create({
        data: {
          userId: null, // System template
          name: 'Goblin',
          size: 'SMALL',
          type: 'humanoid',
          ac: 15,
          hp: 7,
          abilities: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
          speed: { walk: 30 },
          actions: [],
          traits: [],
          reactions: [],
          lairActions: [],
          tags: ['basic', 'monster']
        }
      });

      expect(systemCreature.userId).toBeNull();
      expect(systemCreature.isTemplate).toBe(true); // default
      expect(systemCreature.name).toBe('Goblin');
    });

    it('should support user-created creatures', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'dm@example.com',
          username: 'dm_user',
          passwordHash: 'hashedpassword'
        }
      });

      const userCreature = await prisma.creature.create({
        data: {
          userId: user.id,
          name: 'Custom Dragon',
          size: 'LARGE',
          type: 'dragon',
          ac: 18,
          hp: 200,
          abilities: { str: 20, dex: 12, con: 18, int: 16, wis: 14, cha: 18 },
          speed: { walk: 40, fly: 80 },
          actions: [],
          traits: [],
          reactions: [],
          lairActions: [],
          tags: ['custom']
        }
      });

      expect(userCreature.userId).toBe(user.id);
      expect(userCreature.name).toBe('Custom Dragon');
    });
  });

  describe('Database Seeding', () => {
    it('should execute npm run db:seed successfully', () => {
      expect(() => {
        execSync('npm run db:seed', { stdio: 'pipe' });
      }).not.toThrow();
    });

    it('should populate Creature table with at least 5 system templates', async () => {
      // Run seeding
      execSync('npm run db:seed', { stdio: 'pipe' });

      const systemCreatures = await prisma.creature.findMany({
        where: { userId: null }
      });

      expect(systemCreatures.length).toBeGreaterThanOrEqual(5);
      
      // Verify all creatures have required fields
      systemCreatures.forEach(creature => {
        expect(creature.name).toBeTruthy();
        expect(creature.size).toBeTruthy();
        expect(creature.type).toBeTruthy();
        expect(creature.ac).toBeGreaterThan(0);
        expect(creature.hp).toBeGreaterThan(0);
        expect(creature.abilities).toBeTruthy();
        expect(creature.speed).toBeTruthy();
        expect(creature.userId).toBeNull();
      });
    });

    it('should create diverse creature templates covering different sizes and types', async () => {
      execSync('npm run db:seed', { stdio: 'pipe' });

      const creatures = await prisma.creature.findMany({
        where: { userId: null }
      });

      // Check for size diversity
      const sizes = new Set(creatures.map(c => c.size));
      expect(sizes.size).toBeGreaterThan(1); // At least 2 different sizes

      // Check for type diversity  
      const types = new Set(creatures.map(c => c.type));
      expect(types.size).toBeGreaterThan(1); // At least 2 different types
    });
  });

  describe('Enum Validations', () => {
    it('should validate SubscriptionTier enum', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'sub@example.com',
          username: 'subuser',
          passwordHash: 'hashedpassword'
        }
      });

      const subscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          tier: 'EXPERT',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });

      expect(subscription.tier).toBe('EXPERT');
    });

    it('should validate CreatureSize enum', async () => {
      const creature = await prisma.creature.create({
        data: {
          name: 'Test Giant',
          size: 'HUGE',
          type: 'giant',
          ac: 15,
          hp: 100,
          abilities: { str: 20, dex: 8, con: 18, int: 8, wis: 10, cha: 8 },
          speed: { walk: 40 },
          actions: [],
          traits: [],
          reactions: [],
          lairActions: [],
          tags: []
        }
      });

      expect(creature.size).toBe('HUGE');
    });
  });

  describe('Relations and Cascading', () => {
    it('should support user to creature relationship', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'creator@example.com',
          username: 'creator',
          passwordHash: 'hashedpassword'
        }
      });

      await prisma.creature.create({
        data: {
          userId: user.id,
          name: 'Custom Beast',
          size: 'MEDIUM',
          type: 'beast',
          ac: 12,
          hp: 25,
          abilities: { str: 14, dex: 12, con: 12, int: 2, wis: 10, cha: 6 },
          speed: { walk: 30 },
          actions: [],
          traits: [],
          reactions: [],
          lairActions: [],
          tags: []
        }
      });

      const userWithCreatures = await prisma.user.findUnique({
        where: { id: user.id },
        include: { creatures: true }
      });

      expect(userWithCreatures!.creatures).toHaveLength(1);
      expect(userWithCreatures!.creatures![0]!.name).toBe('Custom Beast');
    });

    it('should support session cascading deletion', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'session@example.com',
          username: 'sessionuser',
          passwordHash: 'hashedpassword'
        }
      });

      await prisma.session.create({
        data: {
          userId: user.id,
          token: 'session_token_123',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });

      // Delete user should cascade to sessions
      await prisma.user.delete({ where: { id: user.id } });

      const sessions = await prisma.session.findMany({
        where: { userId: user.id }
      });

      expect(sessions).toHaveLength(0);
    });
  });
});