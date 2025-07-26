/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Encounter, Participant, Character, Creature } from '@prisma/client';
import { expect } from 'vitest';
import { MockDataFactory } from '../utils/MockDataFactory';
import { TestPatterns } from '../utils/TestPatterns';
import supertest from 'supertest';

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

// Export consolidated factories from MockDataFactory
export const createMockEncounter = MockDataFactory.createEncounter;
export const createMockParticipant = MockDataFactory.createParticipant;
export const createMockCharacter = MockDataFactory.createCharacter;
export const createValidEncounterData = MockDataFactory.createValidEncounterData;
export const createValidParticipantData = MockDataFactory.createValidParticipantData;
export const createValidationError = MockDataFactory.createValidationError;

// Export common patterns from TestPatterns
export const expectSuccessfulResponse = TestPatterns.expectSuccessfulResponse;
export const expectFailureResponse = TestPatterns.expectFailureResponse;
export const expectErrorResponse = TestPatterns.expectErrorResponse;
export const expectValidationErrorResponse = TestPatterns.expectValidationError;
export const setupEncounterServiceMock = TestPatterns.setupServiceMock;
export const setupEncounterServiceError = TestPatterns.setupServiceError;
export const expectServiceCall = TestPatterns.expectServiceCall;

// Constants
export const VALID_MONGO_ID = MockDataFactory.VALID_MONGO_ID;
export const INVALID_MONGO_ID = MockDataFactory.INVALID_MONGO_ID;

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

export const standardEncounterInclude = encounterIncludePattern;

// Specialized encounter functions that can't be fully consolidated
export const createMockEncounterWithParticipants = (
  encounterOverrides = {},
  participantOverrides: any[] = []
): MockEncounter => {
  const participants = participantOverrides.map((p, index) => 
    createMockParticipant({ id: `participant_${index + 1}`, ...p })
  );
  return createMockEncounter({ participants, ...encounterOverrides });
};

export const expectEncounterResponse = (response: any, expectedEncounter: any) => {
  TestPatterns.expectSuccessResponse(response);
  expect(response.body.data).toEqual(expectedEncounter);
};

export const expectEncounterListResponse = (response: any, expectedEncounters: any[]) => {
  TestPatterns.expectSuccessResponse(response);
  expect(response.body.data).toEqual(expectedEncounters);
};

export const expectEncounterCreationResponse = (response: any, expectedEncounter: any, message = 'Encounter created successfully') => {
  TestPatterns.expectSuccessResponse(response, 201, message);
  expect(response.body.data).toEqual(expectedEncounter);
};

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
  updatedAt: encounter.updatedAt.toISOString(),
});

export const createExpectedApiEncounters = (encounters: MockEncounter[]) => 
  encounters.map(createExpectedApiEncounter);

// Route testing helpers that use consolidated patterns
export const createTestRequest = (app: any, method: string, path: string, data?: any) => {
  const request = supertest(app)[method.toLowerCase()](path);
  return data ? request.send(data) : request;
};

export const createSuccessfulRouteTest = (method: string, path: string, mockService: any, serviceMethod: string, mockResult: any, expectedStatus = 200, expectedMessage?: string, requestData?: any) => {
  return async (app: any) => {
    TestPatterns.setupServiceMock(mockService, serviceMethod, mockResult);
    const response = await createTestRequest(app, method, path, requestData);
    TestPatterns.expectSuccessfulResponse(response, expectedStatus, expectedMessage);
    return response;
  };
};

export const createFailureRouteTest = (method: string, path: string, mockService: any, serviceMethod: string, error: Error, expectedStatus: number, expectedMessage?: string, requestData?: any) => {
  return async (app: any) => {
    TestPatterns.setupServiceError(mockService, serviceMethod, error);
    const response = await createTestRequest(app, method, path, requestData);
    TestPatterns.expectFailureResponse(response, expectedStatus, expectedMessage);
    return response;
  };
};

export const createValidationErrorRouteTest = (method: string, path: string, requestData: any, expectedErrors: any[]) => {
  return async (app: any) => {
    const response = await createTestRequest(app, method, path, requestData);
    TestPatterns.expectValidationError(response, expectedErrors);
    return response;
  };
};

export const createIdValidationTest = (method: string, pathTemplate: string, requestData?: any) => {
  return async (app: any) => {
    const path = pathTemplate.replace(':id', INVALID_MONGO_ID);
    const response = await createTestRequest(app, method, path, requestData);
    TestPatterns.expectFailureResponse(response, 400);
    return response;
  };
};

export const createNotFoundTest = (method: string, pathTemplate: string, mockService: any, serviceMethod: string, requestData?: any) => {
  return async (app: any) => {
    const path = pathTemplate.replace(':id', VALID_MONGO_ID);
    TestPatterns.setupServiceMock(mockService, serviceMethod, null);
    const response = await createTestRequest(app, method, path, requestData);
    TestPatterns.expectFailureResponse(response, 404);
    return response;
  };
};

export const createUnauthorizedTest = (method: string, pathTemplate: string, mockService: any, serviceMethod: string, mockEncounter: any, requestData?: any) => {
  return async (app: any) => {
    const path = pathTemplate.replace(':id', VALID_MONGO_ID);
    TestPatterns.setupServiceMock(mockService, serviceMethod, { ...mockEncounter, userId: 'different_user' });
    const response = await createTestRequest(app, method, path, requestData);
    TestPatterns.expectFailureResponse(response, 403);
    return response;
  };
};

// Specialized encounter state helpers
export const createUnauthorizedEncounter = (baseEncounter: MockEncounter) => ({
  ...baseEncounter,
  userId: 'different_user',
});

export const createActiveEncounter = (baseEncounter: MockEncounter) => ({
  ...baseEncounter,
  status: 'ACTIVE',
  isActive: true,
});

export const createCompletedEncounter = (baseEncounter: MockEncounter) => ({
  ...baseEncounter,
  status: 'COMPLETED',
  isActive: false,
});

export const createEncounterWithParticipant = (baseEncounter: MockEncounter, participant: MockParticipant) => ({
  ...baseEncounter,
  participants: [participant],
});

export const createUpdatedEncounter = (baseEncounter: MockEncounter, updates: Partial<MockEncounter>) => ({
  ...baseEncounter,
  ...updates,
  updatedAt: new Date(),
});

// Consolidated test creation helpers
export const createEncounterCreationTest = (requestData: any, mockService: any, mockEncounter: any) => 
  createSuccessfulRouteTest('post', '/api/encounters', mockService, 'createEncounter', mockEncounter, 201, 'Encounter created successfully', requestData);

export const createEncounterListTest = (mockService: any, mockEncounters: any[]) =>
  createSuccessfulRouteTest('get', '/api/encounters', mockService, 'getUserEncounters', mockEncounters);

export const createEncounterGetTest = (mockService: any, mockEncounter: any) =>
  createSuccessfulRouteTest('get', `/api/encounters/${VALID_MONGO_ID}`, mockService, 'getEncounterById', mockEncounter);

// Field validation helper
export const createFieldValidationTests = (method: string, path: string, baseData: any, fieldValidations: Array<{field: string, value: any, expectedError: string}>) => {
  return fieldValidations.map(({field, value, expectedError}) => ({
    testName: `should return 400 for invalid ${field}`,
    test: createValidationErrorRouteTest(method, path, { ...baseData, [field]: value }, [
      createValidationError('body', expectedError, field, value)
    ])
  }));
};