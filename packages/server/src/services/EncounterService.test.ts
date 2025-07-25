import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient, EncounterStatus, ParticipantType } from '@prisma/client';
import { EncounterService, ParticipantCreateData } from './EncounterService';
import { 
  createMockEncounter, 
  createMockParticipant, 
  createMockEncounterWithParticipants,
  encounterIncludePattern,
  type MockEncounter,
  type MockParticipant 
} from '../test/encounter-test-utils';

// Get mocked Prisma instance
const mockPrisma = new PrismaClient() as any;

describe('EncounterService', () => {
  let encounterService: EncounterService;

  beforeEach(() => {
    vi.clearAllMocks();
    encounterService = new EncounterService(mockPrisma);
  });

  describe('createEncounter', () => {
    it('should create a new encounter successfully', async () => {
      const mockEncounter = createMockEncounter({
        userId: 'user_123',
        name: 'Test Encounter',
        description: 'Test description'
      });
      mockPrisma.encounter.create.mockResolvedValue(mockEncounter);

      const result = await encounterService.createEncounter('user_123', 'Test Encounter', 'Test description');

      expect(mockPrisma.encounter.create).toHaveBeenCalledWith({
        data: {
          userId: 'user_123',
          name: 'Test Encounter',
          description: 'Test description',
          status: EncounterStatus.PLANNING,
          round: 1,
          turn: 0,
          isActive: false,
        },
        include: encounterIncludePattern,
      });
      expect(result).toEqual(mockEncounter);
    });

    it('should create encounter with null description when not provided', async () => {
      const mockEncounter = createMockEncounter({ 
        userId: 'user_123',
        name: 'Test Encounter',
        description: null 
      });
      mockPrisma.encounter.create.mockResolvedValue(mockEncounter);

      await encounterService.createEncounter('user_123', 'Test Encounter');

      expect(mockPrisma.encounter.create).toHaveBeenCalledWith({
        data: {
          userId: 'user_123',
          name: 'Test Encounter',
          description: null,
          status: EncounterStatus.PLANNING,
          round: 1,
          turn: 0,
          isActive: false,
        },
        include: encounterIncludePattern,
      });
    });

    it('should trim encounter name', async () => {
      const mockEncounter = createMockEncounter();
      mockPrisma.encounter.create.mockResolvedValue(mockEncounter);

      await encounterService.createEncounter('user_123', '  Test Encounter  ', 'Test description');

      expect(mockPrisma.encounter.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Test Encounter'
          })
        })
      );
    });

    it('should throw error when userId is missing', async () => {
      await expect(encounterService.createEncounter('', 'Test Encounter'))
        .rejects.toThrow('User ID is required');
    });

    it('should throw error when name is empty', async () => {
      await expect(encounterService.createEncounter('user_123', ''))
        .rejects.toThrow('Encounter name is required');
    });

    it('should throw error when name is only whitespace', async () => {
      await expect(encounterService.createEncounter('user_123', '   '))
        .rejects.toThrow('Encounter name is required');
    });

    it('should throw error when name exceeds 100 characters', async () => {
      const longName = 'a'.repeat(101);
      await expect(encounterService.createEncounter('user_123', longName))
        .rejects.toThrow('Encounter name must be 100 characters or less');
    });
  });

  describe('getEncounterById', () => {
    it('should return encounter when found', async () => {
      const mockEncounter = createMockEncounter();
      mockPrisma.encounter.findUnique.mockResolvedValue(mockEncounter);

      const result = await encounterService.getEncounterById('encounter_123');

      expect(mockPrisma.encounter.findUnique).toHaveBeenCalledWith({
        where: { id: 'encounter_123' },
        include: {
          participants: {
            include: {
              character: true,
              creature: true,
            },
          },
          lairActions: true,
        },
      });
      expect(result).toEqual(mockEncounter);
    });

    it('should return null when encounter not found', async () => {
      mockPrisma.encounter.findUnique.mockResolvedValue(null);

      const result = await encounterService.getEncounterById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getUserEncounters', () => {
    it('should return all encounters for a user', async () => {
      const mockEncounters = [createMockEncounter()];
      mockPrisma.encounter.findMany.mockResolvedValue(mockEncounters);

      const result = await encounterService.getUserEncounters('user_123');

      expect(mockPrisma.encounter.findMany).toHaveBeenCalledWith({
        where: { userId: 'user_123' },
        include: {
          participants: {
            include: {
              character: true,
              creature: true,
            },
          },
          lairActions: true,
        },
        orderBy: { updatedAt: 'desc' },
      });
      expect(result).toEqual(mockEncounters);
    });
  });

  describe('updateEncounter', () => {
    it('should update encounter successfully', async () => {
      const mockEncounter = createMockEncounter();
      mockPrisma.encounter.findUnique.mockResolvedValue({ userId: 'user_123' });
      mockPrisma.encounter.update.mockResolvedValue(mockEncounter);

      const result = await encounterService.updateEncounter('encounter_123', 'user_123', {
        name: 'Updated Name',
        description: 'Updated description',
        status: EncounterStatus.ACTIVE
      });

      expect(mockPrisma.encounter.update).toHaveBeenCalledWith({
        where: { id: 'encounter_123' },
        data: {
          name: 'Updated Name',
          description: 'Updated description',
          status: EncounterStatus.ACTIVE
        },
        include: {
          participants: {
            include: {
              character: true,
              creature: true,
            },
          },
          lairActions: true,
        },
      });
      expect(result).toEqual(mockEncounter);
    });

    it('should throw error when encounter not found', async () => {
      mockPrisma.encounter.findUnique.mockResolvedValue(null);

      await expect(encounterService.updateEncounter('nonexistent', 'user_123', { name: 'Test' }))
        .rejects.toThrow('Encounter not found');
    });

    it('should throw error when user not authorized', async () => {
      mockPrisma.encounter.findUnique.mockResolvedValue({ userId: 'other_user' });

      await expect(encounterService.updateEncounter('encounter_123', 'user_123', { name: 'Test' }))
        .rejects.toThrow('Not authorized to modify this encounter');
    });

    it('should validate name when provided', async () => {
      mockPrisma.encounter.findUnique.mockResolvedValue({ userId: 'user_123' });

      await expect(encounterService.updateEncounter('encounter_123', 'user_123', { name: '' }))
        .rejects.toThrow('Encounter name is required');
    });
  });

  describe('deleteEncounter', () => {
    it('should delete encounter successfully', async () => {
      mockPrisma.encounter.findUnique.mockResolvedValue({ userId: 'user_123' });
      mockPrisma.encounter.delete.mockResolvedValue({});

      await encounterService.deleteEncounter('encounter_123', 'user_123');

      expect(mockPrisma.encounter.delete).toHaveBeenCalledWith({
        where: { id: 'encounter_123' }
      });
    });

    it('should throw error when encounter not found', async () => {
      mockPrisma.encounter.findUnique.mockResolvedValue(null);

      await expect(encounterService.deleteEncounter('nonexistent', 'user_123'))
        .rejects.toThrow('Encounter not found');
    });

    it('should throw error when user not authorized', async () => {
      mockPrisma.encounter.findUnique.mockResolvedValue({ userId: 'other_user' });

      await expect(encounterService.deleteEncounter('encounter_123', 'user_123'))
        .rejects.toThrow('Not authorized to delete this encounter');
    });
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

  describe('calculateInitiativeOrder', () => {
    it('should sort participants by initiative (highest first)', () => {
      const participants = [
        { ...createMockParticipant(), id: 'p1', initiative: 10, initiativeRoll: 15 },
        { ...createMockParticipant(), id: 'p2', initiative: 20, initiativeRoll: 10 },
        { ...createMockParticipant(), id: 'p3', initiative: 15, initiativeRoll: 18 }
      ];

      const result = encounterService.calculateInitiativeOrder(participants);

      expect(result.map(p => p.id)).toEqual(['p2', 'p3', 'p1']);
    });

    it('should use initiative roll as tiebreaker', () => {
      const participants = [
        { ...createMockParticipant(), id: 'p1', initiative: 15, initiativeRoll: 10 },
        { ...createMockParticipant(), id: 'p2', initiative: 15, initiativeRoll: 18 },
        { ...createMockParticipant(), id: 'p3', initiative: 15, initiativeRoll: 12 }
      ];

      const result = encounterService.calculateInitiativeOrder(participants);

      expect(result.map(p => p.id)).toEqual(['p2', 'p3', 'p1']);
    });

    it('should filter out inactive participants', () => {
      const participants = [
        { ...createMockParticipant(), id: 'p1', initiative: 20, isActive: true },
        { ...createMockParticipant(), id: 'p2', initiative: 15, isActive: false },
        { ...createMockParticipant(), id: 'p3', initiative: 10, isActive: true }
      ];

      const result = encounterService.calculateInitiativeOrder(participants);

      expect(result.map(p => p.id)).toEqual(['p1', 'p3']);
    });

    it('should maintain stable sort for identical initiative values', () => {
      const participants = [
        { ...createMockParticipant(), id: 'p1', initiative: 15, initiativeRoll: null },
        { ...createMockParticipant(), id: 'p2', initiative: 15, initiativeRoll: null }
      ];

      const result = encounterService.calculateInitiativeOrder(participants);

      // Order should be maintained since both have same initiative and no rolls
      expect(result.map(p => p.id)).toEqual(['p1', 'p2']);
    });
  });

  describe('startCombat', () => {
    it('should start combat successfully', async () => {
      const mockEncounter = {
        ...createMockEncounter(),
        participants: [createMockParticipant()]
      };
      
      vi.spyOn(encounterService, 'getEncounterById').mockResolvedValue(mockEncounter);
      mockPrisma.encounter.update.mockResolvedValue(mockEncounter);

      const result = await encounterService.startCombat('encounter_123', 'user_123');

      expect(mockPrisma.encounter.update).toHaveBeenCalledWith({
        where: { id: 'encounter_123' },
        data: {
          status: EncounterStatus.ACTIVE,
          isActive: true,
          round: 1,
          turn: 0
        },
        include: {
          participants: {
            include: {
              character: true,
              creature: true,
            },
          },
          lairActions: true,
        },
      });
      expect(result).toEqual(mockEncounter);
    });

    it('should throw error when encounter not found', async () => {
      vi.spyOn(encounterService, 'getEncounterById').mockResolvedValue(null);

      await expect(encounterService.startCombat('nonexistent', 'user_123'))
        .rejects.toThrow('Encounter not found');
    });

    it('should throw error when user not authorized', async () => {
      const mockEncounter = { ...createMockEncounter(), userId: 'other_user' };
      vi.spyOn(encounterService, 'getEncounterById').mockResolvedValue(mockEncounter);

      await expect(encounterService.startCombat('encounter_123', 'user_123'))
        .rejects.toThrow('Not authorized to modify this encounter');
    });

    it('should throw error when no participants', async () => {
      const mockEncounter = { ...createMockEncounter(), participants: [] };
      vi.spyOn(encounterService, 'getEncounterById').mockResolvedValue(mockEncounter);

      await expect(encounterService.startCombat('encounter_123', 'user_123'))
        .rejects.toThrow('Cannot start combat with no participants');
    });
  });

  describe('endCombat', () => {
    it('should end combat successfully', async () => {
      const mockEncounter = createMockEncounter();
      mockPrisma.encounter.findUnique.mockResolvedValue({ userId: 'user_123' });
      mockPrisma.encounter.update.mockResolvedValue(mockEncounter);

      const result = await encounterService.endCombat('encounter_123', 'user_123');

      expect(mockPrisma.encounter.update).toHaveBeenCalledWith({
        where: { id: 'encounter_123' },
        data: {
          status: EncounterStatus.COMPLETED,
          isActive: false
        },
        include: {
          participants: {
            include: {
              character: true,
              creature: true,
            },
          },
          lairActions: true,
        },
      });
      expect(result).toEqual(mockEncounter);
    });

    it('should throw error when encounter not found', async () => {
      mockPrisma.encounter.findUnique.mockResolvedValue(null);

      await expect(encounterService.endCombat('nonexistent', 'user_123'))
        .rejects.toThrow('Encounter not found');
    });

    it('should throw error when user not authorized', async () => {
      mockPrisma.encounter.findUnique.mockResolvedValue({ userId: 'other_user' });

      await expect(encounterService.endCombat('encounter_123', 'user_123'))
        .rejects.toThrow('Not authorized to modify this encounter');
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
        'encounter_123', 
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
        'encounter_123', 
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
        'encounter_123', 
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
        'encounter_123', 
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