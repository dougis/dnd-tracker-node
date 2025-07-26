import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EncounterService } from '../EncounterService';
import { createMockPrisma, mockEncounterData, testConstants, encounterTestHelpers } from './EncounterService.helpers';

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
    beforeEach(() => {
      encounterTestHelpers.setupOwnershipVerification(mockPrisma);
    });

    it('should update encounter name', async () => {
      const updatedEncounter = { ...mockEncounterData, name: 'Updated Name' };
      encounterTestHelpers.setupSuccessfulUpdate(mockPrisma, updatedEncounter);

      const result = await encounterService.updateEncounter(testConstants.validEncounterId, testConstants.validUserId, {
        name: 'Updated Name'
      });

      expect(result).toEqual(updatedEncounter);
      encounterTestHelpers.expectEncounterUpdateCallWithInclude(mockPrisma, testConstants.validEncounterId, { name: 'Updated Name' });
    });

    it('should update encounter description', async () => {
      const updatedEncounter = { ...mockEncounterData, description: 'Updated description' };
      encounterTestHelpers.setupSuccessfulUpdate(mockPrisma, updatedEncounter);

      const result = await encounterService.updateEncounter(testConstants.validEncounterId, testConstants.validUserId, {
        description: 'Updated description'
      });

      expect(result).toEqual(updatedEncounter);
      encounterTestHelpers.expectEncounterUpdateCallWithInclude(mockPrisma, testConstants.validEncounterId, { description: 'Updated description' });
    });

    it('should update encounter status', async () => {
      const updatedEncounter = { ...mockEncounterData, status: 'ACTIVE' as const };
      encounterTestHelpers.setupSuccessfulUpdate(mockPrisma, updatedEncounter);

      const result = await encounterService.updateEncounter(testConstants.validEncounterId, testConstants.validUserId, {
        status: 'ACTIVE'
      });

      expect(result).toEqual(updatedEncounter);
      encounterTestHelpers.expectEncounterUpdateCallWithInclude(mockPrisma, testConstants.validEncounterId, { status: 'ACTIVE' });
    });

    it('should update multiple fields at once', async () => {
      const updateData = {
        name: 'New Name',
        description: 'New description',
        status: 'ACTIVE' as const
      };
      const updatedEncounter = { ...mockEncounterData, ...updateData };
      encounterTestHelpers.setupSuccessfulUpdate(mockPrisma, updatedEncounter);

      const result = await encounterService.updateEncounter(testConstants.validEncounterId, testConstants.validUserId, updateData);

      expect(result).toEqual(updatedEncounter);
      encounterTestHelpers.expectEncounterUpdateCallWithInclude(mockPrisma, testConstants.validEncounterId, updateData);
    });

    it('should trim whitespace from name and description', async () => {
      const updatedEncounter = {
        ...mockEncounterData,
        name: 'Trimmed Name',
        description: 'Trimmed description'
      };
      encounterTestHelpers.setupSuccessfulUpdate(mockPrisma, updatedEncounter);

      await encounterService.updateEncounter(testConstants.validEncounterId, testConstants.validUserId, {
        name: '  Trimmed Name  ',
        description: '  Trimmed description  '
      });

      encounterTestHelpers.expectEncounterUpdateCallWithInclude(mockPrisma, testConstants.validEncounterId, {
        name: 'Trimmed Name',
        description: 'Trimmed description'
      });
    });

    it('should convert empty description to null', async () => {
      const updatedEncounter = { ...mockEncounterData, description: null };
      encounterTestHelpers.setupSuccessfulUpdate(mockPrisma, updatedEncounter);

      await encounterService.updateEncounter(testConstants.validEncounterId, testConstants.validUserId, {
        description: ''
      });

      encounterTestHelpers.expectEncounterUpdateCallWithInclude(mockPrisma, testConstants.validEncounterId, { description: null });
    });

    it('should reject empty name', async () => {
      await encounterTestHelpers.expectNameValidationError(
        encounterService.updateEncounter(testConstants.validEncounterId, testConstants.validUserId, { name: '' })
      );
    });

    it('should reject whitespace-only name', async () => {
      await encounterTestHelpers.expectNameValidationError(
        encounterService.updateEncounter(testConstants.validEncounterId, testConstants.validUserId, { name: '   ' })
      );
    });

    it('should reject name longer than 100 characters', async () => {
      const longName = 'a'.repeat(101);
      await encounterTestHelpers.expectNameValidationError(
        encounterService.updateEncounter(testConstants.validEncounterId, testConstants.validUserId, { name: longName }),
        'Encounter name must be 100 characters or less'
      );
    });

    it('should reject if encounter not found', async () => {
      encounterTestHelpers.setupEncounterNotFoundForOwnership(mockPrisma);

      await encounterTestHelpers.expectNotFoundError(
        encounterService.updateEncounter(testConstants.validEncounterId, testConstants.validUserId, { name: 'New Name' })
      );
    });

    it('should reject if user not authorized', async () => {
      encounterTestHelpers.setupUnauthorizedAccessForOwnership(mockPrisma);

      await encounterTestHelpers.expectUpdateNotAuthorizedError(
        encounterService.updateEncounter(testConstants.validEncounterId, testConstants.validUserId, { name: 'New Name' })
      );
    });
  });
});