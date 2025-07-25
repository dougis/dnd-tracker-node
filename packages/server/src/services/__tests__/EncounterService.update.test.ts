import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EncounterService } from '../EncounterService';
import { createMockPrisma, mockEncounterData } from './EncounterService.helpers';

describe('EncounterService - Update Operations', () => {
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

  describe('updateEncounter', () => {
    const encounterId = 'encounter123';
    const userId = 'user123';

    beforeEach(() => {
      // Mock ownership verification
      mockPrisma.encounter.findUnique.mockResolvedValue({ userId: 'user123' });
    });

    it('should update encounter name', async () => {
      const updatedEncounter = { ...mockEncounterData, name: 'Updated Name' };
      mockPrisma.encounter.update.mockResolvedValue(updatedEncounter);

      const result = await encounterService.updateEncounter(encounterId, userId, {
        name: 'Updated Name'
      });

      expect(result).toEqual(updatedEncounter);
      expect(mockPrisma.encounter.update).toHaveBeenCalledWith({
        where: { id: encounterId },
        data: { name: 'Updated Name' },
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

    it('should update encounter description', async () => {
      const updatedEncounter = { ...mockEncounterData, description: 'Updated description' };
      mockPrisma.encounter.update.mockResolvedValue(updatedEncounter);

      const result = await encounterService.updateEncounter(encounterId, userId, {
        description: 'Updated description'
      });

      expect(result).toEqual(updatedEncounter);
      expect(mockPrisma.encounter.update).toHaveBeenCalledWith({
        where: { id: encounterId },
        data: { description: 'Updated description' },
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

    it('should update encounter status', async () => {
      const updatedEncounter = { ...mockEncounterData, status: 'ACTIVE' as const };
      mockPrisma.encounter.update.mockResolvedValue(updatedEncounter);

      const result = await encounterService.updateEncounter(encounterId, userId, {
        status: 'ACTIVE'
      });

      expect(result).toEqual(updatedEncounter);
      expect(mockPrisma.encounter.update).toHaveBeenCalledWith({
        where: { id: encounterId },
        data: { status: 'ACTIVE' },
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

    it('should update multiple fields at once', async () => {
      const updatedEncounter = {
        ...mockEncounterData,
        name: 'New Name',
        description: 'New description',
        status: 'ACTIVE' as const
      };
      mockPrisma.encounter.update.mockResolvedValue(updatedEncounter);

      const result = await encounterService.updateEncounter(encounterId, userId, {
        name: 'New Name',
        description: 'New description',
        status: 'ACTIVE'
      });

      expect(result).toEqual(updatedEncounter);
      expect(mockPrisma.encounter.update).toHaveBeenCalledWith({
        where: { id: encounterId },
        data: {
          name: 'New Name',
          description: 'New description',
          status: 'ACTIVE'
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

    it('should trim whitespace from name and description', async () => {
      const updatedEncounter = {
        ...mockEncounterData,
        name: 'Trimmed Name',
        description: 'Trimmed description'
      };
      mockPrisma.encounter.update.mockResolvedValue(updatedEncounter);

      await encounterService.updateEncounter(encounterId, userId, {
        name: '  Trimmed Name  ',
        description: '  Trimmed description  '
      });

      expect(mockPrisma.encounter.update).toHaveBeenCalledWith({
        where: { id: encounterId },
        data: {
          name: 'Trimmed Name',
          description: 'Trimmed description'
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

    it('should convert empty description to null', async () => {
      const updatedEncounter = { ...mockEncounterData, description: null };
      mockPrisma.encounter.update.mockResolvedValue(updatedEncounter);

      await encounterService.updateEncounter(encounterId, userId, {
        description: ''
      });

      expect(mockPrisma.encounter.update).toHaveBeenCalledWith({
        where: { id: encounterId },
        data: { description: null },
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

    it('should reject empty name', async () => {
      await expect(encounterService.updateEncounter(encounterId, userId, {
        name: ''
      })).rejects.toThrow('Encounter name is required');
    });

    it('should reject whitespace-only name', async () => {
      await expect(encounterService.updateEncounter(encounterId, userId, {
        name: '   '
      })).rejects.toThrow('Encounter name is required');
    });

    it('should reject name longer than 100 characters', async () => {
      const longName = 'a'.repeat(101);
      await expect(encounterService.updateEncounter(encounterId, userId, {
        name: longName
      })).rejects.toThrow('Encounter name must be 100 characters or less');
    });

    it('should reject if encounter not found', async () => {
      mockPrisma.encounter.findUnique.mockResolvedValue(null);

      await expect(encounterService.updateEncounter(encounterId, userId, {
        name: 'New Name'
      })).rejects.toThrow('Encounter not found');
    });

    it('should reject if user not authorized', async () => {
      mockPrisma.encounter.findUnique.mockResolvedValue({ userId: 'different-user' });

      await expect(encounterService.updateEncounter(encounterId, userId, {
        name: 'New Name'
      })).rejects.toThrow('Not authorized to modify this encounter');
    });
  });
});