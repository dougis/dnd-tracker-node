import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EncounterService } from '../EncounterService';
import { createMockPrisma, mockEncounterData, mockParticipantData } from './EncounterService.helpers';

describe('EncounterService - Combat Operations', () => {
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

  describe('startCombat', () => {
    const encounterId = 'encounter123';
    const userId = 'user123';

    it('should start combat successfully', async () => {
      const encounterWithParticipants = {
        ...mockEncounterData,
        participants: [mockParticipantData]
      };
      const activeCombatEncounter = {
        ...encounterWithParticipants,
        status: 'ACTIVE' as const,
        isActive: true,
        round: 1,
        turn: 0
      };

      mockPrisma.encounter.findUnique.mockResolvedValue(encounterWithParticipants);
      mockPrisma.encounter.update.mockResolvedValue(activeCombatEncounter);

      const result = await encounterService.startCombat(encounterId, userId);

      expect(result).toEqual(activeCombatEncounter);
      expect(mockPrisma.encounter.update).toHaveBeenCalledWith({
        where: { id: encounterId },
        data: {
          status: 'ACTIVE',
          isActive: true,
          round: 1,
          turn: 0,
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
    });

    it('should reject if encounter not found', async () => {
      mockPrisma.encounter.findUnique.mockResolvedValue(null);

      await expect(encounterService.startCombat(encounterId, userId))
        .rejects.toThrow('Encounter not found');

      expect(mockPrisma.encounter.update).not.toHaveBeenCalled();
    });

    it('should reject if user not authorized', async () => {
      const unauthorizedEncounter = {
        ...mockEncounterData,
        userId: 'different-user',
        participants: [mockParticipantData]
      };
      mockPrisma.encounter.findUnique.mockResolvedValue(unauthorizedEncounter);

      await expect(encounterService.startCombat(encounterId, userId))
        .rejects.toThrow('Not authorized to modify this encounter');

      expect(mockPrisma.encounter.update).not.toHaveBeenCalled();
    });

    it('should reject if no participants', async () => {
      const encounterWithoutParticipants = {
        ...mockEncounterData,
        participants: []
      };
      mockPrisma.encounter.findUnique.mockResolvedValue(encounterWithoutParticipants);

      await expect(encounterService.startCombat(encounterId, userId))
        .rejects.toThrow('Cannot start combat with no participants');

      expect(mockPrisma.encounter.update).not.toHaveBeenCalled();
    });
  });

  describe('endCombat', () => {
    const encounterId = 'encounter123';
    const userId = 'user123';

    it('should end combat successfully', async () => {
      const completedEncounter = {
        ...mockEncounterData,
        status: 'COMPLETED' as const,
        isActive: false
      };

      mockPrisma.encounter.findUnique.mockResolvedValue({ userId });
      mockPrisma.encounter.update.mockResolvedValue(completedEncounter);

      const result = await encounterService.endCombat(encounterId, userId);

      expect(result).toEqual(completedEncounter);
      expect(mockPrisma.encounter.update).toHaveBeenCalledWith({
        where: { id: encounterId },
        data: {
          status: 'COMPLETED',
          isActive: false,
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
    });

    it('should reject if encounter not found', async () => {
      mockPrisma.encounter.findUnique.mockResolvedValue(null);

      await expect(encounterService.endCombat(encounterId, userId))
        .rejects.toThrow('Encounter not found');

      expect(mockPrisma.encounter.update).not.toHaveBeenCalled();
    });

    it('should reject if user not authorized', async () => {
      mockPrisma.encounter.findUnique.mockResolvedValue({ userId: 'different-user' });

      await expect(encounterService.endCombat(encounterId, userId))
        .rejects.toThrow('Not authorized to modify this encounter');

      expect(mockPrisma.encounter.update).not.toHaveBeenCalled();
    });
  });

  describe('calculateInitiativeOrder', () => {
    it('should sort participants by initiative (higher first)', async () => {
      const participants = [
        { ...mockParticipantData, id: 'p1', initiative: 10, isActive: true },
        { ...mockParticipantData, id: 'p2', initiative: 15, isActive: true },
        { ...mockParticipantData, id: 'p3', initiative: 12, isActive: true },
      ];

      const result = encounterService.calculateInitiativeOrder(participants);

      expect(result[0].id).toBe('p2'); // initiative 15
      expect(result[1].id).toBe('p3'); // initiative 12
      expect(result[2].id).toBe('p1'); // initiative 10
    });

    it('should use initiative roll as tiebreaker', async () => {
      const participants = [
        { ...mockParticipantData, id: 'p1', initiative: 15, initiativeRoll: 8, isActive: true },
        { ...mockParticipantData, id: 'p2', initiative: 15, initiativeRoll: 12, isActive: true },
        { ...mockParticipantData, id: 'p3', initiative: 10, initiativeRoll: 15, isActive: true },
      ];

      const result = encounterService.calculateInitiativeOrder(participants);

      expect(result[0].id).toBe('p2'); // initiative 15, roll 12
      expect(result[1].id).toBe('p1'); // initiative 15, roll 8
      expect(result[2].id).toBe('p3'); // initiative 10, roll 15
    });

    it('should filter out inactive participants', async () => {
      const participants = [
        { ...mockParticipantData, id: 'p1', initiative: 15, isActive: true },
        { ...mockParticipantData, id: 'p2', initiative: 20, isActive: false },
        { ...mockParticipantData, id: 'p3', initiative: 10, isActive: true },
      ];

      const result = encounterService.calculateInitiativeOrder(participants);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('p1'); // initiative 15
      expect(result[1].id).toBe('p3'); // initiative 10
    });

    it('should handle participants with same initiative and no roll', async () => {
      const participants = [
        { ...mockParticipantData, id: 'p1', initiative: 15, initiativeRoll: null, isActive: true },
        { ...mockParticipantData, id: 'p2', initiative: 15, initiativeRoll: null, isActive: true },
      ];

      const result = encounterService.calculateInitiativeOrder(participants);

      expect(result).toHaveLength(2);
      expect(result[0].initiative).toBe(15);
      expect(result[1].initiative).toBe(15);
    });
  });
});