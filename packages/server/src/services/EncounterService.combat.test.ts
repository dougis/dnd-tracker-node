import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient, EncounterStatus } from '@prisma/client';
import { EncounterService } from './EncounterService';
import { 
  createMockEncounter,
  createMockParticipant,
  createCombatParticipants,
  standardEncounterInclude,
  createEncounterWithCombatParticipants,
  expectCombatStatusUpdate,
  createCombatStartScenario,
  createUnauthorizedCombatScenario,
  createNoParticipantsScenario,
  setupCombatOperationTest,
  setupCombatErrorTest,
  setupEndCombatTest,
  createAuthorizationErrorScenario,
  createEncounterNotFoundScenario,
  expectInitiativeOrderResult,
  expectServiceResult,
  setupPrismaEncounterMock,
  createInitiativeOrderTest,
  createCombatStartTest,
  createCombatEndTest,
  createCombatErrorTest,
  createInitiativeOrderTestScenarios,
  createCombatErrorTestScenarios,
  createEndCombatErrorTestScenarios,
  generateInitiativeOrderTests,
  generateCombatErrorTests
} from '../test/encounter-test-utils';

// Get mocked Prisma instance
const mockPrisma = new PrismaClient() as any;

describe('EncounterService - Combat Operations', () => {
  let encounterService: EncounterService;

  beforeEach(() => {
    vi.clearAllMocks();
    encounterService = new EncounterService(mockPrisma);
  });

  describe('calculateInitiativeOrder', () => {
    // Generate comprehensive initiative order tests
    const initiativeOrderScenarios = createInitiativeOrderTestScenarios();
    const initiativeOrderTests = generateInitiativeOrderTests(initiativeOrderScenarios);
    
    initiativeOrderTests.forEach(({ testName, test }) => {
      it(testName, () => {
        test(encounterService);
      });
    });
  });

  describe('startCombat', () => {
    it('should start combat successfully', async () => {
      await createCombatStartTest(createCombatStartScenario)(encounterService, mockPrisma);
    });

    // Generate comprehensive error scenario tests
    const errorScenarios = createCombatErrorTestScenarios();
    const errorTests = generateCombatErrorTests(errorScenarios);
    
    errorTests.forEach(({ testName, test }) => {
      it(testName, async () => {
        await test(encounterService, mockPrisma);
      });
    });
  });

  describe('endCombat', () => {
    it('should end combat successfully', async () => {
      await createCombatEndTest(createMockEncounter)(encounterService, mockPrisma);
    });

    // Generate comprehensive error scenario tests for end combat
    const endCombatErrorScenarios = createEndCombatErrorTestScenarios();
    const endCombatErrorTests = generateCombatErrorTests(endCombatErrorScenarios);
    
    endCombatErrorTests.forEach(({ testName, test }) => {
      it(testName, async () => {
        await test(encounterService, mockPrisma);
      });
    });
  });
});