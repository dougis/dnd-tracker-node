import { PrismaClient } from '@prisma/client';
import { MockDataFactory } from '../../utils/MockDataFactory';
import { PrismaMockFactory } from '../../utils/PrismaMockFactory';

// Re-export factory methods for party-specific testing
export const createMockParty = (overrides = {}) => MockDataFactory.createParty(overrides);

// Create mock Prisma client with party-specific focus
export const createMockPrisma = () => PrismaMockFactory.combineMocks(
  PrismaMockFactory.createWithPresetBehaviors('party', {})
) as unknown as PrismaClient;