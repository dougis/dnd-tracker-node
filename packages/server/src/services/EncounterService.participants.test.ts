import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient, ParticipantType } from '@prisma/client';
import { EncounterService, ParticipantCreateData } from './EncounterService';
import { 
  createMockEncounter,
  createMockParticipant
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
      const mockEncounter = createMockEncounter();
      const participantData: ParticipantCreateData = {
        type: ParticipantType.CHARACTER,
        characterId: 'character_123',
        name: 'Test Character',
        initiative: 15,
        initiativeRoll: 12,
        currentHp: 25,
        maxHp: 25,
        tempHp: 0,
        ac: 16,
        conditions: [],
        notes: 'Test notes'
      };

      mockPrisma.encounter.findUnique.mockResolvedValue({ userId: 'user_123' });
      mockPrisma.participant.create.mockResolvedValue({});
      
      // Mock getEncounterById for the return call
      vi.spyOn(encounterService, 'getEncounterById').mockResolvedValue(mockEncounter);

      const result = await encounterService.addParticipant('encounter_123', 'user_123', participantData);

      expect(mockPrisma.participant.create).toHaveBeenCalledWith({
        data: {
          encounterId: 'encounter_123',
          type: ParticipantType.CHARACTER,
          characterId: 'character_123',
          creatureId: null,
          name: 'Test Character',
          initiative: 15,
          initiativeRoll: 12,
          currentHp: 25,
          maxHp: 25,
          tempHp: 0,
          ac: 16,
          conditions: [],
          notes: 'Test notes'
        }
      });
      expect(result).toEqual(mockEncounter);
    });

    it('should throw error when encounter not found', async () => {
      mockPrisma.encounter.findUnique.mockResolvedValue(null);
      const participantData: ParticipantCreateData = {
        type: ParticipantType.CHARACTER,
        name: 'Test',
        initiative: 10,
        currentHp: 10,
        maxHp: 10,
        ac: 10
      };

      await expect(encounterService.addParticipant('nonexistent', 'user_123', participantData))
        .rejects.toThrow('Encounter not found');
    });
  });

  describe('updateParticipantHp', () => {
    it('should update participant HP with damage', async () => {
      const mockEncounter = createMockEncounter();
      const mockParticipant = { ...createMockParticipant(), currentHp: 25, maxHp: 30 };
      
      mockPrisma.encounter.findUnique.mockResolvedValue({ userId: 'user_123' });
      mockPrisma.participant.findUnique.mockResolvedValue(mockParticipant);
      mockPrisma.participant.update.mockResolvedValue({});
      vi.spyOn(encounterService, 'getEncounterById').mockResolvedValue(mockEncounter);

      const result = await encounterService.updateParticipantHp(
        'participant_123', 
        mockEncounter.id, 
        'user_123', 
        { damage: 10 }
      );

      expect(mockPrisma.participant.update).toHaveBeenCalledWith({
        where: { id: 'participant_123' },
        data: {
          currentHp: 15, // 25 - 10
          tempHp: 0
        }
      });
      expect(result).toEqual(mockEncounter);
    });

    it('should update participant HP with healing', async () => {
      const mockEncounter = createMockEncounter();
      const mockParticipant = { ...createMockParticipant(), currentHp: 15, maxHp: 30 };
      
      mockPrisma.encounter.findUnique.mockResolvedValue({ userId: 'user_123' });
      mockPrisma.participant.findUnique.mockResolvedValue(mockParticipant);
      mockPrisma.participant.update.mockResolvedValue({});
      vi.spyOn(encounterService, 'getEncounterById').mockResolvedValue(mockEncounter);

      await encounterService.updateParticipantHp(
        'participant_123', 
        mockEncounter.id, 
        'user_123', 
        { healing: 10 }
      );

      expect(mockPrisma.participant.update).toHaveBeenCalledWith({
        where: { id: 'participant_123' },
        data: {
          currentHp: 25, // 15 + 10
          tempHp: 0
        }
      });
    });

    it('should not allow HP to go below 0', async () => {
      const mockEncounter = createMockEncounter();
      const mockParticipant = { ...createMockParticipant(), currentHp: 5, maxHp: 30 };
      
      mockPrisma.encounter.findUnique.mockResolvedValue({ userId: 'user_123' });
      mockPrisma.participant.findUnique.mockResolvedValue(mockParticipant);
      mockPrisma.participant.update.mockResolvedValue({});
      vi.spyOn(encounterService, 'getEncounterById').mockResolvedValue(mockEncounter);

      await encounterService.updateParticipantHp(
        'participant_123', 
        mockEncounter.id, 
        'user_123', 
        { damage: 10 }
      );

      expect(mockPrisma.participant.update).toHaveBeenCalledWith({
        where: { id: 'participant_123' },
        data: {
          currentHp: 0, // Max(0, 5 - 10)
          tempHp: 0
        }
      });
    });

    it('should not allow healing above max HP', async () => {
      const mockEncounter = createMockEncounter();
      const mockParticipant = { ...createMockParticipant(), currentHp: 25, maxHp: 30 };
      
      mockPrisma.encounter.findUnique.mockResolvedValue({ userId: 'user_123' });
      mockPrisma.participant.findUnique.mockResolvedValue(mockParticipant);
      mockPrisma.participant.update.mockResolvedValue({});
      vi.spyOn(encounterService, 'getEncounterById').mockResolvedValue(mockEncounter);

      await encounterService.updateParticipantHp(
        'participant_123', 
        mockEncounter.id, 
        'user_123', 
        { healing: 10 }
      );

      expect(mockPrisma.participant.update).toHaveBeenCalledWith({
        where: { id: 'participant_123' },
        data: {
          currentHp: 30, // Min(30, 25 + 10)
          tempHp: 0
        }
      });
    });

    it('should throw error when encounter not found', async () => {
      mockPrisma.encounter.findUnique.mockResolvedValue(null);

      await expect(encounterService.updateParticipantHp('participant_123', 'nonexistent', 'user_123', { damage: 5 }))
        .rejects.toThrow('Encounter not found');
    });

    it('should throw error when participant not found', async () => {
      mockPrisma.encounter.findUnique.mockResolvedValue({ userId: 'user_123' });
      mockPrisma.participant.findUnique.mockResolvedValue(null);

      await expect(encounterService.updateParticipantHp('nonexistent', 'encounter_123', 'user_123', { damage: 5 }))
        .rejects.toThrow('Participant not found');
    });

    it('should throw error when participant does not belong to encounter', async () => {
      mockPrisma.encounter.findUnique.mockResolvedValue({ userId: 'user_123' });
      mockPrisma.participant.findUnique.mockResolvedValue({ 
        ...createMockParticipant(), 
        encounterId: 'other_encounter' 
      });

      await expect(encounterService.updateParticipantHp('participant_123', 'encounter_123', 'user_123', { damage: 5 }))
        .rejects.toThrow('Participant does not belong to this encounter');
    });
  });
});