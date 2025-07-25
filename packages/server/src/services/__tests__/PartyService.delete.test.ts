import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PartyService } from '../PartyService';
import { createMockParty, createMockPrisma } from './PartyService.helpers';

describe('PartyService - delete operations', () => {
  let partyService: PartyService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    partyService = new PartyService(mockPrisma);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('delete (soft delete)', () => {
    it('should soft delete party successfully (archive)', async () => {
      const existingParty = createMockParty({ isArchived: false });

      vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
      mockPrisma.party.update = vi.fn().mockResolvedValue(existingParty);

      const result = await partyService.delete('party_123', 'user_123');

      expect(partyService.findById).toHaveBeenCalledWith('party_123', 'user_123');
      expect(mockPrisma.party.update).toHaveBeenCalledWith({
        where: {
          id: 'party_123',
        },
        data: {
          isArchived: true,
        },
      });

      expect(result).toBe(true);
    });

    it('should return false when party not found', async () => {
      vi.spyOn(partyService, 'findById').mockResolvedValue(null);

      const result = await partyService.delete('nonexistent', 'user_123');

      expect(result).toBe(false);
      expect(mockPrisma.party.update).not.toHaveBeenCalled();
    });

    it('should return false when party belongs to different user', async () => {
      vi.spyOn(partyService, 'findById').mockResolvedValue(null);

      const result = await partyService.delete('party_123', 'different_user');

      expect(result).toBe(false);
      expect(mockPrisma.party.update).not.toHaveBeenCalled();
    });

    it('should handle database errors during soft deletion', async () => {
      const existingParty = createMockParty();
      vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
      mockPrisma.party.update = vi.fn().mockRejectedValue(new Error('Database error'));

      await expect(partyService.delete('party_123', 'user_123'))
        .rejects.toThrow('Failed to delete party: Database error');
    });

    it('should handle generic errors during soft deletion', async () => {
      const existingParty = createMockParty();
      vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
      mockPrisma.party.update = vi.fn().mockRejectedValue('Unknown error');

      await expect(partyService.delete('party_123', 'user_123'))
        .rejects.toThrow('Failed to delete party');
    });
  });

  describe('hardDelete', () => {
    it('should hard delete party successfully', async () => {
      const existingParty = createMockParty();
      vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
      mockPrisma.party.delete = vi.fn().mockResolvedValue(existingParty);

      const result = await partyService.hardDelete('party_123', 'user_123');

      expect(partyService.findById).toHaveBeenCalledWith('party_123', 'user_123');
      expect(mockPrisma.party.delete).toHaveBeenCalledWith({
        where: {
          id: 'party_123',
        },
      });

      expect(result).toBe(true);
    });

    it('should return false when party not found', async () => {
      vi.spyOn(partyService, 'findById').mockResolvedValue(null);

      const result = await partyService.hardDelete('nonexistent', 'user_123');

      expect(result).toBe(false);
      expect(mockPrisma.party.delete).not.toHaveBeenCalled();
    });

    it('should return false when party belongs to different user', async () => {
      vi.spyOn(partyService, 'findById').mockResolvedValue(null);

      const result = await partyService.hardDelete('party_123', 'different_user');

      expect(result).toBe(false);
      expect(mockPrisma.party.delete).not.toHaveBeenCalled();
    });

    it('should handle database errors during hard deletion', async () => {
      const existingParty = createMockParty();
      vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
      mockPrisma.party.delete = vi.fn().mockRejectedValue(new Error('Database error'));

      await expect(partyService.hardDelete('party_123', 'user_123'))
        .rejects.toThrow('Failed to permanently delete party: Database error');
    });

    it('should handle generic errors during hard deletion', async () => {
      const existingParty = createMockParty();
      vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
      mockPrisma.party.delete = vi.fn().mockRejectedValue('Unknown error');

      await expect(partyService.hardDelete('party_123', 'user_123'))
        .rejects.toThrow('Failed to permanently delete party');
    });
  });
});