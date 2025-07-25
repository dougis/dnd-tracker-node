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
export const expectEncounterResponse = (response: any, expectedEncounter: MockEncounter) => {
  expect(response.status).toBe(200);
  expect(response.body).toEqual({
    success: true,
    data: expectedEncounter,
  });
};

// Helper for successful list response assertions
export const expectEncounterListResponse = (response: any, expectedEncounters: MockEncounter[]) => {
  expect(response.status).toBe(200);
  expect(response.body).toEqual({
    success: true,
    data: expectedEncounters,
  });
};