import { vi } from 'vitest';

// Track created entities to simulate unique constraints
const createdUsers = new Set<string>();
const createdEvents = new Set<string>();

// Create mock data functions first
const createMockUser = () => ({
  id: 'user_123',
  email: 'test@example.com',
  username: 'testuser',
  passwordHash: 'hashed_password',
  failedLoginAttempts: 0,
  lockedUntil: null,
  isEmailVerified: false,
  isAdmin: false,
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

const createMockCreature = (overrides = {}) => ({
  id: 'creature_123',
  userId: null,
  name: 'Test Creature',
  size: 'HUGE',
  type: 'Humanoid',
  ac: 15,
  hp: 50,
  speed: { walk: 30 },
  abilities: { str: 14, dex: 12, con: 12, int: 2, wis: 10, cha: 6 },
  actions: [],
  traits: [],
  reactions: [],
  lairActions: [],
  tags: [],
  isTemplate: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
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
      create: vi.fn().mockImplementation((data) => {
        const email = data.data.email;
        const username = data.data.username;
        
        // Simulate unique constraint violation
        if (createdUsers.has(email) || createdUsers.has(username)) {
          return Promise.reject(new Error('Unique constraint violation'));
        }
        
        createdUsers.add(email);
        createdUsers.add(username);
        
        const mockUser = createMockUser();
        return Promise.resolve({
          ...mockUser,
          ...data.data,
          id: mockUser.id
        });
      }),
      findUnique: vi.fn().mockImplementation((query) => {
        const user = createMockUser();
        if (query.include?.creatures) {
          return Promise.resolve({
            ...user,
            creatures: [createMockCreature({ name: 'Custom Beast', userId: user.id })]
          });
        }
        return Promise.resolve(user);
      }),
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
      create: vi.fn().mockImplementation((data) => {
        const mockCreature = createMockCreature();
        return Promise.resolve({
          ...mockCreature,
          ...data.data,
          id: mockCreature.id
        });
      }),
      findUnique: vi.fn().mockResolvedValue(createMockCreature()),
      findMany: vi.fn().mockResolvedValue([
        createMockCreature({ name: 'Goblin', size: 'SMALL', type: 'humanoid' }),
        createMockCreature({ name: 'Orc', size: 'MEDIUM', type: 'humanoid' }),
        createMockCreature({ name: 'Troll', size: 'LARGE', type: 'giant' }),
        createMockCreature({ name: 'Dragon', size: 'HUGE', type: 'dragon' }),
        createMockCreature({ name: 'Tarrasque', size: 'GARGANTUAN', type: 'monstrosity' })
      ]),
      update: vi.fn().mockResolvedValue(createMockCreature()),
      delete: vi.fn().mockResolvedValue(createMockCreature()),
      count: vi.fn().mockResolvedValue(5)
    },
    subscription: {
      create: vi.fn().mockImplementation((data) => {
        const tier = data.data?.tier || 'EXPERT';
        return Promise.resolve({ id: 'sub_123', tier, ...data.data });
      }),
      findUnique: vi.fn().mockResolvedValue({ id: 'sub_123', tier: 'EXPERT' }),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({ id: 'sub_123', tier: 'EXPERT' }),
      delete: vi.fn().mockResolvedValue({ id: 'sub_123', tier: 'EXPERT' }),
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
      create: vi.fn().mockImplementation((data) => {
        const eventId = data.data.eventId;
        
        // Simulate unique constraint violation on eventId
        if (createdEvents.has(eventId)) {
          return Promise.reject(new Error('Unique constraint violation'));
        }
        
        createdEvents.add(eventId);
        
        const mockEvent = createMockProcessedEvent();
        return Promise.resolve({
          ...mockEvent,
          ...data.data,
          id: mockEvent.id
        });
      }),
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

// Reset mock state before each test
import { beforeEach } from 'vitest';
beforeEach(() => {
  createdUsers.clear();
  createdEvents.clear();
});

// Export test utilities for direct imports instead of global access
export { createMockUser, createMockSession };