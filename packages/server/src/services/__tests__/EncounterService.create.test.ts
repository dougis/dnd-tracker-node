import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EncounterService } from '../EncounterService';
import { createMockPrisma } from './EncounterService.helpers';
import { ServiceTestPatterns } from '../../utils/TestPatterns';

describe('EncounterService - Create Operations', () => {
  let encounterService: EncounterService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    encounterService = new EncounterService(mockPrisma as any);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createEncounter', () => {
    const validUserId = 'user123';
    const validName = 'Epic Boss Fight';
    const validDescription = 'A challenging encounter';
    const mockEncounter = {
      id: 'encounter123',
      userId: validUserId,
      name: validName,
      description: validDescription,
      status: 'PLANNING',
      round: 1,
      turn: 0,
      isActive: false,
      participants: [],
      lairActions: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should create encounter successfully with name and description', async () => {
      mockPrisma.encounter.create.mockResolvedValue(mockEncounter);

      const result = await encounterService.createEncounter(validUserId, validName, validDescription);

      expect(result).toEqual(mockEncounter);
      expect(mockPrisma.encounter.create).toHaveBeenCalledWith({
        data: {
          userId: validUserId,
          name: validName,
          description: validDescription,
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
    });

    it('should create encounter successfully with name only', async () => {
      const encounterWithoutDescription = { ...mockEncounter, description: null };
      mockPrisma.encounter.create.mockResolvedValue(encounterWithoutDescription);

      const result = await encounterService.createEncounter(validUserId, validName);

      expect(result).toEqual(encounterWithoutDescription);
      expect(mockPrisma.encounter.create).toHaveBeenCalledWith({
        data: {
          userId: validUserId,
          name: validName,
          description: null,
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
    });

    it('should trim name and description whitespace', async () => {
      const nameWithSpaces = '  Epic Boss Fight  ';
      const descriptionWithSpaces = '  A challenging encounter  ';
      mockPrisma.encounter.create.mockResolvedValue(mockEncounter);

      await encounterService.createEncounter(validUserId, nameWithSpaces, descriptionWithSpaces);

      expect(mockPrisma.encounter.create).toHaveBeenCalledWith({
        data: {
          userId: validUserId,
          name: 'Epic Boss Fight',
          description: 'A challenging encounter',
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
    });

    it('should handle empty description', async () => {
      const encounterWithoutDescription = { ...mockEncounter, description: null };
      mockPrisma.encounter.create.mockResolvedValue(encounterWithoutDescription);

      await encounterService.createEncounter(validUserId, validName, '');

      expect(mockPrisma.encounter.create).toHaveBeenCalledWith({
        data: {
          userId: validUserId,
          name: validName,
          description: null,
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
    });

    it('should reject missing user ID', async () => {
      await expect(encounterService.createEncounter('', validName, validDescription))
        .rejects.toThrow('User ID is required');
    });

    it('should reject missing name', async () => {
      await expect(encounterService.createEncounter(validUserId, '', validDescription))
        .rejects.toThrow('Encounter name is required');
    });

    it('should reject whitespace-only name', async () => {
      await expect(encounterService.createEncounter(validUserId, '   ', validDescription))
        .rejects.toThrow('Encounter name is required');
    });

    it('should reject name longer than 100 characters', async () => {
      const longName = 'a'.repeat(101);
      await expect(encounterService.createEncounter(validUserId, longName, validDescription))
        .rejects.toThrow('Encounter name must be 100 characters or less');
    });

    it('should handle database error', async () => {
      mockPrisma.encounter.create.mockRejectedValue(new Error('Database error'));

      await expect(encounterService.createEncounter(validUserId, validName, validDescription))
        .rejects.toThrow('Database error');
    });
  });
});