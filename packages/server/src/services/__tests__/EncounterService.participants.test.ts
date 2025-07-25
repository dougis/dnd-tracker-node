import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EncounterService, ParticipantCreateData } from '../EncounterService';
import { createMockPrisma, mockEncounterData, mockParticipantData } from './EncounterService.helpers';

describe('EncounterService - Participant Operations', () => {
  let encounterService: EncounterService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    encounterService = new EncounterService(mockPrisma);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('addParticipant', () => {
    const encounterId = 'encounter123';
    const userId = 'user123';
    const participantData: ParticipantCreateData = {
      type: 'CHARACTER',
      characterId: 'character123',
      name: 'Test Character',
      initiative: 15,
      initiativeRoll: 12,
      currentHp: 25,
      maxHp: 30,
      tempHp: 5,
      ac: 16,
      conditions: [],
      notes: 'Test notes'
    };

    beforeEach(() => {
      // Mock ownership verification
      mockPrisma.encounter.findUnique.mockResolvedValue({ userId });
      // Mock getEncounterById call at the end
      mockPrisma.encounter.findUnique.mockResolvedValue({
        ...mockEncounterData,
        participants: [mockParticipantData]
      });
    });

    it('should add character participant successfully', async () => {
      const encounterWithParticipant = {
        ...mockEncounterData,
        participants: [mockParticipantData]
      };
      mockPrisma.participant.create.mockResolvedValue(mockParticipantData);
      mockPrisma.encounter.findUnique.mockResolvedValue(encounterWithParticipant);

      const result = await encounterService.addParticipant(encounterId, userId, participantData);

      expect(mockPrisma.participant.create).toHaveBeenCalledWith({
        data: {
          encounterId,
          type: 'CHARACTER',
          characterId: 'character123',
          creatureId: null,
          name: 'Test Character',
          initiative: 15,
          initiativeRoll: 12,
          currentHp: 25,
          maxHp: 30,
          tempHp: 5,
          ac: 16,
          conditions: [],
          notes: 'Test notes',
        },
      });
      expect(result).toEqual(encounterWithParticipant);
    });

    it('should add creature participant successfully', async () => {
      const creatureData: ParticipantCreateData = {
        type: 'CREATURE',
        creatureId: 'creature456',
        name: 'Test Creature',
        initiative: 12,
        currentHp: 20,
        maxHp: 25,
        ac: 14
      };

      mockPrisma.participant.create.mockResolvedValue({});
      mockPrisma.encounter.findUnique.mockResolvedValue(mockEncounterData);

      await encounterService.addParticipant(encounterId, userId, creatureData);

      expect(mockPrisma.participant.create).toHaveBeenCalledWith({
        data: {
          encounterId,
          type: 'CREATURE',
          characterId: null,
          creatureId: 'creature456',
          name: 'Test Creature',
          initiative: 12,
          initiativeRoll: null,
          currentHp: 20,
          maxHp: 25,
          tempHp: 0,
          ac: 14,
          conditions: [],
          notes: null,
        },
      });
    });

    it('should handle optional fields with defaults', async () => {
      const minimalData: ParticipantCreateData = {
        type: 'CHARACTER',
        characterId: 'character123',
        name: 'Minimal Character',
        initiative: 10,
        currentHp: 15,
        maxHp: 20,
        ac: 12
      };

      mockPrisma.participant.create.mockResolvedValue({});
      mockPrisma.encounter.findUnique.mockResolvedValue(mockEncounterData);

      await encounterService.addParticipant(encounterId, userId, minimalData);

      expect(mockPrisma.participant.create).toHaveBeenCalledWith({
        data: {
          encounterId,
          type: 'CHARACTER',
          characterId: 'character123',
          creatureId: null,
          name: 'Minimal Character',
          initiative: 10,
          initiativeRoll: null,
          currentHp: 15,
          maxHp: 20,
          tempHp: 0,
          ac: 12,
          conditions: [],
          notes: null,
        },
      });
    });

    it('should reject if encounter not found', async () => {
      mockPrisma.encounter.findUnique.mockResolvedValue(null);

      await expect(encounterService.addParticipant(encounterId, userId, participantData))
        .rejects.toThrow('Encounter not found');

      expect(mockPrisma.participant.create).not.toHaveBeenCalled();
    });

    it('should reject if user not authorized', async () => {
      mockPrisma.encounter.findUnique.mockResolvedValue({ userId: 'different-user' });

      await expect(encounterService.addParticipant(encounterId, userId, participantData))
        .rejects.toThrow('Not authorized to modify this encounter');

      expect(mockPrisma.participant.create).not.toHaveBeenCalled();
    });
  });

  describe('updateParticipantHp', () => {
    const participantId = 'participant123';
    const encounterId = 'encounter123';
    const userId = 'user123';

    beforeEach(() => {
      // Mock ownership verification
      mockPrisma.encounter.findUnique.mockResolvedValue({ userId });
      // Mock participant lookup
      mockPrisma.participant.findUnique.mockResolvedValue({
        ...mockParticipantData,
        currentHp: 20,
        maxHp: 30,
        tempHp: 5
      });
      // Mock update result
      mockPrisma.participant.update.mockResolvedValue({});
      // Mock final encounter lookup
      mockPrisma.encounter.findUnique.mockResolvedValue(mockEncounterData);
    });

    it('should apply damage correctly', async () => {
      await encounterService.updateParticipantHp(participantId, encounterId, userId, {
        damage: 8
      });

      expect(mockPrisma.participant.update).toHaveBeenCalledWith({
        where: { id: participantId },
        data: {
          currentHp: 12, // 20 - 8
          tempHp: 5,
        },
      });
    });

    it('should apply healing correctly', async () => {
      await encounterService.updateParticipantHp(participantId, encounterId, userId, {
        healing: 5
      });

      expect(mockPrisma.participant.update).toHaveBeenCalledWith({
        where: { id: participantId },
        data: {
          currentHp: 25, // 20 + 5
          tempHp: 5,
        },
      });
    });

    it('should cap healing at max HP', async () => {
      await encounterService.updateParticipantHp(participantId, encounterId, userId, {
        healing: 15 // Would exceed max HP
      });

      expect(mockPrisma.participant.update).toHaveBeenCalledWith({
        where: { id: participantId },
        data: {
          currentHp: 30, // Capped at max HP
          tempHp: 5,
        },
      });
    });

    it('should prevent HP from going below 0', async () => {
      await encounterService.updateParticipantHp(participantId, encounterId, userId, {
        damage: 25 // Would exceed current HP
      });

      expect(mockPrisma.participant.update).toHaveBeenCalledWith({
        where: { id: participantId },
        data: {
          currentHp: 0, // Can't go below 0
          tempHp: 5,
        },
      });
    });

    it('should set HP directly when currentHp provided', async () => {
      await encounterService.updateParticipantHp(participantId, encounterId, userId, {
        currentHp: 15
      });

      expect(mockPrisma.participant.update).toHaveBeenCalledWith({
        where: { id: participantId },
        data: {
          currentHp: 15,
          tempHp: 5,
        },
      });
    });

    it('should update temp HP', async () => {
      await encounterService.updateParticipantHp(participantId, encounterId, userId, {
        tempHp: 10
      });

      expect(mockPrisma.participant.update).toHaveBeenCalledWith({
        where: { id: participantId },
        data: {
          currentHp: 20,
          tempHp: 10,
        },
      });
    });

    it('should prevent temp HP from going below 0', async () => {
      await encounterService.updateParticipantHp(participantId, encounterId, userId, {
        tempHp: -5
      });

      expect(mockPrisma.participant.update).toHaveBeenCalledWith({
        where: { id: participantId },
        data: {
          currentHp: 20,
          tempHp: 0, // Can't go below 0
        },
      });
    });

    it('should cap direct HP set at max HP', async () => {
      await encounterService.updateParticipantHp(participantId, encounterId, userId, {
        currentHp: 35 // Above max HP
      });

      expect(mockPrisma.participant.update).toHaveBeenCalledWith({
        where: { id: participantId },
        data: {
          currentHp: 30, // Capped at max HP
          tempHp: 5,
        },
      });
    });

    it('should reject if encounter not found', async () => {
      mockPrisma.encounter.findUnique.mockResolvedValue(null);

      await expect(encounterService.updateParticipantHp(participantId, encounterId, userId, {
        damage: 5
      })).rejects.toThrow('Encounter not found');

      expect(mockPrisma.participant.update).not.toHaveBeenCalled();
    });

    it('should reject if user not authorized', async () => {
      mockPrisma.encounter.findUnique.mockResolvedValue({ userId: 'different-user' });

      await expect(encounterService.updateParticipantHp(participantId, encounterId, userId, {
        damage: 5
      })).rejects.toThrow('Not authorized to modify this encounter');

      expect(mockPrisma.participant.update).not.toHaveBeenCalled();
    });

    it('should reject if participant not found', async () => {
      mockPrisma.participant.findUnique.mockResolvedValue(null);

      await expect(encounterService.updateParticipantHp(participantId, encounterId, userId, {
        damage: 5
      })).rejects.toThrow('Participant not found');

      expect(mockPrisma.participant.update).not.toHaveBeenCalled();
    });

    it('should reject if participant not in encounter', async () => {
      mockPrisma.participant.findUnique.mockResolvedValue({
        ...mockParticipantData,
        encounterId: 'different-encounter'
      });

      await expect(encounterService.updateParticipantHp(participantId, encounterId, userId, {
        damage: 5
      })).rejects.toThrow('Participant does not belong to this encounter');

      expect(mockPrisma.participant.update).not.toHaveBeenCalled();
    });
  });
});