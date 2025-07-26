import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PartyService } from '../PartyService';
import { createMockParty, createMockPrisma, testConstants, partyTestHelpers } from './PartyService.helpers';

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
      const existingParty = partyTestHelpers.setupSuccessfulFindById(partyService, createMockParty({ isArchived: false }));
      partyTestHelpers.setupSuccessfulUpdate(mockPrisma, existingParty);

      const result = await partyService.delete(testConstants.validPartyId, testConstants.validUserId);

      partyTestHelpers.expectFindByIdCall(partyService, testConstants.validPartyId, testConstants.validUserId);
      partyTestHelpers.expectSoftDeleteCall(mockPrisma, testConstants.validPartyId);
      expect(result).toBe(true);
    });

    it('should return false when party not found', async () => {
      partyTestHelpers.setupPartyNotFound(partyService);

      const result = await partyService.delete(testConstants.nonexistentId, testConstants.validUserId);

      expect(result).toBe(false);
      partyTestHelpers.expectOperationNotCalled(mockPrisma, 'update');
    });

    it('should return false when party belongs to different user', async () => {
      partyTestHelpers.setupPartyNotFound(partyService);

      const result = await partyService.delete(testConstants.validPartyId, testConstants.differentUserId);

      expect(result).toBe(false);
      partyTestHelpers.expectOperationNotCalled(mockPrisma, 'update');
    });

    it('should handle database errors during soft deletion', async () => {
      partyTestHelpers.setupSuccessfulFindById(partyService);
      partyTestHelpers.setupDatabaseError(mockPrisma, 'update');

      await expect(partyService.delete(testConstants.validPartyId, testConstants.validUserId))
        .rejects.toThrow('Failed to delete party: Database error');
    });

    it('should handle generic errors during soft deletion', async () => {
      partyTestHelpers.setupSuccessfulFindById(partyService);
      partyTestHelpers.setupDatabaseError(mockPrisma, 'update', 'Unknown error');

      await expect(partyService.delete(testConstants.validPartyId, testConstants.validUserId))
        .rejects.toThrow('Failed to delete party');
    });
  });

  describe('hardDelete', () => {
    it('should hard delete party successfully', async () => {
      const existingParty = partyTestHelpers.setupSuccessfulFindById(partyService);
      partyTestHelpers.setupSuccessfulDelete(mockPrisma, existingParty);

      const result = await partyService.hardDelete(testConstants.validPartyId, testConstants.validUserId);

      partyTestHelpers.expectFindByIdCall(partyService, testConstants.validPartyId, testConstants.validUserId);
      partyTestHelpers.expectHardDeleteCall(mockPrisma, testConstants.validPartyId);
      expect(result).toBe(true);
    });

    it('should return false when party not found', async () => {
      partyTestHelpers.setupPartyNotFound(partyService);

      const result = await partyService.hardDelete(testConstants.nonexistentId, testConstants.validUserId);

      expect(result).toBe(false);
      partyTestHelpers.expectOperationNotCalled(mockPrisma, 'delete');
    });

    it('should return false when party belongs to different user', async () => {
      partyTestHelpers.setupPartyNotFound(partyService);

      const result = await partyService.hardDelete(testConstants.validPartyId, testConstants.differentUserId);

      expect(result).toBe(false);
      partyTestHelpers.expectOperationNotCalled(mockPrisma, 'delete');
    });

    it('should handle database errors during hard deletion', async () => {
      partyTestHelpers.setupSuccessfulFindById(partyService);
      partyTestHelpers.setupDatabaseError(mockPrisma, 'delete');

      await expect(partyService.hardDelete(testConstants.validPartyId, testConstants.validUserId))
        .rejects.toThrow('Failed to permanently delete party: Database error');
    });

    it('should handle generic errors during hard deletion', async () => {
      partyTestHelpers.setupSuccessfulFindById(partyService);
      partyTestHelpers.setupDatabaseError(mockPrisma, 'delete', 'Unknown error');

      await expect(partyService.hardDelete(testConstants.validPartyId, testConstants.validUserId))
        .rejects.toThrow('Failed to permanently delete party');
    });
  });
});