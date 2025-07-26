import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EncounterService } from '../EncounterService';
import { createMockPrisma, mockEncounterData, mockParticipantData, encounterTestHelpers } from './EncounterService.helpers';

describe('EncounterService - Combat Operations', () => {
  let encounterService: EncounterService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;


  const expectNotAuthorizedError = async (promise: Promise<any>) => {
    await expect(promise).rejects.toThrow('Not authorized to modify this encounter');
    expect(mockPrisma.encounter.update).not.toHaveBeenCalled();
  };

  const expectNotFoundError = async (promise: Promise<any>) => {
    await expect(promise).rejects.toThrow('Encounter not found');
    expect(mockPrisma.encounter.update).not.toHaveBeenCalled();
  };

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    encounterService = new EncounterService(mockPrisma as any);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('startCombat', () => {
    const encounterId = 'encounter123';
    const userId = 'user123';

    it('should start combat successfully', async () => {
      const encounterWithParticipants = encounterTestHelpers.createEncounterWithParticipants();
      const activeCombatEncounter = encounterTestHelpers.createActiveEncounter({ participants: [mockParticipantData] });

      mockPrisma.encounter.findUnique.mockResolvedValue(encounterWithParticipants);
      mockPrisma.encounter.update.mockResolvedValue(activeCombatEncounter);

      const result = await encounterService.startCombat(encounterId, userId);

      expect(result).toEqual(activeCombatEncounter);
      encounterTestHelpers.expectEncounterUpdate(mockPrisma, encounterId, {
        status: 'ACTIVE',
        isActive: true,
        round: 1,
        turn: 0,
      });
    });

    it('should reject if encounter not found', async () => {
      mockPrisma.encounter.findUnique.mockResolvedValue(null);

      await expectNotFoundError(encounterService.startCombat(encounterId, userId));
    });

    it('should reject if user not authorized', async () => {
      const unauthorizedEncounter = encounterTestHelpers.createEncounterWithParticipants([mockParticipantData]);
      unauthorizedEncounter.userId = 'different-user';
      mockPrisma.encounter.findUnique.mockResolvedValue(unauthorizedEncounter);

      await expectNotAuthorizedError(encounterService.startCombat(encounterId, userId));
    });

    it('should reject if no participants', async () => {
      const encounterWithoutParticipants = encounterTestHelpers.createEncounterWithParticipants([]);
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
      const completedEncounter = encounterTestHelpers.createCompletedEncounter();

      mockPrisma.encounter.findUnique.mockResolvedValue({ userId });
      mockPrisma.encounter.update.mockResolvedValue(completedEncounter);

      const result = await encounterService.endCombat(encounterId, userId);

      expect(result).toEqual(completedEncounter);
      encounterTestHelpers.expectEncounterUpdate(mockPrisma, encounterId, {
        status: 'COMPLETED',
        isActive: false,
      });
    });

    it('should reject if encounter not found', async () => {
      mockPrisma.encounter.findUnique.mockResolvedValue(null);

      await expectNotFoundError(encounterService.endCombat(encounterId, userId));
    });

    it('should reject if user not authorized', async () => {
      mockPrisma.encounter.findUnique.mockResolvedValue({ userId: 'different-user' });

      await expectNotAuthorizedError(encounterService.endCombat(encounterId, userId));
    });
  });

  describe('calculateInitiativeOrder', () => {
    it('should sort participants by initiative (higher first)', async () => {
      const participants = [
        encounterTestHelpers.createParticipant({ id: 'p1', initiative: 10, isActive: true }),
        encounterTestHelpers.createParticipant({ id: 'p2', initiative: 15, isActive: true }),
        encounterTestHelpers.createParticipant({ id: 'p3', initiative: 12, isActive: true }),
      ];

      const result = encounterService.calculateInitiativeOrder(participants);

      expect(result).toHaveLength(3);
      expect(result[0]!.id).toBe('p2'); // initiative 15
      expect(result[1]!.id).toBe('p3'); // initiative 12
      expect(result[2]!.id).toBe('p1'); // initiative 10
    });

    it('should use initiative roll as tiebreaker', async () => {
      const participants = [
        encounterTestHelpers.createParticipant({ id: 'p1', initiative: 15, initiativeRoll: 8, isActive: true }),
        encounterTestHelpers.createParticipant({ id: 'p2', initiative: 15, initiativeRoll: 12, isActive: true }),
        encounterTestHelpers.createParticipant({ id: 'p3', initiative: 10, initiativeRoll: 15, isActive: true }),
      ];

      const result = encounterService.calculateInitiativeOrder(participants);

      expect(result).toHaveLength(3);
      expect(result[0]!.id).toBe('p2'); // initiative 15, roll 12
      expect(result[1]!.id).toBe('p1'); // initiative 15, roll 8
      expect(result[2]!.id).toBe('p3'); // initiative 10, roll 15
    });

    it('should filter out inactive participants', async () => {
      const participants = [
        encounterTestHelpers.createParticipant({ id: 'p1', initiative: 15, isActive: true }),
        encounterTestHelpers.createParticipant({ id: 'p2', initiative: 20, isActive: false }),
        encounterTestHelpers.createParticipant({ id: 'p3', initiative: 10, isActive: true }),
      ];

      const result = encounterService.calculateInitiativeOrder(participants);

      expect(result).toHaveLength(2);
      expect(result[0]!.id).toBe('p1'); // initiative 15
      expect(result[1]!.id).toBe('p3'); // initiative 10
    });

    it('should handle participants with same initiative and no roll', async () => {
      const participants = [
        encounterTestHelpers.createParticipant({ id: 'p1', initiative: 15, initiativeRoll: null, isActive: true }),
        encounterTestHelpers.createParticipant({ id: 'p2', initiative: 15, initiativeRoll: null, isActive: true }),
      ];

      const result = encounterService.calculateInitiativeOrder(participants);

      expect(result).toHaveLength(2);
      expect(result[0]!.initiative).toBe(15);
      expect(result[1]!.initiative).toBe(15);
    });
  });
});