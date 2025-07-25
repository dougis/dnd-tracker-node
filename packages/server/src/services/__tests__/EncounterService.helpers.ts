import { PrismaMockFactory } from '../../utils/PrismaMockFactory';
import { MockDataFactory } from '../../utils/MockDataFactory';

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