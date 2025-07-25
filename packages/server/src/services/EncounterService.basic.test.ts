import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient, EncounterStatus } from '@prisma/client';
import { EncounterService } from './EncounterService';
import { 
  createMockEncounter, 
  encounterIncludePattern,
  type MockEncounter
} from '../test/encounter-test-utils';

// Get mocked Prisma instance
const mockPrisma = new PrismaClient() as any;

describe('EncounterService - Basic Operations', () => {
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
});