import { PrismaMockFactory } from '../../utils/PrismaMockFactory';
import { MockDataFactory } from '../../utils/MockDataFactory';
import { expect } from 'vitest';

export function createMockPrisma() {
  return PrismaMockFactory.createFullMock();
}

export const mockEncounterData = MockDataFactory.createEncounter({
  id: 'encounter123',
  userId: 'user123',
  status: 'PLANNING' as const,
  round: 1,
  turn: 0,
  isActive: false,
  lairActions: null,
});

export const mockParticipantData = MockDataFactory.createParticipant({
  id: 'participant123',
  encounterId: 'encounter123',
  type: 'CHARACTER' as const,
  characterId: 'character123',
  creatureId: null,
  initiativeRoll: 12,
  currentHp: 25,
  maxHp: 30,
  tempHp: 5,
  ac: 16,
  conditions: [],
  notes: 'Test notes',
});

// Common test constants
export const testConstants = {
  validUserId: 'user123',
  validEncounterId: 'encounter123',
  validParticipantId: 'participant123',
  validName: 'Epic Boss Fight',
  validDescription: 'A challenging encounter',
  invalidUserId: 'different-user',
};

// Helper functions for common test patterns
export const encounterTestHelpers = {
  /**
   * Create a mock encounter with common defaults
   */
  createMockEncounter: (overrides: any = {}) => ({
    id: testConstants.validEncounterId,
    userId: testConstants.validUserId,
    name: testConstants.validName,
    description: testConstants.validDescription,
    status: 'PLANNING',
    round: 1,
    turn: 0,
    isActive: false,
    participants: [],
    lairActions: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  /**
   * Expect successful encounter creation call
   */
  expectEncounterCreateCall: (mockPrisma: any, userId: string, name: string, description?: string) => {
    expect(mockPrisma.encounter.create).toHaveBeenCalledWith({
      data: {
        userId,
        name,
        description: description || null,
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
  },

  /**
   * Expect encounter update call with specific data
   */
  expectEncounterUpdateCall: (mockPrisma: any, encounterId: string, updateData: any) => {
    expect(mockPrisma.encounter.update).toHaveBeenCalledWith({
      where: { id: encounterId },
      data: updateData,
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
  },

  /**
   * Setup common mock for authorized encounter access
   */
  setupAuthorizedEncounter: (mockPrisma: any, encounter: any = null) => {
    const mockData = encounter || encounterTestHelpers.createMockEncounter();
    mockPrisma.encounter.findFirst.mockResolvedValue(mockData);
    return mockData;
  },

  /**
   * Setup mock for unauthorized access (different user)
   */
  setupUnauthorizedAccess: (mockPrisma: any) => {
    mockPrisma.encounter.findFirst.mockResolvedValue(null);
  },

  /**
   * Setup mock for not found encounter
   */
  setupEncounterNotFound: (mockPrisma: any) => {
    mockPrisma.encounter.findFirst.mockResolvedValue(null);
  },

  /**
   * Expect not found error to be thrown
   */
  expectNotFoundError: async (promise: Promise<any>) => {
    await expect(promise).rejects.toThrow('Encounter not found');
  },

  /**
   * Expect unauthorized error to be thrown
   */
  expectUnauthorizedError: async (promise: Promise<any>) => {
    await expect(promise).rejects.toThrow('Not authorized');
  },

  /**
   * Setup mock for encounter ownership verification (success)
   */
  setupOwnershipVerification: (mockPrisma: any, userId: string = testConstants.validUserId) => {
    mockPrisma.encounter.findUnique.mockResolvedValue({ userId });
  },

  /**
   * Setup mock for encounter not found during ownership verification
   */
  setupEncounterNotFoundForOwnership: (mockPrisma: any) => {
    mockPrisma.encounter.findUnique.mockResolvedValue(null);
  },

  /**
   * Setup mock for unauthorized access (different user)
   */
  setupUnauthorizedAccessForOwnership: (mockPrisma: any, differentUserId: string = testConstants.invalidUserId) => {
    mockPrisma.encounter.findUnique.mockResolvedValue({ userId: differentUserId });
  },

  /**
   * Setup mock for successful encounter update
   */
  setupSuccessfulUpdate: (mockPrisma: any, updatedEncounter: any) => {
    mockPrisma.encounter.update.mockResolvedValue(updatedEncounter);
  },

  /**
   * Expect successful encounter update call with standard include
   */
  expectEncounterUpdateCallWithInclude: (mockPrisma: any, encounterId: string, updateData: any) => {
    expect(mockPrisma.encounter.update).toHaveBeenCalledWith({
      where: { id: encounterId },
      data: updateData,
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
  },

  /**
   * Expect update not authorized error
   */
  expectUpdateNotAuthorizedError: async (promise: Promise<any>) => {
    await expect(promise).rejects.toThrow('Not authorized to modify this encounter');
  },

  /**
   * Expect validation error for encounter name
   */
  expectNameValidationError: async (promise: Promise<any>, expectedMessage: string = 'Encounter name is required') => {
    await expect(promise).rejects.toThrow(expectedMessage);
  },
};