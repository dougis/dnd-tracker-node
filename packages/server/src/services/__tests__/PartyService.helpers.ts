import { PrismaClient } from '@prisma/client';
import { MockDataFactory } from '../../utils/MockDataFactory';
import { PrismaMockFactory } from '../../utils/PrismaMockFactory';
import { expect, vi } from 'vitest';

// Re-export factory methods for party-specific testing
export const createMockParty = (overrides = {}) => MockDataFactory.createParty(overrides);

// Create mock Prisma client with party-specific focus
export const createMockPrisma = () => PrismaMockFactory.combineMocks(
  PrismaMockFactory.createWithPresetBehaviors('party', {})
) as unknown as PrismaClient;

// Common test constants
export const testConstants = {
  validPartyId: 'party_123',
  validUserId: 'user_123',
  differentUserId: 'different_user',
  nonexistentId: 'nonexistent',
};

// Helper functions for common test patterns
export const partyTestHelpers = {
  /**
   * Setup mock for successful party retrieval
   */
  setupSuccessfulFindById: (partyService: any, party: any = null) => {
    const mockParty = party || createMockParty();
    vi.spyOn(partyService, 'findById').mockResolvedValue(mockParty);
    return mockParty;
  },

  /**
   * Setup mock for party not found
   */
  setupPartyNotFound: (partyService: any) => {
    vi.spyOn(partyService, 'findById').mockResolvedValue(null);
  },

  /**
   * Setup mock for successful party update
   */
  setupSuccessfulUpdate: (mockPrisma: any, updatedParty: any) => {
    mockPrisma.party.update = vi.fn().mockResolvedValue(updatedParty);
  },

  /**
   * Setup mock for successful party deletion
   */
  setupSuccessfulDelete: (mockPrisma: any, deletedParty: any) => {
    mockPrisma.party.delete = vi.fn().mockResolvedValue(deletedParty);
  },

  /**
   * Setup mock for database error
   */
  setupDatabaseError: (mockPrisma: any, operation: 'update' | 'delete', error: any = new Error('Database error')) => {
    mockPrisma.party[operation] = vi.fn().mockRejectedValue(error);
  },

  /**
   * Expect successful delete call (soft delete)
   */
  expectSoftDeleteCall: (mockPrisma: any, partyId: string) => {
    expect(mockPrisma.party.update).toHaveBeenCalledWith({
      where: { id: partyId },
      data: { isArchived: true },
    });
  },

  /**
   * Expect successful hard delete call
   */
  expectHardDeleteCall: (mockPrisma: any, partyId: string) => {
    expect(mockPrisma.party.delete).toHaveBeenCalledWith({
      where: { id: partyId },
    });
  },

  /**
   * Expect findById was called with correct parameters
   */
  expectFindByIdCall: (partyService: any, partyId: string, userId: string) => {
    expect(partyService.findById).toHaveBeenCalledWith(partyId, userId);
  },

  /**
   * Expect operation was not called
   */
  expectOperationNotCalled: (mockPrisma: any, operation: 'update' | 'delete') => {
    expect(mockPrisma.party[operation]).not.toHaveBeenCalled();
  },
};