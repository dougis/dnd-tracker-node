import { Encounter, Participant, Character, Creature } from '@prisma/client';
import { vi } from 'vitest';

export type MockEncounter = Encounter & {
  participants: (Participant & {
    character?: Character | null;
    creature?: Creature | null;
  })[];
  lairActions: any[];
};

export type MockParticipant = Participant & {
  character?: Character | null;
  creature?: Creature | null;
};

// Common Prisma include pattern for encounters
export const encounterIncludePattern = {
  participants: {
    include: {
      character: true,
      creature: true,
    },
  },
  lairActions: true,
};

// Mock data factory for encounters
export const createMockEncounter = (overrides: Partial<MockEncounter> = {}): MockEncounter => ({
  id: 'encounter_1',
  userId: 'user_123',
  name: 'Test Encounter',
  description: 'A test encounter',
  status: 'PLANNING',
  round: 1,
  turn: 0,
  isActive: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  participants: [],
  lairActions: [],
  ...overrides,
});

// Mock data factory for participants
export const createMockParticipant = (overrides: Partial<MockParticipant> = {}): MockParticipant => ({
  id: 'participant_1',
  encounterId: 'encounter_1',
  type: 'CHARACTER',
  characterId: 'char_1',
  creatureId: null,
  name: 'Test Character',
  initiative: 15,
  initiativeRoll: 10,
  currentHp: 25,
  maxHp: 25,
  tempHp: 0,
  ac: 16,
  conditions: [],
  isActive: true,
  notes: null,
  character: null,
  creature: null,
  ...overrides,
});

