/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient, EncounterStatus } from '@prisma/client';
import { EncounterService } from './EncounterService';
import { 
  createMockEncounter, 
  encounterIncludePattern,
  standardEncounterInclude,
  createEncounterData,
  setupBasicEncounterTest,
  expectEncounterCreation,
  expectEncounterFindUnique,
  expectUserEncountersFindMany,
  expectEncounterUpdate,
  expectEncounterDelete,
  createEncounterCreationScenario,
  createEncounterUpdateScenario,
  createValidationErrorScenario,
  expectNameTrimming,
  expectServiceResult,
  createEncounterNotFoundScenario,
  createAuthorizationErrorScenario,
  setupPrismaFindUnique,
  createEncounterValidationErrorScenarios,
  createBasicServiceErrorScenarios,
  generateValidationErrorTests,
  generateServiceErrorTests,
  createEncounterCreationTestHelper,
  createEncounterRetrievalTest,
  createServiceErrorTest
} from '../test/encounter-test-utils';

// Get mocked Prisma instance
const mockPrisma = new PrismaClient() as any;

describe('EncounterService - Basic Operations', () => {
  let encounterService: EncounterService;

  beforeEach(() => {
    vi.clearAllMocks();
    encounterService = new EncounterService(mockPrisma);
  });

  describe('createEncounter', () => {
    it('should create a new encounter successfully', async () => {
      await createEncounterCreationTestHelper(['user_123', 'Test Encounter', 'Test description'])(encounterService, mockPrisma);
    });

    it('should create encounter with null description when not provided', async () => {
      await createEncounterCreationTestHelper(['user_123', 'Test Encounter'])(encounterService, mockPrisma);
    });

    it('should trim encounter name', async () => {
      const mockEncounter = createMockEncounter();
      setupBasicEncounterTest(mockPrisma, 'create', mockEncounter);

      await encounterService.createEncounter('user_123', '  Test Encounter  ', 'Test description');

      expectNameTrimming(mockPrisma, 'Test Encounter');
    });

    // Generate comprehensive validation error tests
    const validationScenarios = createEncounterValidationErrorScenarios();
    const validationTests = generateValidationErrorTests(validationScenarios);
    
    validationTests.forEach(({ testName, test }) => {
      it(testName, async () => {
        await test(encounterService);
      });
    });
  });

  describe('getEncounterById', () => {
    it('should return encounter when found', async () => {
      const mockEncounter = createMockEncounter();
      await createEncounterRetrievalTest(mockEncounter, 'encounter_123')(encounterService, mockPrisma);
    });

    it('should return null when encounter not found', async () => {
      await createEncounterRetrievalTest(null, 'nonexistent')(encounterService, mockPrisma);
    });
  });

  describe('getUserEncounters', () => {
    it('should return all encounters for a user', async () => {
      const mockEncounters = [createMockEncounter()];
      setupBasicEncounterTest(mockPrisma, 'findMany', mockEncounters);

      const result = await encounterService.getUserEncounters('user_123');

      expectUserEncountersFindMany(mockPrisma, 'user_123');
      expectServiceResult(result, mockEncounters);
    });
  });

  describe('updateEncounter', () => {
    it('should update encounter successfully', async () => {
      const updates = {
        name: 'Updated Name',
        description: 'Updated description',
        status: EncounterStatus.ACTIVE
      };
      const scenario = createEncounterUpdateScenario('encounter_123', 'user_123', updates);
      setupBasicEncounterTest(mockPrisma, 'update', scenario.mockEncounter, scenario);

      const result = await encounterService.updateEncounter(scenario.encounterId, scenario.userId, scenario.updates);

      expectEncounterUpdate(mockPrisma, scenario.encounterId, scenario.updates);
      expectServiceResult(result, scenario.mockEncounter);
    });

    // Generate comprehensive service error tests for update operations
    const updateErrorScenarios = {
      updateNotFound: createBasicServiceErrorScenarios().updateNotFound,
      updateUnauthorized: createBasicServiceErrorScenarios().updateUnauthorized
    };
    const updateErrorTests = generateServiceErrorTests(updateErrorScenarios);
    
    updateErrorTests.forEach(({ testName, test }) => {
      it(testName, async () => {
        await test(encounterService, mockPrisma);
      });
    });

    it('should validate name when provided', async () => {
      setupPrismaFindUnique(mockPrisma, { userId: 'user_123' });

      await expect(encounterService.updateEncounter('encounter_123', 'user_123', { name: '' }))
        .rejects.toThrow('Encounter name is required');
    });
  });

  describe('deleteEncounter', () => {
    it('should delete encounter successfully', async () => {
      const ownershipResult = { userId: 'user_123' };
      setupBasicEncounterTest(mockPrisma, 'delete', {}, { ownershipResult });

      await encounterService.deleteEncounter('encounter_123', 'user_123');

      expectEncounterDelete(mockPrisma, 'encounter_123');
    });

    // Generate comprehensive service error tests for delete operations
    const deleteErrorScenarios = {
      deleteNotFound: createBasicServiceErrorScenarios().deleteNotFound,
      deleteUnauthorized: {
        ...createBasicServiceErrorScenarios().deleteUnauthorized,
        expectedError: 'Not authorized to delete this encounter'
      }
    };
    
    Object.values(deleteErrorScenarios).forEach((scenario: any) => {
      it(scenario.testName, async () => {
        // Custom logic for delete unauthorized test with specific error message
        if (scenario.testName.includes('user not authorized')) {
          const authScenario = createAuthorizationErrorScenario();
          setupPrismaFindUnique(mockPrisma, authScenario.encounterResult);
          await expect(encounterService.deleteEncounter('encounter_123', 'user_123'))
            .rejects.toThrow('Not authorized to delete this encounter');
        } else {
          await createServiceErrorTest(scenario.scenarioFactory, scenario.serviceMethod, scenario.serviceArgs)(encounterService, mockPrisma);
        }
      });
    });
  });
});