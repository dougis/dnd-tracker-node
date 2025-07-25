import { vi } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Create mock data helpers
export const createMockParty = (overrides = {}) => ({
  id: 'party_123',
  userId: 'user_123',
  name: 'Test Party',
  description: 'Test party description',
  isArchived: false,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  ...overrides
});

// Create mock Prisma client with comprehensive mocking
export const createMockPrisma = () => ({
  party: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
} as unknown as PrismaClient);