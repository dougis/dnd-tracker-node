import { vi } from 'vitest';

export function createMockPrisma() {
  return {
    encounter: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    participant: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
}

export const mockEncounterData = {
  id: 'encounter123',
  userId: 'user123',
  name: 'Test Encounter',
  description: 'Test description',
  status: 'PLANNING' as const,
  round: 1,
  turn: 0,
  isActive: false,
  participants: [],
  lairActions: null,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z')
};

export const mockParticipantData = {
  id: 'participant123',
  encounterId: 'encounter123',
  type: 'CHARACTER' as const,
  characterId: 'character123',
  creatureId: null,
  name: 'Test Character',
  initiative: 15,
  initiativeRoll: 12,
  currentHp: 25,
  maxHp: 30,
  tempHp: 5,
  ac: 16,
  conditions: [],
  notes: 'Test notes',
  isActive: true,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z')
};