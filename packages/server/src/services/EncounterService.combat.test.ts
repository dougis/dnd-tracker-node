import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient, EncounterStatus } from '@prisma/client';
import { EncounterService } from './EncounterService';
import { 
  createMockEncounter,
  createMockParticipant,
  createCombatParticipants,
  standardEncounterInclude
} from '../test/encounter-test-utils';

// Get mocked Prisma instance
const mockPrisma = new PrismaClient() as any;

describe('EncounterService - Combat Operations', () => {
  let encounterService: EncounterService;

  beforeEach(() => {
    vi.clearAllMocks();
    encounterService = new EncounterService(mockPrisma);
  });

  describe('calculateInitiativeOrder', () => {
    it('should sort participants by initiative (highest first)', () => {
      const participants = createCombatParticipants([
        { id: 'p1', initiative: 10, initiativeRoll: 15 },
        { id: 'p2', initiative: 20, initiativeRoll: 10 },
        { id: 'p3', initiative: 15, initiativeRoll: 18 }
      ]);

      const result = encounterService.calculateInitiativeOrder(participants);

      expect(result.map(p => p.id)).toEqual(['p2', 'p3', 'p1']);
    });

    it('should use initiative roll as tiebreaker', () => {
      const participants = createCombatParticipants([
        { id: 'p1', initiative: 15, initiativeRoll: 10 },
        { id: 'p2', initiative: 15, initiativeRoll: 18 },
        { id: 'p3', initiative: 15, initiativeRoll: 12 }
      ]);

      const result = encounterService.calculateInitiativeOrder(participants);

      expect(result.map(p => p.id)).toEqual(['p2', 'p3', 'p1']);
    });

    it('should filter out inactive participants', () => {
      const participants = createCombatParticipants([
        { id: 'p1', initiative: 20, isActive: true },
        { id: 'p2', initiative: 15, isActive: false },
        { id: 'p3', initiative: 10, isActive: true }
      ]);

      const result = encounterService.calculateInitiativeOrder(participants);

      expect(result.map(p => p.id)).toEqual(['p1', 'p3']);
    });

    it('should maintain stable sort for identical initiative values', () => {
      const participants = createCombatParticipants([
        { id: 'p1', initiative: 15, initiativeRoll: null },
        { id: 'p2', initiative: 15, initiativeRoll: null }
      ]);

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
        include: standardEncounterInclude,
      });
      expect(result).toEqual(mockEncounter);
    });

    it('should throw error when encounter not found', async () => {
      vi.spyOn(encounterService, 'getEncounterById').mockResolvedValue(null);

      await expect(encounterService.startCombat('nonexistent', 'user_123'))
        .rejects.toThrow('Encounter not found');
    });

    it('should throw error when user not authorized', async () => {
      const mockEncounter = createMockEncounter({ userId: 'other_user' });
      vi.spyOn(encounterService, 'getEncounterById').mockResolvedValue(mockEncounter);

      await expect(encounterService.startCombat('encounter_123', 'user_123'))
        .rejects.toThrow('Not authorized to modify this encounter');
    });

    it('should throw error when no participants', async () => {
      const mockEncounter = createMockEncounter({ participants: [] });
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
        include: standardEncounterInclude,
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
});