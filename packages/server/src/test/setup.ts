import { vi } from 'vitest';

// Mock Prisma Client globally
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    session: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn()
    },
    $disconnect: vi.fn()
  }))
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