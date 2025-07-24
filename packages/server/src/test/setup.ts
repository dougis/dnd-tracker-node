import { vi } from 'vitest';

// Create mock data functions first
const createMockUser = () => ({
  id: 'user_123',
  email: 'test@example.com',
  username: 'testuser',
  passwordHash: 'hashed_password',
  failedLoginAttempts: 0,
  lockedUntil: null,
  isEmailVerified: false,
  createdAt: new Date(),
  updatedAt: new Date()
});

const createMockSession = () => ({
  id: 'session_123',
  userId: 'user_123',
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  updatedAt: new Date()
});

const createMockCreature = () => ({
  id: 'creature_123',
  userId: null,
  name: 'Test Creature',
  size: 'Medium',
  type: 'Humanoid',
  ac: 15,
  hp: 50,
  speed: 30,
  createdAt: new Date(),
  updatedAt: new Date()
});

const createMockProcessedEvent = () => ({
  id: 'event_123',
  eventId: 'evt_stripe_123456',
  source: 'stripe',
  createdAt: new Date(),
  updatedAt: new Date()
});

// Mock Prisma Client globally
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    user: {
      create: vi.fn().mockResolvedValue(createMockUser()),
      findUnique: vi.fn().mockResolvedValue(createMockUser()),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue(createMockUser()),
      delete: vi.fn().mockResolvedValue(createMockUser()),
      count: vi.fn().mockResolvedValue(0)
    },
    session: {
      create: vi.fn().mockResolvedValue(createMockSession()),
      findUnique: vi.fn().mockResolvedValue(createMockSession()),
      findMany: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(createMockSession()),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 })
    },
    party: {
      create: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
      count: vi.fn().mockResolvedValue(0)
    },
    character: {
      create: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
      count: vi.fn().mockResolvedValue(0)
    },
    encounter: {
      create: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
      count: vi.fn().mockResolvedValue(0)
    },
    participant: {
      create: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
      count: vi.fn().mockResolvedValue(0)
    },
    creature: {
      create: vi.fn().mockResolvedValue(createMockCreature()),
      findUnique: vi.fn().mockResolvedValue(createMockCreature()),
      findMany: vi.fn().mockResolvedValue([createMockCreature()]),
      update: vi.fn().mockResolvedValue(createMockCreature()),
      delete: vi.fn().mockResolvedValue(createMockCreature()),
      count: vi.fn().mockResolvedValue(5)
    },
    subscription: {
      create: vi.fn().mockResolvedValue({ id: 'sub_123', tier: 'FREE' }),
      findUnique: vi.fn().mockResolvedValue({ id: 'sub_123', tier: 'FREE' }),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({ id: 'sub_123', tier: 'FREE' }),
      delete: vi.fn().mockResolvedValue({ id: 'sub_123', tier: 'FREE' }),
      count: vi.fn().mockResolvedValue(0)
    },
    usage: {
      create: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
      count: vi.fn().mockResolvedValue(0)
    },
    payment: {
      create: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
      count: vi.fn().mockResolvedValue(0)
    },
    processedEvent: {
      create: vi.fn().mockResolvedValue(createMockProcessedEvent()),
      findUnique: vi.fn().mockResolvedValue(createMockProcessedEvent()),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue(createMockProcessedEvent()),
      delete: vi.fn().mockResolvedValue(createMockProcessedEvent()),
      count: vi.fn().mockResolvedValue(0)
    },
    lairAction: {
      create: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
      count: vi.fn().mockResolvedValue(0)
    },
    combatLog: {
      create: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
      count: vi.fn().mockResolvedValue(0)
    },
    $disconnect: vi.fn().mockResolvedValue(undefined)
  }))
}));

// Mock environment variables
process.env.DATABASE_URL = 'mongodb://localhost:27017/dnd_tracker_test';
process.env.NODE_ENV = 'test';

// Global test utilities for global access
declare global {
  // eslint-disable-next-line no-var
  var createMockUser: () => ReturnType<typeof createMockUser>;
  // eslint-disable-next-line no-var
  var createMockSession: () => ReturnType<typeof createMockSession>;
}

global.createMockUser = createMockUser;
global.createMockSession = createMockSession;