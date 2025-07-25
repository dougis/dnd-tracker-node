import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CharacterService, UpdateCharacterData } from '../CharacterService';
import { 
  createMockCharacter, 
  createMockPrisma 
} from './CharacterService.helpers';

describe('CharacterService - update operations', () => {
  let characterService: CharacterService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  const validUpdateData: UpdateCharacterData = {
    name: 'Updated Character',
    currentHp: 30,
    tempHp: 5,
    notes: 'Updated notes'
  };

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    characterService = new CharacterService(mockPrisma);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('update', () => {
    it('should update character successfully', async () => {
      const existingCharacter = createMockCharacter();
      const updatedCharacter = createMockCharacter({
        ...validUpdateData,
        name: 'Updated Character',
        notes: 'Updated notes'
      });

      // Mock findById to return existing character
      vi.spyOn(characterService, 'findById').mockResolvedValue(existingCharacter);
      mockPrisma.character.update = vi.fn().mockResolvedValue(updatedCharacter);

      const result = await characterService.update('char_123', 'user_123', validUpdateData);

      expect(characterService.findById).toHaveBeenCalledWith('char_123', 'user_123');
      expect(mockPrisma.character.update).toHaveBeenCalledWith({
        where: {
          id: 'char_123',
        },
        data: {
          name: 'Updated Character',
          currentHp: 30,
          tempHp: 5,
          notes: 'Updated notes',
        },
      });

      expect(result).toEqual(updatedCharacter);
    });

    it('should return null when character not found', async () => {
      vi.spyOn(characterService, 'findById').mockResolvedValue(null);

      const result = await characterService.update('nonexistent', 'user_123', validUpdateData);

      expect(result).toBeNull();
      expect(mockPrisma.character.update).not.toHaveBeenCalled();
    });

    it('should handle string field trimming correctly', async () => {
      const updateDataWithSpaces: UpdateCharacterData = {
        name: '  Trimmed Name  ',
        playerName: '  Trimmed Player  ',
        race: '  Trimmed Race  ',
        notes: '  Trimmed Notes  '
      };

      const existingCharacter = createMockCharacter();
      vi.spyOn(characterService, 'findById').mockResolvedValue(existingCharacter);
      mockPrisma.character.update = vi.fn().mockResolvedValue(createMockCharacter());

      await characterService.update('char_123', 'user_123', updateDataWithSpaces);

      expect(mockPrisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char_123' },
        data: {
          name: 'Trimmed Name',
          playerName: 'Trimmed Player',
          race: 'Trimmed Race',
          notes: 'Trimmed Notes',
        },
      });
    });

    it('should handle null string fields correctly', async () => {
      const updateDataWithNulls: UpdateCharacterData = {
        playerName: '',
        notes: ''
      };

      const existingCharacter = createMockCharacter();
      vi.spyOn(characterService, 'findById').mockResolvedValue(existingCharacter);
      mockPrisma.character.update = vi.fn().mockResolvedValue(createMockCharacter());

      await characterService.update('char_123', 'user_123', updateDataWithNulls);

      expect(mockPrisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char_123' },
        data: {
          playerName: null,
          notes: null,
        },
      });
    });

    it('should update all supported fields', async () => {
      const comprehensiveUpdateData: UpdateCharacterData = {
        name: 'New Name',
        playerName: 'New Player',
        race: 'New Race',
        classes: [{ className: 'Paladin', level: 10 }],
        level: 10,
        ac: 20,
        maxHp: 95,
        currentHp: 75,
        tempHp: 10,
        hitDice: '10d10',
        speed: 25,
        abilities: {
          str: 18,
          dex: 12,
          con: 16,
          int: 14,
          wis: 15,
          cha: 16
        },
        proficiencyBonus: 4,
        features: ['Divine Sense', 'Lay on Hands'],
        equipment: ['Holy Avenger', 'Plate Armor'],
        notes: 'Paladin of justice'
      };

      const existingCharacter = createMockCharacter();
      vi.spyOn(characterService, 'findById').mockResolvedValue(existingCharacter);
      mockPrisma.character.update = vi.fn().mockResolvedValue(createMockCharacter());

      await characterService.update('char_123', 'user_123', comprehensiveUpdateData);

      expect(mockPrisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char_123' },
        data: comprehensiveUpdateData,
      });
    });

    it('should throw error for empty name', async () => {
      const invalidData = { name: '' };

      await expect(characterService.update('char_123', 'user_123', invalidData))
        .rejects.toThrow('Character name cannot be empty');
    });

    it('should throw error for whitespace-only name', async () => {
      const invalidData = { name: '   ' };

      await expect(characterService.update('char_123', 'user_123', invalidData))
        .rejects.toThrow('Character name cannot be empty');
    });

    it('should throw error for empty race', async () => {
      const invalidData = { race: '' };

      await expect(characterService.update('char_123', 'user_123', invalidData))
        .rejects.toThrow('Character race cannot be empty');
    });

    it('should throw error for empty classes array', async () => {
      const invalidData = { classes: [] };

      await expect(characterService.update('char_123', 'user_123', invalidData))
        .rejects.toThrow('Character must have at least one class');
    });

    it('should throw error for negative currentHp', async () => {
      const invalidData = { currentHp: -5 };

      await expect(characterService.update('char_123', 'user_123', invalidData))
        .rejects.toThrow('Current HP cannot be negative');
    });

    it('should throw error for negative tempHp', async () => {
      const invalidData = { tempHp: -3 };

      await expect(characterService.update('char_123', 'user_123', invalidData))
        .rejects.toThrow('Temporary HP cannot be negative');
    });

    it('should handle database errors during update', async () => {
      const existingCharacter = createMockCharacter();
      vi.spyOn(characterService, 'findById').mockResolvedValue(existingCharacter);
      mockPrisma.character.update = vi.fn().mockRejectedValue(new Error('Database error'));

      await expect(characterService.update('char_123', 'user_123', validUpdateData))
        .rejects.toThrow('Failed to update character: Database error');
    });

    it('should handle generic errors during update', async () => {
      const existingCharacter = createMockCharacter();
      vi.spyOn(characterService, 'findById').mockResolvedValue(existingCharacter);
      mockPrisma.character.update = vi.fn().mockRejectedValue('Unknown error');

      await expect(characterService.update('char_123', 'user_123', validUpdateData))
        .rejects.toThrow('Failed to update character');
    });
  });
});