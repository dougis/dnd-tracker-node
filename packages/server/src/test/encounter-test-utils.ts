import { Encounter, Participant, Character, Creature } from '@prisma/client';

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
  createMockParticipant({ id, initiative, initiativeRoll, isActive });

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