import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PartyService, UpdatePartyData } from '../PartyService';
import { createMockParty, createMockPrisma } from './PartyService.helpers';

describe('PartyService - update operations', () => {
  let partyService: PartyService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  const validUpdateData: UpdatePartyData = {
    name: 'Updated Party',
    description: 'Updated description'
  };

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    partyService = new PartyService(mockPrisma);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('update', () => {
    it('should update party successfully', async () => {
      const existingParty = createMockParty();
      const updatedParty = createMockParty({
        name: 'Updated Party',
        description: 'Updated description'
      });

      vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
      mockPrisma.party.update = vi.fn().mockResolvedValue(updatedParty);

      const result = await partyService.update('party_123', 'user_123', validUpdateData);

      expect(partyService.findById).toHaveBeenCalledWith('party_123', 'user_123');
      expect(mockPrisma.party.update).toHaveBeenCalledWith({
        where: {
          id: 'party_123',
        },
        data: {
          name: 'Updated Party',
          description: 'Updated description',
        },
      });

      expect(result).toEqual(updatedParty);
    });

    it('should return null when party not found', async () => {
      vi.spyOn(partyService, 'findById').mockResolvedValue(null);

      const result = await partyService.update('nonexistent', 'user_123', validUpdateData);

      expect(result).toBeNull();
      expect(mockPrisma.party.update).not.toHaveBeenCalled();
    });

    it('should update only name when provided', async () => {
      const existingParty = createMockParty();
      const updateDataNameOnly: UpdatePartyData = {
        name: 'Only Name Updated'
      };

      vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
      mockPrisma.party.update = vi.fn().mockResolvedValue(createMockParty());

      await partyService.update('party_123', 'user_123', updateDataNameOnly);

      expect(mockPrisma.party.update).toHaveBeenCalledWith({
        where: { id: 'party_123' },
        data: {
          name: 'Only Name Updated',
        },
      });
    });

    it('should update only description when provided', async () => {
      const existingParty = createMockParty();
      const updateDataDescriptionOnly: UpdatePartyData = {
        description: 'Only Description Updated'
      };

      vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
      mockPrisma.party.update = vi.fn().mockResolvedValue(createMockParty());

      await partyService.update('party_123', 'user_123', updateDataDescriptionOnly);

      expect(mockPrisma.party.update).toHaveBeenCalledWith({
        where: { id: 'party_123' },
        data: {
          description: 'Only Description Updated',
        },
      });
    });

    it('should update archive status when provided', async () => {
      const existingParty = createMockParty();
      const updateDataArchived: UpdatePartyData = {
        isArchived: true
      };

      vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
      mockPrisma.party.update = vi.fn().mockResolvedValue(createMockParty());

      await partyService.update('party_123', 'user_123', updateDataArchived);

      expect(mockPrisma.party.update).toHaveBeenCalledWith({
        where: { id: 'party_123' },
        data: {
          isArchived: true,
        },
      });
    });

    it('should trim string fields appropriately', async () => {
      const existingParty = createMockParty();
      const updateDataWithSpaces: UpdatePartyData = {
        name: '  Trimmed Name  ',
        description: '  Trimmed Description  '
      };

      vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
      mockPrisma.party.update = vi.fn().mockResolvedValue(createMockParty());

      await partyService.update('party_123', 'user_123', updateDataWithSpaces);

      expect(mockPrisma.party.update).toHaveBeenCalledWith({
        where: { id: 'party_123' },
        data: {
          name: 'Trimmed Name',
          description: 'Trimmed Description',
        },
      });
    });

    it('should convert empty description to null', async () => {
      const existingParty = createMockParty();
      const updateDataEmptyDescription: UpdatePartyData = {
        description: ''
      };

      vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
      mockPrisma.party.update = vi.fn().mockResolvedValue(createMockParty());

      await partyService.update('party_123', 'user_123', updateDataEmptyDescription);

      expect(mockPrisma.party.update).toHaveBeenCalledWith({
        where: { id: 'party_123' },
        data: {
          description: null,
        },
      });
    });

    it('should convert whitespace-only description to null', async () => {
      const existingParty = createMockParty();
      const updateDataWhitespaceDescription: UpdatePartyData = {
        description: '   '
      };

      vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
      mockPrisma.party.update = vi.fn().mockResolvedValue(createMockParty());

      await partyService.update('party_123', 'user_123', updateDataWhitespaceDescription);

      expect(mockPrisma.party.update).toHaveBeenCalledWith({
        where: { id: 'party_123' },
        data: {
          description: null,
        },
      });
    });

    it('should throw error for empty name', async () => {
      const invalidData = { name: '' };

      await expect(partyService.update('party_123', 'user_123', invalidData))
        .rejects.toThrow('Party name cannot be empty');
    });

    it('should throw error for whitespace-only name', async () => {
      const invalidData = { name: '   ' };

      await expect(partyService.update('party_123', 'user_123', invalidData))
        .rejects.toThrow('Party name cannot be empty');
    });

    it('should handle database errors during update', async () => {
      const existingParty = createMockParty();
      vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
      mockPrisma.party.update = vi.fn().mockRejectedValue(new Error('Database error'));

      await expect(partyService.update('party_123', 'user_123', validUpdateData))
        .rejects.toThrow('Failed to update party: Database error');
    });

    it('should handle generic errors during update', async () => {
      const existingParty = createMockParty();
      vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
      mockPrisma.party.update = vi.fn().mockRejectedValue('Unknown error');

      await expect(partyService.update('party_123', 'user_123', validUpdateData))
        .rejects.toThrow('Failed to update party');
    });
  });
});