// Mock data factory for characters
export const createMockCharacter = (overrides = {}) => ({
  id: 'char_1',
  userId: 'user_123',
  name: 'Test Character',
  level: 5,
  race: 'Human',
  classes: [{ name: 'Fighter', level: 5 }],
  hitPoints: 25,
  armorClass: 16,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

// Helper to create mock encounter with participants
export const createMockEncounterWithParticipants = (
  encounterOverrides: Partial<MockEncounter> = {},
  participants: Partial<MockParticipant>[] = []
): MockEncounter => {
  const mockEncounter = createMockEncounter(encounterOverrides);
  
  if (participants.length === 0) {
    participants = [{}]; // Default single participant
  }
  
  mockEncounter.participants = participants.map((partOverrides, index) => 
    createMockParticipant({
      id: `participant_${index + 1}`,
      encounterId: mockEncounter.id,
      ...partOverrides,
    })
  );
  
  return mockEncounter;
};

// Helper for error response assertions in route tests
export const expectErrorResponse = (response: any, statusCode: number, message: string) => {
  expect(response.status).toBe(statusCode);
  expect(response.body).toEqual({
    success: false,
    message,
  });
};

// Helper for successful encounter response assertions
export const expectEncounterResponse = (response: any, expectedEncounter: any) => {
  expect(response.status).toBe(200);
  expect(response.body).toEqual({
    success: true,
    data: {
      encounter: expectedEncounter,
    },
  });
};

// Helper for successful list response assertions
export const expectEncounterListResponse = (response: any, expectedEncounters: any[]) => {
  expect(response.status).toBe(200);
  expect(response.body).toEqual({
    success: true,
    data: { encounters: expectedEncounters },
  });
};

// Helper for successful encounter creation response
export const expectEncounterCreationResponse = (response: any, expectedEncounter: any, message = 'Encounter created successfully') => {
  expect(response.status).toBe(201);
  expect(response.body).toEqual({
    success: true,
    data: { encounter: expectedEncounter },
    message,
  });
};

// Helper for successful encounter update response  
export const expectEncounterUpdateResponse = (response: any, expectedEncounter: MockEncounter, message = 'Encounter updated successfully') => {
  expect(response.status).toBe(200);
  expect(response.body).toEqual({
    success: true,
    data: { encounter: expectedEncounter },
    message,
  });
};

// Helper for successful encounter operation response
export const expectEncounterOperationResponse = (response: any, expectedEncounter: MockEncounter, message: string) => {
  expect(response.status).toBe(200);
  expect(response.body).toEqual({
    success: true,
    data: { encounter: expectedEncounter },
    message,
  });
};

// Helper for successful deletion response
export const expectDeletionResponse = (response: any, message = 'Encounter deleted successfully') => {
  expect(response.status).toBe(200);
  expect(response.body).toEqual({
    success: true,
    message,
  });
};

// Helper for validation error response
export const expectValidationErrorResponse = (response: any, errors?: any[]) => {
  expect(response.status).toBe(400);
  const expectedBody: any = {
    success: false,
    message: 'Validation failed',
  };
  if (errors) {
    expectedBody.errors = errors;
  }
  expect(response.body).toEqual(expectedBody);
};

// Common participant data for tests
export const createMockParticipantData = (overrides: Partial<any> = {}) => ({
  type: 'CHARACTER',
  name: 'Test Character',
  initiative: 15,
  currentHp: 25,
  maxHp: 25,
  ac: 16,
  characterId: 'char_1',
  ...overrides,
});

// Helper for mocking Prisma service responses
export const mockPrismaCreate = (mockPrisma: any, result: any) => {
  mockPrisma.encounter.create.mockResolvedValue(result);
};

// Helper to transform MockEncounter to API response format (excluding userId, converting dates)
export const createExpectedApiEncounter = (encounter: MockEncounter) => ({
  id: encounter.id,
  name: encounter.name,
  description: encounter.description,
  status: encounter.status,
  round: encounter.round,
  turn: encounter.turn,
  isActive: encounter.isActive,
  participants: encounter.participants,
  lairActions: encounter.lairActions,
  createdAt: encounter.createdAt.toISOString(),
  updatedAt: encounter.updatedAt.toISOString()
});

// Helper to transform array of MockEncounter to API response format
export const createExpectedApiEncounters = (encounters: MockEncounter[]) => 
  encounters.map(createExpectedApiEncounter);

export const mockPrismaFindMany = (mockPrisma: any, result: any[]) => {
  mockPrisma.encounter.findMany.mockResolvedValue(result);
};

export const mockPrismaFindUnique = (mockPrisma: any, result: any) => {
  mockPrisma.encounter.findUnique.mockResolvedValue(result);
};

export const mockPrismaUpdate = (mockPrisma: any, result: any) => {
  mockPrisma.encounter.update.mockResolvedValue(result);
};

export const mockPrismaDelete = (mockPrisma: any) => {
  mockPrisma.encounter.delete.mockResolvedValue({});
};

// Helper for creating participants with initiative/roll values for combat tests
export const createCombatParticipant = (id: string, initiative: number, initiativeRoll?: number | null, isActive = true): MockParticipant => 
  createMockParticipant({ id, initiative, initiativeRoll: initiativeRoll ?? null, isActive });

// Helper for creating multiple combat participants quickly
export const createCombatParticipants = (participantData: Array<{ id: string; initiative: number; initiativeRoll?: number | null; isActive?: boolean }>): MockParticipant[] =>
  participantData.map(data => createCombatParticipant(data.id, data.initiative, data.initiativeRoll, data.isActive));

// Standard Prisma include pattern for encounter operations with participants and lairActions
export const standardEncounterInclude = {
  participants: {
    include: {
      character: true,
      creature: true,
    },
  },
  lairActions: true,
};

// Helper for creating participant data for add participant tests
export const createParticipantData = (overrides = {}) => ({
  type: 'CHARACTER' as const,
  characterId: 'character_123',
  name: 'Test Character',
  initiative: 15,
  initiativeRoll: 12,
  currentHp: 25,
  maxHp: 25,
  tempHp: 0,
  ac: 16,
  conditions: [],
  notes: 'Test notes',
  ...overrides,
});

// Helper for basic participant data with minimal required fields
export const createBasicParticipantData = (overrides = {}) => ({
  type: 'CHARACTER' as const,
  name: 'Test',
  initiative: 10,
  currentHp: 10,
  maxHp: 10,
  ac: 10,
  ...overrides,
});

// Helper for setting up common mocks in participant HP tests
export const setupParticipantHpMocks = (mockPrisma: any, mockEncounter: any, mockParticipant: any) => {
  mockPrisma.encounter.findUnique.mockResolvedValue({ userId: 'user_123' });
  mockPrisma.participant.findUnique.mockResolvedValue(mockParticipant);
  mockPrisma.participant.update.mockResolvedValue({});
  return mockEncounter;
};

// Helper for standard encounter creation data
export const createEncounterData = (userId: string, name: string, description?: string | null) => ({
  userId,
  name,
  description: description ?? null,
  status: 'PLANNING',
  round: 1,
  turn: 0,
  isActive: false,
});

// Common HTTP test helpers for routes testing
export const expectSuccessfulResponse = (response: any, statusCode: number, message?: string) => {
  expect(response.status).toBe(statusCode);
  expect(response.body.success).toBe(true);
  if (message) {
    expect(response.body.message).toBe(message);
  }
};

export const expectFailureResponse = (response: any, statusCode: number, message?: string) => {
  expect(response.status).toBe(statusCode);
  expect(response.body.success).toBe(false);
  if (message) {
    expect(response.body.message).toBe(message);
  }
};

// Helper for setting up service mocks with consistent data
export const setupEncounterServiceMock = (encounterServiceMock: any, method: string, returnValue: any) => {
  encounterServiceMock[method].mockResolvedValue(returnValue);
};

export const setupEncounterServiceError = (encounterServiceMock: any, method: string, error: Error) => {
  encounterServiceMock[method].mockRejectedValue(error);
};

// Helper for creating test requests with consistent patterns
export const createTestRequest = (app: any, method: string, path: string, data?: any) => {
  const request = require('supertest')(app)[method](path);
  if (data && (method === 'post' || method === 'put')) {
    return request.send(data);
  }
  return request;
};

// Helper for validating service method calls
export const expectServiceCall = (serviceMock: any, method: string, ...args: any[]) => {
  expect(serviceMock[method]).toHaveBeenCalledWith(...args);
};

// Standard test data factories for routes
export const createValidEncounterData = () => ({
  name: 'Test Encounter',
  description: 'Test description'
});

export const createValidParticipantData = () => ({
  type: 'CHARACTER' as const,
  characterId: '507f1f77bcf86cd799439012',
  name: 'Test Character',
  initiative: 15,
  currentHp: 25,
  maxHp: 25,
  ac: 16
});

// Helper for creating validation error expectations
export const createValidationError = (location: string, msg: string, path: string, value?: any) => {
  const error: any = { location, msg, path, type: 'field' };
  if (value !== undefined) {
    error.value = value;
  }
  return error;
};

// Helper for testing different MongoDB ID formats
export const VALID_MONGO_ID = '507f1f77bcf86cd799439011';
export const INVALID_MONGO_ID = 'invalid_id';

// Helper for testing encounters with different ownership
export const createUnauthorizedEncounter = (baseEncounter: MockEncounter) => ({
  ...baseEncounter,
  userId: 'other_user'
});

// Helper for testing encounter status transitions
export const createActiveEncounter = (baseEncounter: MockEncounter) => ({
  ...baseEncounter,
  status: 'ACTIVE',
  isActive: true
});

export const createCompletedEncounter = (baseEncounter: MockEncounter) => ({
  ...baseEncounter,
  status: 'COMPLETED',
  isActive: false
});

// Helper for testing participant addition
export const createEncounterWithParticipant = (baseEncounter: MockEncounter, participant: MockParticipant) => ({
  ...baseEncounter,
  participants: [participant]
});

// Helper for testing updated encounters
export const createUpdatedEncounter = (baseEncounter: MockEncounter, updates: Partial<MockEncounter>) => ({
  ...baseEncounter,
  ...updates
});

// Service test utilities - Mock Prisma setup helpers
export const setupPrismaEncounterMock = (mockPrisma: any, result: any) => {
  mockPrisma.encounter.findUnique.mockResolvedValue(result);
};

export const setupPrismaParticipantMock = (mockPrisma: any, result: any) => {
  mockPrisma.participant.findUnique.mockResolvedValue(result);
};

export const setupPrismaParticipantCreate = (mockPrisma: any, result: any = {}) => {
  mockPrisma.participant.create.mockResolvedValue(result);
};

export const setupPrismaParticipantUpdate = (mockPrisma: any, result: any = {}) => {
  mockPrisma.participant.update.mockResolvedValue(result);
};

// Helper for service spy setup
export const spyOnServiceMethod = (service: any, method: string, returnValue: any) => {
  return vi.spyOn(service, method).mockResolvedValue(returnValue);
};

// Common participant HP update test scenarios
export const createHpUpdateScenario = (currentHp: number, maxHp: number) => ({
  encounter: createMockEncounter(),
  participant: createMockParticipant({ currentHp, maxHp })
});

// Helper for expected participant update calls with HP changes
export const expectParticipantHpUpdate = (mockPrisma: any, participantId: string, expectedHp: number, expectedTempHp = 0) => {
  expect(mockPrisma.participant.update).toHaveBeenCalledWith({
    where: { id: participantId },
    data: {
      currentHp: expectedHp,
      tempHp: expectedTempHp
    }
  });
};

// Helper for expected participant creation calls
export const expectParticipantCreation = (mockPrisma: any, encounterId: string, participantData: any) => {
  expect(mockPrisma.participant.create).toHaveBeenCalledWith({
    data: {
      encounterId,
      type: participantData.type,
      characterId: participantData.characterId || null,
      creatureId: participantData.creatureId || null,
      name: participantData.name,
      initiative: participantData.initiative,
      initiativeRoll: participantData.initiativeRoll || null,
      currentHp: participantData.currentHp,
      maxHp: participantData.maxHp,
      tempHp: participantData.tempHp || 0,
      ac: participantData.ac,
      conditions: participantData.conditions || [],
      notes: participantData.notes || null
    }
  });
};

// Helper for service method result expectations
export const expectServiceResult = (actualResult: any, expectedResult: any) => {
  expect(actualResult).toEqual(expectedResult);
};

// Common error test scenarios
export const createEncounterNotFoundScenario = () => ({
  prismaResult: null,
  expectedError: 'Encounter not found'
});

export const createParticipantNotFoundScenario = () => ({
  encounterResult: { userId: 'user_123' },
  participantResult: null,
  expectedError: 'Participant not found'
});

export const createParticipantWrongEncounterScenario = () => ({
  encounterResult: { userId: 'user_123' },
  participantResult: createMockParticipant({ encounterId: 'other_encounter' }),
  expectedError: 'Participant does not belong to this encounter'
});

// Helper for setting up full participant HP test mocks
export const setupCompleteParticipantHpTest = (mockPrisma: any, scenario: any, service: any) => {
  setupPrismaEncounterMock(mockPrisma, { userId: 'user_123' });
  setupPrismaParticipantMock(mockPrisma, scenario.participant);
  setupPrismaParticipantUpdate(mockPrisma);
  spyOnServiceMethod(service, 'getEncounterById', scenario.encounter);
  return scenario;
};

// Participant service test helpers for comprehensive duplication elimination

// Helper for standard participant HP update test
export const createParticipantHpUpdateTest = (currentHp: number, maxHp: number, hpChange: { damage?: number; healing?: number }, expectedHp: number) => {
  return async (service: any, mockPrisma: any) => {
    // Arrange
    const scenario = createHpUpdateScenario(currentHp, maxHp);
    setupCompleteParticipantHpTest(mockPrisma, scenario, service);

    // Act
    const result = await service.updateParticipantHp(
      'participant_123',
      scenario.encounter.id,
      'user_123',
      hpChange
    );

    // Assert
    expectParticipantHpUpdate(mockPrisma, 'participant_123', expectedHp);
    expectServiceResult(result, scenario.encounter);
    return result;
  };
};

// Helper for standard participant addition test
export const createParticipantAddTest = (participantDataFactory: () => any) => {
  return async (service: any, mockPrisma: any) => {
    // Arrange
    const mockEncounter = createMockEncounter();
    const participantData = participantDataFactory();
    setupPrismaEncounterMock(mockPrisma, { userId: 'user_123' });
    setupPrismaParticipantCreate(mockPrisma);
    spyOnServiceMethod(service, 'getEncounterById', mockEncounter);

    // Act
    const result = await service.addParticipant('encounter_123', 'user_123', participantData);

    // Assert
    expectParticipantCreation(mockPrisma, 'encounter_123', participantData);
    expectServiceResult(result, mockEncounter);
    return result;
  };
};

// Helper for standard error scenario test
export const createParticipantErrorTest = (scenarioFactory: () => any, serviceMethod: string, serviceArgs: any[]) => {
  return async (service: any, mockPrisma: any) => {
    // Arrange
    const scenario = scenarioFactory();
    if (scenario.encounterResult !== undefined) {
      setupPrismaEncounterMock(mockPrisma, scenario.encounterResult);
    }
    if (scenario.participantResult !== undefined) {
      setupPrismaParticipantMock(mockPrisma, scenario.participantResult);
    }
    if (scenario.prismaResult !== undefined) {
      setupPrismaEncounterMock(mockPrisma, scenario.prismaResult);
    }

    // Act & Assert
    await expect(service[serviceMethod](...serviceArgs))
      .rejects.toThrow(scenario.expectedError);
  };
};

// Helper for creating comprehensive HP update test scenarios
export const createHpUpdateTestScenarios = () => ({
  damage: {
    testName: 'should update participant HP with damage',
    currentHp: 25,
    maxHp: 30,
    change: { damage: 10 },
    expectedHp: 15
  },
  healing: {
    testName: 'should update participant HP with healing',
    currentHp: 15,
    maxHp: 30,
    change: { healing: 10 },
    expectedHp: 25
  },
  damageBelowZero: {
    testName: 'should not allow HP to go below 0',
    currentHp: 5,
    maxHp: 30,
    change: { damage: 10 },
    expectedHp: 0
  },
  healingAboveMax: {
    testName: 'should not allow healing above max HP',
    currentHp: 25,
    maxHp: 30,
    change: { healing: 10 },
    expectedHp: 30
  }
});

// Helper for creating comprehensive error test scenarios
export const createParticipantErrorTestScenarios = () => ({
  encounterNotFound: {
    testName: 'should throw error when encounter not found',
    scenarioFactory: createEncounterNotFoundScenario,
    serviceMethod: 'updateParticipantHp',
    serviceArgs: ['participant_123', 'nonexistent', 'user_123', { damage: 5 }]
  },
  participantNotFound: {
    testName: 'should throw error when participant not found',
    scenarioFactory: createParticipantNotFoundScenario,
    serviceMethod: 'updateParticipantHp',
    serviceArgs: ['nonexistent', 'encounter_123', 'user_123', { damage: 5 }]
  },
  wrongEncounter: {
    testName: 'should throw error when participant does not belong to encounter',
    scenarioFactory: createParticipantWrongEncounterScenario,
    serviceMethod: 'updateParticipantHp',
    serviceArgs: ['participant_123', 'encounter_123', 'user_123', { damage: 5 }]
  }
});

// Helper for generating systematic HP update tests
export const generateHpUpdateTests = (testScenarios: any) => {
  return Object.values(testScenarios).map((scenario: any) => ({
    testName: scenario.testName,
    test: createParticipantHpUpdateTest(scenario.currentHp, scenario.maxHp, scenario.change, scenario.expectedHp)
  }));
};

// Helper for generating systematic error tests
export const generateErrorTests = (errorScenarios: any) => {
  return Object.values(errorScenarios).map((scenario: any) => ({
    testName: scenario.testName,
    test: createParticipantErrorTest(scenario.scenarioFactory, scenario.serviceMethod, scenario.serviceArgs)
  }));
};

// Combat operations test helpers for comprehensive duplication elimination

// Helper for standard initiative order test
export const createInitiativeOrderTest = (participants: Array<{id: string, initiative: number, initiativeRoll?: number | null, isActive?: boolean}>, expectedOrder: string[]) => {
  return (service: any) => {
    // Arrange
    const testParticipants = createCombatParticipants(participants);

    // Act
    const result = service.calculateInitiativeOrder(testParticipants);

    // Assert
    expectInitiativeOrderResult(result, expectedOrder);
    return result;
  };
};

// Helper for standard combat start test
export const createCombatStartTest = (encounterFactory: () => any) => {
  return async (service: any, mockPrisma: any) => {
    // Arrange
    const mockEncounter = encounterFactory();
    setupCombatOperationTest(mockPrisma, service, mockEncounter);

    // Act
    const result = await service.startCombat('encounter_123', 'user_123');

    // Assert
    expectCombatStatusUpdate(mockPrisma, 'encounter_123', 'ACTIVE', true, { round: 1, turn: 0 });
    expectServiceResult(result, mockEncounter);
    return result;
  };
};

// Helper for standard combat end test
export const createCombatEndTest = (encounterFactory: () => any) => {
  return async (service: any, mockPrisma: any) => {
    // Arrange
    const mockEncounter = encounterFactory();
    setupEndCombatTest(mockPrisma, mockEncounter);

    // Act
    const result = await service.endCombat('encounter_123', 'user_123');

    // Assert
    expectCombatStatusUpdate(mockPrisma, 'encounter_123', 'COMPLETED', false);
    expectServiceResult(result, mockEncounter);
    return result;
  };
};

// Helper for combat error test
export const createCombatErrorTest = (scenarioFactory: () => any, serviceMethod: string, serviceArgs: any[], encounterFactory?: () => any) => {
  return async (service: any, mockPrisma: any) => {
    // Arrange
    const scenario = scenarioFactory();
    const mockEncounter = encounterFactory ? encounterFactory() : null;
    setupCombatErrorTest(mockPrisma, service, mockEncounter);
    
    if (scenario.prismaResult !== undefined) {
      setupPrismaEncounterMock(mockPrisma, scenario.prismaResult);
    }
    if (scenario.encounterResult !== undefined) {
      setupPrismaEncounterMock(mockPrisma, scenario.encounterResult);
    }

    // Act & Assert
    await expect(service[serviceMethod](...serviceArgs))
      .rejects.toThrow(scenario.expectedError);
  };
};

// Helper for creating comprehensive initiative order test scenarios
export const createInitiativeOrderTestScenarios = () => ({
  basicSorting: {
    testName: 'should sort participants by initiative (highest first)',
    participants: [
      { id: 'p1', initiative: 10, initiativeRoll: 15 },
      { id: 'p2', initiative: 20, initiativeRoll: 10 },
      { id: 'p3', initiative: 15, initiativeRoll: 18 }
    ],
    expectedOrder: ['p2', 'p3', 'p1']
  },
  tiebreaker: {
    testName: 'should use initiative roll as tiebreaker',
    participants: [
      { id: 'p1', initiative: 15, initiativeRoll: 10 },
      { id: 'p2', initiative: 15, initiativeRoll: 18 },
      { id: 'p3', initiative: 15, initiativeRoll: 12 }
    ],
    expectedOrder: ['p2', 'p3', 'p1']
  },
  filterInactive: {
    testName: 'should filter out inactive participants',
    participants: [
      { id: 'p1', initiative: 20, isActive: true },
      { id: 'p2', initiative: 15, isActive: false },
      { id: 'p3', initiative: 10, isActive: true }
    ],
    expectedOrder: ['p1', 'p3']
  },
  stableSort: {
    testName: 'should maintain stable sort for identical initiative values',
    participants: [
      { id: 'p1', initiative: 15, initiativeRoll: null },
      { id: 'p2', initiative: 15, initiativeRoll: null }
    ],
    expectedOrder: ['p1', 'p2']
  }
});

// Helper for creating comprehensive combat operation error scenarios
export const createCombatErrorTestScenarios = () => ({
  encounterNotFound: {
    testName: 'should throw error when encounter not found',
    scenarioFactory: createEncounterNotFoundScenario,
    serviceMethod: 'startCombat',
    serviceArgs: ['nonexistent', 'user_123']
  },
  unauthorized: {
    testName: 'should throw error when user not authorized',
    scenarioFactory: createAuthorizationErrorScenario,
    serviceMethod: 'startCombat',
    serviceArgs: ['encounter_123', 'user_123'],
    encounterFactory: createUnauthorizedCombatScenario
  },
  noParticipants: {
    testName: 'should throw error when no participants',
    scenarioFactory: () => ({ expectedError: 'Cannot start combat with no participants' }),
    serviceMethod: 'startCombat',
    serviceArgs: ['encounter_123', 'user_123'],
    encounterFactory: createNoParticipantsScenario
  }
});

// Helper for creating end combat error scenarios
export const createEndCombatErrorTestScenarios = () => ({
  encounterNotFound: {
    testName: 'should throw error when encounter not found',
    scenarioFactory: createEncounterNotFoundScenario,
    serviceMethod: 'endCombat',
    serviceArgs: ['nonexistent', 'user_123']
  },
  unauthorized: {
    testName: 'should throw error when user not authorized',
    scenarioFactory: createAuthorizationErrorScenario,
    serviceMethod: 'endCombat',
    serviceArgs: ['encounter_123', 'user_123']
  }
});

// Helper for generating systematic initiative order tests
export const generateInitiativeOrderTests = (testScenarios: any) => {
  return Object.values(testScenarios).map((scenario: any) => ({
    testName: scenario.testName,
    test: createInitiativeOrderTest(scenario.participants, scenario.expectedOrder)
  }));
};

// Helper for generating systematic combat error tests
export const generateCombatErrorTests = (errorScenarios: any) => {
  return Object.values(errorScenarios).map((scenario: any) => ({
    testName: scenario.testName,
    test: createCombatErrorTest(scenario.scenarioFactory, scenario.serviceMethod, scenario.serviceArgs, scenario.encounterFactory)
  }));
};

// Basic operations test helpers for comprehensive duplication elimination

// Helper for standard basic operation test (CRUD)
export const createBasicOperationTest = (operation: string, setupData: any, expectedAssertions: any) => {
  return async (service: any, mockPrisma: any) => {
    // Arrange
    setupBasicEncounterTest(mockPrisma, operation, setupData.result, setupData.additionalSetup);

    // Act
    const result = await service[setupData.method](...setupData.args);

    // Assert
    expectedAssertions.forEach((assertion: any) => assertion(mockPrisma, result));
    return result;
  };
};

// Helper for standard validation error test
export const createValidationErrorTest = (scenarioType: string, serviceMethod: string) => {
  return async (service: any) => {
    // Arrange
    const scenario = createValidationErrorScenario(scenarioType);

    // Act & Assert
    if (scenario) {
      await expect(service[serviceMethod](...scenario.params))
        .rejects.toThrow(scenario.expectedError);
    }
  };
};

// Helper for standard service error test (not found, unauthorized, etc.)
export const createServiceErrorTest = (scenarioFactory: () => any, serviceMethod: string, serviceArgs: any[]) => {
  return async (service: any, mockPrisma: any) => {
    // Arrange
    const scenario = scenarioFactory();
    setupPrismaFindUnique(mockPrisma, scenario.prismaResult || scenario.encounterResult);

    // Act & Assert
    await expect(service[serviceMethod](...serviceArgs))
      .rejects.toThrow(scenario.expectedError);
  };
};

// Helper for creating comprehensive validation error scenarios
export const createEncounterValidationErrorScenarios = () => ({
  missingUserId: {
    testName: 'should throw error when userId is missing',
    scenarioType: 'missingUserId',
    serviceMethod: 'createEncounter'
  },
  emptyName: {
    testName: 'should throw error when name is empty',
    scenarioType: 'emptyName',
    serviceMethod: 'createEncounter'
  },
  whitespaceName: {
    testName: 'should throw error when name is only whitespace',
    scenarioType: 'whitespaceName',
    serviceMethod: 'createEncounter'
  },
  longName: {
    testName: 'should throw error when name exceeds 100 characters',
    scenarioType: 'longName',
    serviceMethod: 'createEncounter'
  }
});

// Helper for creating comprehensive service error scenarios
export const createBasicServiceErrorScenarios = () => ({
  updateNotFound: {
    testName: 'should throw error when encounter not found',
    scenarioFactory: createEncounterNotFoundScenario,
    serviceMethod: 'updateEncounter',
    serviceArgs: ['nonexistent', 'user_123', { name: 'Test' }]
  },
  updateUnauthorized: {
    testName: 'should throw error when user not authorized',
    scenarioFactory: createAuthorizationErrorScenario,
    serviceMethod: 'updateEncounter',
    serviceArgs: ['encounter_123', 'user_123', { name: 'Test' }]
  },
  deleteNotFound: {
    testName: 'should throw error when encounter not found',
    scenarioFactory: createEncounterNotFoundScenario,
    serviceMethod: 'deleteEncounter',
    serviceArgs: ['nonexistent', 'user_123']
  },
  deleteUnauthorized: {
    testName: 'should throw error when user not authorized',
    scenarioFactory: createAuthorizationErrorScenario,
    serviceMethod: 'deleteEncounter',
    serviceArgs: ['encounter_123', 'user_123']
  }
});

// Helper for generating systematic validation error tests
export const generateValidationErrorTests = (validationScenarios: any) => {
  return Object.values(validationScenarios).map((scenario: any) => ({
    testName: scenario.testName,
    test: createValidationErrorTest(scenario.scenarioType, scenario.serviceMethod)
  }));
};

// Helper for generating systematic service error tests
export const generateServiceErrorTests = (errorScenarios: any) => {
  return Object.values(errorScenarios).map((scenario: any) => ({
    testName: scenario.testName,
    test: createServiceErrorTest(scenario.scenarioFactory, scenario.serviceMethod, scenario.serviceArgs)
  }));
};

// Helper for creating encounter creation test
export const createEncounterCreationTestHelper = (scenarioParams: [string, string, string?]) => {
  return async (service: any, mockPrisma: any) => {
    // Arrange
    const scenario = createEncounterCreationScenario(...scenarioParams);
    setupBasicEncounterTest(mockPrisma, 'create', scenario.mockData);

    // Act
    const result = await service.createEncounter(scenario.params.userId, scenario.params.name, scenario.params.description);

    // Assert
    expectEncounterCreation(mockPrisma, scenario.expectedData);
    expectServiceResult(result, scenario.mockData);
    return result;
  };
};

// Helper for creating encounter retrieval test
export const createEncounterRetrievalTest = (mockData: any, encounterId: string) => {
  return async (service: any, mockPrisma: any) => {
    // Arrange
    setupBasicEncounterTest(mockPrisma, 'findUnique', mockData);

    // Act
    const result = await service.getEncounterById(encounterId);

    // Assert
    expectEncounterFindUnique(mockPrisma, encounterId);
    if (mockData) {
      expectServiceResult(result, mockData);
    } else {
      expect(result).toBeNull();
    }
    return result;
  };
};

// Combat operations helpers
export const setupPrismaEncounterUpdate = (mockPrisma: any, result: any) => {
  mockPrisma.encounter.update.mockResolvedValue(result);
};

// Helper for creating encounter with participants for combat tests
export const createEncounterWithCombatParticipants = (encounterOverrides = {}, participantData: any[] = []) => {
  const encounter = createMockEncounter(encounterOverrides);
  encounter.participants = participantData.length > 0 
    ? participantData.map(data => createMockParticipant(data))
    : [createMockParticipant()];
  return encounter;
};

// Helper for expected encounter update calls with combat status
export const expectCombatStatusUpdate = (mockPrisma: any, encounterId: string, status: string, isActive: boolean, additionalData = {}) => {
  expect(mockPrisma.encounter.update).toHaveBeenCalledWith({
    where: { id: encounterId },
    data: {
      status,
      isActive,
      ...additionalData
    },
    include: standardEncounterInclude,
  });
};

// Helper for combat start scenarios
export const createCombatStartScenario = (overrides = {}) => {
  return createEncounterWithCombatParticipants(overrides);
};

// Helper for unauthorized access scenarios  
export const createUnauthorizedCombatScenario = () => {
  return createMockEncounter({ userId: 'other_user' });
};

// Helper for no participants scenario
export const createNoParticipantsScenario = () => {
  return createMockEncounter({ participants: [] });
};

// Helper for setting up combat operation test mocks
export const setupCombatOperationTest = (mockPrisma: any, service: any, encounter: any) => {
  spyOnServiceMethod(service, 'getEncounterById', encounter);
  setupPrismaEncounterUpdate(mockPrisma, encounter);
  return encounter;
};

// Helper for setting up combat operation error tests
export const setupCombatErrorTest = (mockPrisma: any, service: any, encounterResult: any) => {
  spyOnServiceMethod(service, 'getEncounterById', encounterResult);
};

// Helper for end combat scenarios
export const setupEndCombatTest = (mockPrisma: any, encounter: any) => {
  setupPrismaEncounterMock(mockPrisma, { userId: 'user_123' });
  setupPrismaEncounterUpdate(mockPrisma, encounter);
  return encounter;
};

// Common authorization error scenarios
export const createAuthorizationErrorScenario = () => ({
  encounterResult: { userId: 'other_user' },
  expectedError: 'Not authorized to modify this encounter'
});

// Helper for testing initiative order results
export const expectInitiativeOrderResult = (result: any[], expectedIds: string[]) => {
  expect(result.map(p => p.id)).toEqual(expectedIds);
};

// Basic operations helpers
export const setupPrismaCreate = (mockPrisma: any, result: any) => {
  mockPrisma.encounter.create.mockResolvedValue(result);
};

export const setupPrismaFindUnique = (mockPrisma: any, result: any) => {
  mockPrisma.encounter.findUnique.mockResolvedValue(result);
};

export const setupPrismaFindMany = (mockPrisma: any, result: any) => {
  mockPrisma.encounter.findMany.mockResolvedValue(result);
};

export const setupPrismaDelete = (mockPrisma: any, result: any = {}) => {
  mockPrisma.encounter.delete.mockResolvedValue(result);
};

// Helper for expected create calls
export const expectEncounterCreation = (mockPrisma: any, expectedData: any, includePattern = encounterIncludePattern) => {
  expect(mockPrisma.encounter.create).toHaveBeenCalledWith({
    data: expectedData,
    include: includePattern,
  });
};

// Helper for expected findUnique calls
export const expectEncounterFindUnique = (mockPrisma: any, encounterId: string, includePattern = standardEncounterInclude) => {
  expect(mockPrisma.encounter.findUnique).toHaveBeenCalledWith({
    where: { id: encounterId },
    include: includePattern,
  });
};

// Helper for expected findMany calls
export const expectUserEncountersFindMany = (mockPrisma: any, userId: string, includePattern = standardEncounterInclude) => {
  expect(mockPrisma.encounter.findMany).toHaveBeenCalledWith({
    where: { userId },
    include: includePattern,
    orderBy: { updatedAt: 'desc' },
  });
};

// Helper for expected update calls
export const expectEncounterUpdate = (mockPrisma: any, encounterId: string, updateData: any, includePattern = standardEncounterInclude) => {
  expect(mockPrisma.encounter.update).toHaveBeenCalledWith({
    where: { id: encounterId },
    data: updateData,
    include: includePattern,
  });
};

// Helper for expected delete calls
export const expectEncounterDelete = (mockPrisma: any, encounterId: string) => {
  expect(mockPrisma.encounter.delete).toHaveBeenCalledWith({
    where: { id: encounterId }
  });
};

// Create encounter test scenarios
export const createEncounterCreationScenario = (userId: string, name: string, description?: string) => ({
  mockData: createMockEncounter({ userId, name, description: description || null }),
  expectedData: createEncounterData(userId, name, description),
  params: { userId, name, description }
});

// Update encounter test scenarios  
export const createEncounterUpdateScenario = (encounterId: string, userId: string, updates: any) => ({
  encounterId,
  userId,
  updates,
  mockEncounter: createMockEncounter({ id: encounterId, userId, ...updates }),
  ownershipResult: { userId }
});

// Helper for setting up complete basic operation tests
export const setupBasicEncounterTest = (mockPrisma: any, operation: string, result: any, additionalSetup?: any) => {
  switch (operation) {
    case 'create':
      setupPrismaCreate(mockPrisma, result);
      break;
    case 'findUnique':
      setupPrismaFindUnique(mockPrisma, result);
      break;
    case 'findMany':
      setupPrismaFindMany(mockPrisma, result);
      break;
    case 'update':
      setupPrismaFindUnique(mockPrisma, additionalSetup?.ownershipResult);
      setupPrismaEncounterUpdate(mockPrisma, result);
      break;
    case 'delete':
      setupPrismaFindUnique(mockPrisma, additionalSetup?.ownershipResult);
      setupPrismaDelete(mockPrisma, result);
      break;
  }
};

// Route testing helpers - for comprehensive test duplication elimination

// Helper for creating standard successful route test
export const createSuccessfulRouteTest = (method: string, path: string, mockService: any, serviceMethod: string, mockResult: any, expectedStatus = 200, expectedMessage?: string, requestData?: any) => {
  return async (app: any) => {
    // Arrange
    setupEncounterServiceMock(mockService, serviceMethod, mockResult);

    // Act
    const response = await createTestRequest(app, method, path, requestData);

    // Assert
    expectSuccessfulResponse(response, expectedStatus, expectedMessage);
    return response;
  };
};

// Helper for creating standard failure route test
export const createFailureRouteTest = (method: string, path: string, mockService: any, serviceMethod: string, error: Error, expectedStatus: number, expectedMessage?: string, requestData?: any) => {
  return async (app: any) => {
    // Arrange
    setupEncounterServiceError(mockService, serviceMethod, error);

    // Act
    const response = await createTestRequest(app, method, path, requestData);

    // Assert
    expectFailureResponse(response, expectedStatus, expectedMessage);
    return response;
  };
};

// Helper for creating validation error route test
export const createValidationErrorRouteTest = (method: string, path: string, requestData: any, expectedErrors: any[]) => {
  return async (app: any) => {
    // Act
    const response = await createTestRequest(app, method, path, requestData);

    // Assert
    expectValidationErrorResponse(response, expectedErrors);
    return response;
  };
};

// Helper for creating ID format validation test
export const createIdValidationTest = (method: string, pathTemplate: string, requestData?: any) => {
  return async (app: any) => {
    // Act
    const response = await createTestRequest(app, method, pathTemplate.replace(':id', INVALID_MONGO_ID), requestData);

    // Assert
    expectFailureResponse(response, 400);
    return response;
  };
};

// Helper for creating authorization test (encounter not found)
export const createNotFoundTest = (method: string, pathTemplate: string, mockService: any, serviceMethod: string, requestData?: any) => {
  return async (app: any) => {
    // Arrange
    setupEncounterServiceMock(mockService, serviceMethod, null);

    // Act
    const response = await createTestRequest(app, method, pathTemplate.replace(':id', VALID_MONGO_ID), requestData);

    // Assert
    expectFailureResponse(response, 404, 'Encounter not found');
    return response;
  };
};

// Helper for creating unauthorized access test
export const createUnauthorizedTest = (method: string, pathTemplate: string, mockService: any, serviceMethod: string, mockEncounter: any, requestData?: any) => {
  return async (app: any) => {
    // Arrange
    const unauthorizedEncounter = createUnauthorizedEncounter(mockEncounter);
    setupEncounterServiceMock(mockService, serviceMethod, unauthorizedEncounter);

    // Act
    const response = await createTestRequest(app, method, pathTemplate.replace(':id', VALID_MONGO_ID), requestData);

    // Assert
    expectFailureResponse(response, 403, 'Not authorized to access this encounter');
    return response;
  };
};

// Helper for creating encounter creation test
export const createEncounterCreationTest = (requestData: any, mockService: any, mockEncounter: any) => {
  return async (app: any) => {
    // Arrange
    setupEncounterServiceMock(mockService, 'createEncounter', mockEncounter);

    // Act
    const response = await createTestRequest(app, 'post', '/api/encounters', requestData);

    // Assert
    expectEncounterCreationResponse(response, createExpectedApiEncounter(mockEncounter));
    return response;
  };
};

// Helper for creating encounter list test
export const createEncounterListTest = (mockService: any, mockEncounters: any[]) => {
  return async (app: any) => {
    // Arrange
    setupEncounterServiceMock(mockService, 'getUserEncounters', mockEncounters);

    // Act
    const response = await createTestRequest(app, 'get', '/api/encounters');

    // Assert
    expectEncounterListResponse(response, createExpectedApiEncounters(mockEncounters));
    return response;
  };
};

// Helper for creating encounter get by ID test
export const createEncounterGetTest = (mockService: any, mockEncounter: any) => {
  return async (app: any) => {
    // Arrange
    setupEncounterServiceMock(mockService, 'getEncounterById', mockEncounter);

    // Act
    const response = await createTestRequest(app, 'get', `/api/encounters/${VALID_MONGO_ID}`);

    // Assert
    expectEncounterResponse(response, createExpectedApiEncounter(mockEncounter));
    return response;
  };
};

// Helper for creating standard field validation tests
export const createFieldValidationTests = (method: string, path: string, baseData: any, fieldValidations: Array<{field: string, value: any, expectedError: string}>) => {
  return fieldValidations.map(validation => ({
    testName: `should return 400 for invalid ${validation.field}`,
    test: async (app: any) => {
      const testData = { ...baseData, [validation.field]: validation.value };
      const response = await createTestRequest(app, method, path, testData);
      expectFailureResponse(response, 400);
      return response;
    }
  }));
};

// Helper for creating comprehensive CRUD test suite
export const createCrudTestSuite = (basePath: string, mockService: any, mockData: any) => {
  return {
    create: {
      success: createEncounterCreationTest(createValidEncounterData(), mockService, mockData.encounter),
      validationError: createValidationErrorRouteTest('post', basePath, {}, [
        createValidationError('body', 'Encounter name must be between 1 and 100 characters', 'name')
      ]),
      serviceError: createFailureRouteTest('post', basePath, mockService, 'createEncounter', new Error('Database error'), 500, 'Internal server error creating encounter', createValidEncounterData())
    },

    read: {
      success: createEncounterGetTest(mockService, mockData.encounter),
      notFound: createNotFoundTest('get', `${basePath}/:id`, mockService, 'getEncounterById'),
      invalidId: createIdValidationTest('get', `${basePath}/:id`),
      unauthorized: createUnauthorizedTest('get', `${basePath}/:id`, mockService, 'getEncounterById', mockData.encounter)
    },

    update: {
      success: createSuccessfulRouteTest('put', `${basePath}/${VALID_MONGO_ID}`, mockService, 'updateEncounter', mockData.encounter, 200, 'Encounter updated successfully', { name: 'Updated Name' }),
      notFound: createFailureRouteTest('put', `${basePath}/${VALID_MONGO_ID}`, mockService, 'updateEncounter', new Error('Encounter not found'), 404, 'Encounter not found', { name: 'Updated Name' }),
      invalidId: createIdValidationTest('put', `${basePath}/:id`, { name: 'Updated Name' }),
      unauthorized: createFailureRouteTest('put', `${basePath}/${VALID_MONGO_ID}`, mockService, 'updateEncounter', new Error('Not authorized to modify this encounter'), 403, 'Not authorized to modify this encounter', { name: 'Updated Name' })
    },

    delete: {
      success: createSuccessfulRouteTest('delete', `${basePath}/${VALID_MONGO_ID}`, mockService, 'deleteEncounter', undefined, 200, 'Encounter deleted successfully'),
      notFound: createFailureRouteTest('delete', `${basePath}/${VALID_MONGO_ID}`, mockService, 'deleteEncounter', new Error('Encounter not found'), 404, 'Encounter not found'),
      invalidId: createIdValidationTest('delete', `${basePath}/:id`)
    }
  };
};

// Validation error scenarios
export const createValidationErrorScenario = (type: string) => {
  const scenarios: Record<string, { params: string[], expectedError: string }> = {
    missingUserId: { params: ['', 'Test'], expectedError: 'User ID is required' },
    emptyName: { params: ['user_123', ''], expectedError: 'Encounter name is required' },
    whitespaceName: { params: ['user_123', '   '], expectedError: 'Encounter name is required' },
    longName: { params: ['user_123', 'a'.repeat(101)], expectedError: 'Encounter name must be 100 characters or less' }
  };
  return scenarios[type];
};

// Helper for name trimming tests
export const expectNameTrimming = (mockPrisma: any, expectedName: string) => {
  expect(mockPrisma.encounter.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        name: expectedName
      })
    })
  );
};