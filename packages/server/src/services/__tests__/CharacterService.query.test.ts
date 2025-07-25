import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CharacterService } from '../CharacterService';
import { 
  createMockParty, 
  createMockCharacter, 
  createMockPrisma 
} from './CharacterService.helpers';

describe('CharacterService - query operations', () => {
  let characterService: CharacterService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    characterService = new CharacterService(mockPrisma);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('findByPartyId', () => {
    it('should return all characters for a valid party', async () => {
      const mockCharacters = [
        createMockCharacter({ id: 'char_1', name: 'Character 1' }),
        createMockCharacter({ id: 'char_2', name: 'Character 2' })
      ];

      mockPrisma.party.findFirst = vi.fn().mockResolvedValue(createMockParty());
      mockPrisma.character.findMany = vi.fn().mockResolvedValue(mockCharacters);

      const result = await characterService.findByPartyId('party_123', 'user_123');

      expect(mockPrisma.party.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'party_123',
          userId: 'user_123',
        },
      });

      expect(mockPrisma.character.findMany).toHaveBeenCalledWith({
        where: {
          partyId: 'party_123',
        },
        orderBy: {
          name: 'asc',
        },
      });

      expect(result).toEqual(mockCharacters);
    });

    it('should return empty array when party has no characters', async () => {
      mockPrisma.party.findFirst = vi.fn().mockResolvedValue(createMockParty());
      mockPrisma.character.findMany = vi.fn().mockResolvedValue([]);

      const result = await characterService.findByPartyId('party_123', 'user_123');

      expect(result).toEqual([]);
    });

    it('should throw error when party not found', async () => {
      mockPrisma.party.findFirst = vi.fn().mockResolvedValue(null);

      await expect(characterService.findByPartyId('party_123', 'user_123'))
        .rejects.toThrow('Failed to fetch characters: Entity not found or does not belong to user');

      expect(mockPrisma.character.findMany).not.toHaveBeenCalled();
    });

    it('should throw error when party belongs to different user', async () => {
      mockPrisma.party.findFirst = vi.fn().mockResolvedValue(null);

      await expect(characterService.findByPartyId('party_123', 'different_user'))
        .rejects.toThrow('Failed to fetch characters: Entity not found or does not belong to user');
    });

    it('should handle database errors', async () => {
      mockPrisma.party.findFirst = vi.fn().mockResolvedValue(createMockParty());
      mockPrisma.character.findMany = vi.fn().mockRejectedValue(new Error('Database error'));

      await expect(characterService.findByPartyId('party_123', 'user_123'))
        .rejects.toThrow('Failed to fetch characters: Database error');
    });

    it('should handle generic errors', async () => {
      mockPrisma.party.findFirst = vi.fn().mockRejectedValue('Unknown error');

      await expect(characterService.findByPartyId('party_123', 'user_123'))
        .rejects.toThrow('Failed to fetch characters');
    });
  });

  describe('findById', () => {
    it('should return character when found', async () => {
      const fixedDate = new Date('2025-01-01T00:00:00.000Z');
      const mockCharacterWithParty = {
        ...createMockCharacter({ createdAt: fixedDate, updatedAt: fixedDate }),
        party: createMockParty()
      };

      mockPrisma.character.findFirst = vi.fn().mockResolvedValue(mockCharacterWithParty);

      const result = await characterService.findById('char_123', 'user_123');

      expect(mockPrisma.character.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'char_123',
          party: {
            userId: 'user_123',
          },
        },
        include: {
          party: true,
        },
      });

      // Should return character without party data
      const expectedCharacter = createMockCharacter({ createdAt: fixedDate, updatedAt: fixedDate });
      expect(result).toEqual(expectedCharacter);
    });

    it('should return null when character not found', async () => {
      mockPrisma.character.findFirst = vi.fn().mockResolvedValue(null);

      const result = await characterService.findById('nonexistent', 'user_123');

      expect(result).toBeNull();
    });

    it('should return null when character belongs to different user', async () => {
      mockPrisma.character.findFirst = vi.fn().mockResolvedValue(null);

      const result = await characterService.findById('char_123', 'different_user');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      mockPrisma.character.findFirst = vi.fn().mockRejectedValue(new Error('Database error'));

      await expect(characterService.findById('char_123', 'user_123'))
        .rejects.toThrow('Failed to fetch character: Database error');
    });

    it('should handle generic errors', async () => {
      mockPrisma.character.findFirst = vi.fn().mockRejectedValue('Unknown error');

      await expect(characterService.findById('char_123', 'user_123'))
        .rejects.toThrow('Failed to fetch character');
    });
  });
});