import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PartyService } from '../PartyService';
import { createMockParty, createMockPrisma } from './PartyService.helpers';

describe('PartyService - query operations', () => {
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

  describe('findByUserId', () => {
    it('should return all non-archived parties for a user', async () => {
      const mockParties = [
        createMockParty({ id: 'party_1', name: 'Party 1', isArchived: false }),
        createMockParty({ id: 'party_2', name: 'Party 2', isArchived: false })
      ];

      mockPrisma.party.findMany = vi.fn().mockResolvedValue(mockParties);

      const result = await partyService.findByUserId('user_123');

      expect(mockPrisma.party.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user_123',
          isArchived: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(result).toEqual(mockParties);
    });

    it('should return all parties including archived when includeArchived is true', async () => {
      const mockParties = [
        createMockParty({ id: 'party_1', name: 'Active Party', isArchived: false }),
        createMockParty({ id: 'party_2', name: 'Archived Party', isArchived: true })
      ];

      mockPrisma.party.findMany = vi.fn().mockResolvedValue(mockParties);

      const result = await partyService.findByUserId('user_123', true);

      expect(mockPrisma.party.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user_123',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(result).toEqual(mockParties);
    });

    it('should return empty array when user has no parties', async () => {
      mockPrisma.party.findMany = vi.fn().mockResolvedValue([]);

      const result = await partyService.findByUserId('user_123');

      expect(result).toEqual([]);
    });

    it('should handle database errors during fetch', async () => {
      mockPrisma.party.findMany = vi.fn().mockRejectedValue(new Error('Database error'));

      await expect(partyService.findByUserId('user_123'))
        .rejects.toThrow('Failed to fetch parties: Database error');
    });

    it('should handle generic errors during fetch', async () => {
      mockPrisma.party.findMany = vi.fn().mockRejectedValue('Unknown error');

      await expect(partyService.findByUserId('user_123'))
        .rejects.toThrow('Failed to fetch parties');
    });

    it('should handle database connection errors gracefully', async () => {
      mockPrisma.party.findMany = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(partyService.findByUserId('user_123'))
        .rejects.toThrow('Failed to fetch parties: ECONNREFUSED');
    });
  });

  describe('findById', () => {
    it('should return party when found and belongs to user', async () => {
      const mockParty = createMockParty();

      mockPrisma.party.findFirst = vi.fn().mockResolvedValue(mockParty);

      const result = await partyService.findById('party_123', 'user_123');

      expect(mockPrisma.party.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'party_123',
          userId: 'user_123',
        },
      });

      expect(result).toEqual(mockParty);
    });

    it('should return null when party not found', async () => {
      mockPrisma.party.findFirst = vi.fn().mockResolvedValue(null);

      const result = await partyService.findById('nonexistent', 'user_123');

      expect(result).toBeNull();
    });

    it('should return null when party belongs to different user', async () => {
      mockPrisma.party.findFirst = vi.fn().mockResolvedValue(null);

      const result = await partyService.findById('party_123', 'different_user');

      expect(result).toBeNull();
    });

    it('should handle database errors during fetch', async () => {
      mockPrisma.party.findFirst = vi.fn().mockRejectedValue(new Error('Database error'));

      await expect(partyService.findById('party_123', 'user_123'))
        .rejects.toThrow('Failed to fetch party: Database error');
    });

    it('should handle generic errors during fetch', async () => {
      mockPrisma.party.findFirst = vi.fn().mockRejectedValue('Unknown error');

      await expect(partyService.findById('party_123', 'user_123'))
        .rejects.toThrow('Failed to fetch party');
    });
  });
});