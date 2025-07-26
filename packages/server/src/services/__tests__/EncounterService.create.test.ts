import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EncounterService } from '../EncounterService';
import { createMockPrisma, testConstants, encounterTestHelpers } from './EncounterService.helpers';

describe('EncounterService - Create Operations', () => {
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

  describe('createEncounter', () => {

    it('should create encounter successfully with name and description', async () => {
      const mockEncounter = encounterTestHelpers.createMockEncounter();
      mockPrisma.encounter.create.mockResolvedValue(mockEncounter);

      const result = await encounterService.createEncounter(
        testConstants.validUserId, 
        testConstants.validName, 
        testConstants.validDescription
      );

      expect(result).toEqual(mockEncounter);
      encounterTestHelpers.expectEncounterCreateCall(
        mockPrisma, 
        testConstants.validUserId, 
        testConstants.validName, 
        testConstants.validDescription
      );
    });

    it('should create encounter successfully with name only', async () => {
      const encounterWithoutDescription = encounterTestHelpers.createMockEncounter({ description: null });
      mockPrisma.encounter.create.mockResolvedValue(encounterWithoutDescription);

      const result = await encounterService.createEncounter(testConstants.validUserId, testConstants.validName);

      expect(result).toEqual(encounterWithoutDescription);
      encounterTestHelpers.expectEncounterCreateCall(mockPrisma, testConstants.validUserId, testConstants.validName);
    });

    it('should trim name and description whitespace', async () => {
      const nameWithSpaces = '  Epic Boss Fight  ';
      const descriptionWithSpaces = '  A challenging encounter  ';
      const mockEncounter = encounterTestHelpers.createMockEncounter();
      mockPrisma.encounter.create.mockResolvedValue(mockEncounter);

      await encounterService.createEncounter(testConstants.validUserId, nameWithSpaces, descriptionWithSpaces);

      encounterTestHelpers.expectEncounterCreateCall(
        mockPrisma, 
        testConstants.validUserId, 
        testConstants.validName, 
        testConstants.validDescription
      );
    });

    it('should handle empty description', async () => {
      const encounterWithoutDescription = encounterTestHelpers.createMockEncounter({ description: null });
      mockPrisma.encounter.create.mockResolvedValue(encounterWithoutDescription);

      await encounterService.createEncounter(testConstants.validUserId, testConstants.validName, '');

      encounterTestHelpers.expectEncounterCreateCall(mockPrisma, testConstants.validUserId, testConstants.validName);
    });

    it('should reject missing user ID', async () => {
      await expect(encounterService.createEncounter('', testConstants.validName, testConstants.validDescription))
        .rejects.toThrow('User ID is required');
    });

    it('should reject missing name', async () => {
      await expect(encounterService.createEncounter(testConstants.validUserId, '', testConstants.validDescription))
        .rejects.toThrow('Encounter name is required');
    });

    it('should reject whitespace-only name', async () => {
      await expect(encounterService.createEncounter(testConstants.validUserId, '   ', testConstants.validDescription))
        .rejects.toThrow('Encounter name is required');
    });

    it('should reject name longer than 100 characters', async () => {
      const longName = 'a'.repeat(101);
      await expect(encounterService.createEncounter(testConstants.validUserId, longName, testConstants.validDescription))
        .rejects.toThrow('Encounter name must be 100 characters or less');
    });

    it('should handle database error', async () => {
      mockPrisma.encounter.create.mockRejectedValue(new Error('Database error'));

      await expect(encounterService.createEncounter(testConstants.validUserId, testConstants.validName, testConstants.validDescription))
        .rejects.toThrow('Database error');
    });
  });
});