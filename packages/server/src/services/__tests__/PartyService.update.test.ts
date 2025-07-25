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

  // Helper function to set up common test scenario
  const setupUpdateTest = (mockReturnValue?: any) => {
    const existingParty = createMockParty();
    const returnValue = mockReturnValue || createMockParty();
    
    vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
    mockPrisma.party.update = vi.fn().mockResolvedValue(returnValue);
    
    return { existingParty, returnValue };
  };

  // Helper function to verify update call with expected data
  const expectUpdateCall = (expectedData: any) => {
    expect(mockPrisma.party.update).toHaveBeenCalledWith({
      where: { id: 'party_123' },
      data: expectedData,
    });
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
      const updatedParty = createMockParty({
        name: 'Updated Party',
        description: 'Updated description'
      });
      const { returnValue } = setupUpdateTest(updatedParty);

      const result = await partyService.update('party_123', 'user_123', validUpdateData);

      expect(partyService.findById).toHaveBeenCalledWith('party_123', 'user_123');
      expectUpdateCall({
        name: 'Updated Party',
        description: 'Updated description',
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
      const updateDataNameOnly: UpdatePartyData = {
        name: 'Only Name Updated'
      };
      setupUpdateTest();

      await partyService.update('party_123', 'user_123', updateDataNameOnly);

      expectUpdateCall({
        name: 'Only Name Updated',
      });
    });

    it('should update only description when provided', async () => {
      const updateDataDescriptionOnly: UpdatePartyData = {
        description: 'Only Description Updated'
      };
      setupUpdateTest();

      await partyService.update('party_123', 'user_123', updateDataDescriptionOnly);

      expectUpdateCall({
        description: 'Only Description Updated',
      });
    });

    it('should update archive status when provided', async () => {
      const updateDataArchived: UpdatePartyData = {
        isArchived: true
      };
      setupUpdateTest();

      await partyService.update('party_123', 'user_123', updateDataArchived);

      expectUpdateCall({
        isArchived: true,
      });
    });

    it('should trim string fields appropriately', async () => {
      const updateDataWithSpaces: UpdatePartyData = {
        name: '  Trimmed Name  ',
        description: '  Trimmed Description  '
      };
      setupUpdateTest();

      await partyService.update('party_123', 'user_123', updateDataWithSpaces);

      expectUpdateCall({
        name: 'Trimmed Name',
        description: 'Trimmed Description',
      });
    });

    it('should convert empty description to null', async () => {
      const updateDataEmptyDescription: UpdatePartyData = {
        description: ''
      };
      setupUpdateTest();

      await partyService.update('party_123', 'user_123', updateDataEmptyDescription);

      expectUpdateCall({
        description: null,
      });
    });

    it('should convert whitespace-only description to null', async () => {
      const updateDataWhitespaceDescription: UpdatePartyData = {
        description: '   '
      };
      setupUpdateTest();

      await partyService.update('party_123', 'user_123', updateDataWhitespaceDescription);

      expectUpdateCall({
        description: null,
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