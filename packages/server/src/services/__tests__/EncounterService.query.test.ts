import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EncounterService } from '../EncounterService';
import { createMockPrisma, mockEncounterData } from './EncounterService.helpers';

describe('EncounterService - Query Operations', () => {
  let encounterService: EncounterService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    encounterService = new EncounterService(mockPrisma);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getEncounterById', () => {
    it('should return encounter when found', async () => {
      mockPrisma.encounter.findUnique.mockResolvedValue(mockEncounterData);

      const result = await encounterService.getEncounterById('encounter123');

      expect(result).toEqual(mockEncounterData);
      expect(mockPrisma.encounter.findUnique).toHaveBeenCalledWith({
        where: { id: 'encounter123' },
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

    it('should return null when encounter not found', async () => {
      mockPrisma.encounter.findUnique.mockResolvedValue(null);

      const result = await encounterService.getEncounterById('nonexistent');

      expect(result).toBeNull();
      expect(mockPrisma.encounter.findUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistent' },
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
  });

  describe('getUserEncounters', () => {
    it('should return all encounters for user', async () => {
      const userEncounters = [
        mockEncounterData,
        { ...mockEncounterData, id: 'encounter456', name: 'Second Encounter' }
      ];
      mockPrisma.encounter.findMany.mockResolvedValue(userEncounters);

      const result = await encounterService.getUserEncounters('user123');

      expect(result).toEqual(userEncounters);
      expect(mockPrisma.encounter.findMany).toHaveBeenCalledWith({
        where: { userId: 'user123' },
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
    });

    it('should return empty array when user has no encounters', async () => {
      mockPrisma.encounter.findMany.mockResolvedValue([]);

      const result = await encounterService.getUserEncounters('user123');

      expect(result).toEqual([]);
    });
  });
});