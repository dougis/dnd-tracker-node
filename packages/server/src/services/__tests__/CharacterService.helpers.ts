import { vi } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Create comprehensive mock data helpers
export const createMockParty = (overrides = {}) => ({
  id: 'party_123',
  userId: 'user_123',
  name: 'Test Party',
  description: 'Test party description',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

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

export const createMockCharacter = (overrides = {}) => ({
  id: 'char_123',
  partyId: 'party_123',
  name: 'Test Character',
  playerName: 'Test Player',
  race: 'Human',
  classes: [{ className: 'Fighter', level: 5 }],
  level: 5,
  ac: 16,
  maxHp: 45,
  currentHp: 45,
  tempHp: 0,
  hitDice: '5d10',
  speed: 30,
  abilities: {
    str: 16,
    dex: 14,
    con: 15,
    int: 12,
    wis: 13,
    cha: 11
  },
  proficiencyBonus: 3,
  features: ['Second Wind', 'Fighting Style'],
  equipment: ['Longsword', 'Chain Mail', 'Shield'],
  notes: 'Test character notes',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

// Create mock Prisma client with comprehensive mocking
export const createMockPrisma = () => ({
  party: {
    findFirst: vi.fn(),
  },
  character: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
} as unknown as PrismaClient);