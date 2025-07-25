import { PrismaClient } from '@prisma/client';
import { MockDataFactory } from '../../utils/MockDataFactory';
import { PrismaMockFactory } from '../../utils/PrismaMockFactory';

// Re-export factory methods for character-specific testing
export const createMockParty = (overrides = {}) => MockDataFactory.createParty(overrides);
export const createMockCharacter = (overrides = {}) => MockDataFactory.createCharacter(overrides);

// Character-specific test data utilities
export const createDefaultAbilities = () => ({
  str: 10,
  dex: 10,
  con: 10,
  int: 10,
  wis: 10,
  cha: 10
});

export const createExpectedDefaultData = () => ({
  level: 1,
  ac: 10,
  maxHp: 10,
  currentHp: 10,
  tempHp: 0,
  speed: 30,
  abilities: createDefaultAbilities(),
  proficiencyBonus: 2,
  features: [],
  equipment: [],
  playerName: null,
  hitDice: null,
  notes: null
});

// Create mock Prisma client with character and party support
export const createMockPrisma = () => PrismaMockFactory.combineMocks(
  PrismaMockFactory.createWithPresetBehaviors('party', {}),
  PrismaMockFactory.createWithPresetBehaviors('character', {})
) as unknown as PrismaClient;