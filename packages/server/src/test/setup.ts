import { vi } from 'vitest';

/**
 * Create standard CRUD mock methods for a Prisma model
 * @returns Object with standard Prisma model methods
 */
function createModelMock() {
  return {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn()
  };
}

/**
 * Generate mock Prisma client with all models
 * @returns Mock Prisma client
 */
function createPrismaClientMock() {
  const models = [
    'user', 'session', 'encounter', 'participant', 'character', 
    'creature', 'party', 'lairAction', 'combatLog', 'subscription', 
    'usage', 'processedEvent', 'payment'
  ];

  const mockClient: any = {
    $disconnect: vi.fn(),
    $connect: vi.fn()
  };

  // Add all models with standard CRUD methods
  models.forEach(model => {
    mockClient[model] = createModelMock();
  });

  return mockClient;
}

// Mock Prisma Client globally
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => createPrismaClientMock()),
  SubscriptionTier: {
    FREE: 'FREE',
    BASIC: 'BASIC',
    PREMIUM: 'PREMIUM',
    PRO: 'PRO',
    ENTERPRISE: 'ENTERPRISE'
  },
  CreatureSize: {
    TINY: 'TINY',
    SMALL: 'SMALL',
    MEDIUM: 'MEDIUM',
    LARGE: 'LARGE',
    HUGE: 'HUGE',
    GARGANTUAN: 'GARGANTUAN'
  },
  ParticipantType: {
    CHARACTER: 'CHARACTER',
    CREATURE: 'CREATURE'
  },
  EncounterStatus: {
    PLANNING: 'PLANNING',
    ACTIVE: 'ACTIVE',
    COMPLETED: 'COMPLETED'
  }
}));

// Mock environment variables
process.env.DATABASE_URL = 'test://localhost:5432/test';
process.env.NODE_ENV = 'test';

// Global test utilities
interface MockUser {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface MockSession {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  // eslint-disable-next-line no-var
  var createMockUser: () => MockUser;
  // eslint-disable-next-line no-var
  var createMockSession: () => MockSession;
}

global.createMockUser = (): MockUser => ({
  id: 'user_123',
  email: 'test@example.com',
  username: 'testuser',
  passwordHash: 'hashed_password',
  failedLoginAttempts: 0,
  lockedUntil: null,
  createdAt: new Date(),
  updatedAt: new Date()
});

global.createMockSession = (): MockSession => ({
  id: 'session_123',
  userId: 'user_123',
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  updatedAt: new Date()
});