import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EncounterService } from '../EncounterService';
import { createMockPrisma } from './EncounterService.helpers';

describe('EncounterService - Delete Operations', () => {
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

  describe('deleteEncounter', () => {
    const encounterId = 'encounter123';
    const userId = 'user123';

    it('should delete encounter successfully', async () => {
      // Mock ownership verification
      mockPrisma.encounter.findUnique.mockResolvedValue({ userId });
      mockPrisma.encounter.delete.mockResolvedValue({});

      await encounterService.deleteEncounter(encounterId, userId);

      expect(mockPrisma.encounter.findUnique).toHaveBeenCalledWith({
        where: { id: encounterId },
        select: { userId: true },
      });
      expect(mockPrisma.encounter.delete).toHaveBeenCalledWith({
        where: { id: encounterId },
      });
    });

    it('should reject if encounter not found', async () => {
      mockPrisma.encounter.findUnique.mockResolvedValue(null);

      await expect(encounterService.deleteEncounter(encounterId, userId))
        .rejects.toThrow('Encounter not found');

      expect(mockPrisma.encounter.delete).not.toHaveBeenCalled();
    });

    it('should reject if user not authorized', async () => {
      mockPrisma.encounter.findUnique.mockResolvedValue({ userId: 'different-user' });

      await expect(encounterService.deleteEncounter(encounterId, userId))
        .rejects.toThrow('Not authorized to modify this encounter');

      expect(mockPrisma.encounter.delete).not.toHaveBeenCalled();
    });

    it('should handle database error during delete', async () => {
      mockPrisma.encounter.findUnique.mockResolvedValue({ userId });
      mockPrisma.encounter.delete.mockRejectedValue(new Error('Database error'));

      await expect(encounterService.deleteEncounter(encounterId, userId))
        .rejects.toThrow('Database error');
    });
  });
});