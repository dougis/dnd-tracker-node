import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { EncounterService } from './EncounterService';

// Create mock Prisma client
const mockPrisma = {
  encounter: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  participant: {
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
} as unknown as PrismaClient;

describe('EncounterService', () => {
  let encounterService: EncounterService;

  beforeEach(() => {
    encounterService = new EncounterService(mockPrisma);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createEncounter', () => {
    it('should create a new encounter with valid data', async () => {
      const mockEncounter = {
        id: '674f1234567890abcdef1234',
        userId: '674f1234567890abcdef5678',
        name: 'Dragon Fight',
        description: 'An epic battle with a red dragon',
        status: 'PLANNING',
        round: 1,
        turn: 0,
        isActive: false,
        participants: [],
        lairActions: null,
        combatLogs: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.encounter.create = vi.fn().mockResolvedValue(mockEncounter);

      const result = await encounterService.createEncounter(
        '674f1234567890abcdef5678',
        'Dragon Fight',
        'An epic battle with a red dragon'
      );

      expect(mockPrisma.encounter.create).toHaveBeenCalledWith({
        data: {
          userId: '674f1234567890abcdef5678',
          name: 'Dragon Fight',
          description: 'An epic battle with a red dragon',
          status: 'PLANNING',
          round: 1,
          turn: 0,
          isActive: false,
        },
        include: {
          participants: {
            include: {
              character: true,
              creature: true,
            },
          },
          lairActions: true,
        },
      });

      expect(result).toEqual(mockEncounter);
    });

    it('should throw error for invalid userId', async () => {
      await expect(
        encounterService.createEncounter('', 'Test Encounter')
      ).rejects.toThrow('User ID is required');
    });

    it('should throw error for empty name', async () => {
      await expect(
        encounterService.createEncounter('674f1234567890abcdef5678', '')
      ).rejects.toThrow('Encounter name is required');
    });

    it('should throw error for name longer than 100 characters', async () => {
      const longName = 'a'.repeat(101);
      await expect(
        encounterService.createEncounter('674f1234567890abcdef5678', longName)
      ).rejects.toThrow('Encounter name must be 100 characters or less');
    });
  });

  describe('getEncounterById', () => {
    it('should return encounter by id', async () => {
      const mockEncounter = {
        id: '674f1234567890abcdef1234',
        userId: '674f1234567890abcdef5678',
        name: 'Dragon Fight',
        participants: [],
        lairActions: null,
      };

      mockPrisma.encounter.findUnique = vi.fn().mockResolvedValue(mockEncounter);

      const result = await encounterService.getEncounterById('674f1234567890abcdef1234');

      expect(mockPrisma.encounter.findUnique).toHaveBeenCalledWith({
        where: { id: '674f1234567890abcdef1234' },
        include: {
          participants: {
            include: {
              character: true,
              creature: true,
            },
          },
          lairActions: true,
        },
      });

      expect(result).toEqual(mockEncounter);
    });

    it('should return null if encounter not found', async () => {
      mockPrisma.encounter.findUnique = vi.fn().mockResolvedValue(null);

      const result = await encounterService.getEncounterById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('getUserEncounters', () => {
    it('should return all encounters for a user', async () => {
      const mockEncounters = [
        {
          id: '674f1234567890abcdef1234',
          name: 'Dragon Fight',
          status: 'PLANNING',
        },
        {
          id: '674f1234567890abcdef5678',
          name: 'Goblin Ambush',
          status: 'ACTIVE',
        },
      ];

      mockPrisma.encounter.findMany = vi.fn().mockResolvedValue(mockEncounters);

      const result = await encounterService.getUserEncounters('674f1234567890abcdef5678');

      expect(mockPrisma.encounter.findMany).toHaveBeenCalledWith({
        where: { userId: '674f1234567890abcdef5678' },
        include: {
          participants: {
            include: {
              character: true,
              creature: true,
            },
          },
          lairActions: true,
        },
        orderBy: { updatedAt: 'desc' },
      });

      expect(result).toEqual(mockEncounters);
    });
  });
});