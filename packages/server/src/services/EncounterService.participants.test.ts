/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient, ParticipantType } from '@prisma/client';
import { EncounterService, ParticipantCreateData } from './EncounterService';
import { 
  createMockEncounter,
  createMockParticipant,
  createParticipantData,
  createBasicParticipantData,
  setupParticipantHpMocks,
  setupPrismaEncounterMock,
  setupPrismaParticipantCreate,
  spyOnServiceMethod,
  expectParticipantCreation,
  expectServiceResult,
  createHpUpdateScenario,
  setupCompleteParticipantHpTest,
  expectParticipantHpUpdate,
  createEncounterNotFoundScenario,
  createParticipantNotFoundScenario,
  createParticipantWrongEncounterScenario,
  setupPrismaParticipantMock,
  createParticipantAddTest,
  createParticipantErrorTest,
  createHpUpdateTestScenarios,
  createParticipantErrorTestScenarios,
  generateHpUpdateTests,
  generateErrorTests
} from '../test/encounter-test-utils';

// Get mocked Prisma instance
const mockPrisma = new PrismaClient() as any;

describe('EncounterService - Participant Management', () => {
  let encounterService: EncounterService;

  beforeEach(() => {
    vi.clearAllMocks();
    encounterService = new EncounterService(mockPrisma);
  });

  describe('addParticipant', () => {
    it('should add participant successfully', async () => {
      await createParticipantAddTest(() => createParticipantData())(encounterService, mockPrisma);
    });

    it('should throw error when encounter not found', async () => {
      await createParticipantErrorTest(
        createEncounterNotFoundScenario,
        'addParticipant', 
        ['nonexistent', 'user_123', createBasicParticipantData()]
      )(encounterService, mockPrisma);
    });
  });

  describe('updateParticipantHp', () => {
    // Generate comprehensive HP update tests
    const hpUpdateScenarios = createHpUpdateTestScenarios();
    const hpUpdateTests = generateHpUpdateTests(hpUpdateScenarios);
    
    hpUpdateTests.forEach(({ testName, test }) => {
      it(testName, async () => {
        await test(encounterService, mockPrisma);
      });
    });

    // Generate comprehensive error scenario tests
    const errorScenarios = createParticipantErrorTestScenarios();
    const errorTests = generateErrorTests(errorScenarios);
    
    errorTests.forEach(({ testName, test }) => {
      it(testName, async () => {
        await test(encounterService, mockPrisma);
      });
    });
  });
});