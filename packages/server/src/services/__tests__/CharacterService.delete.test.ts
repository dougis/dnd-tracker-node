import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CharacterService } from '../CharacterService';
import { 
  createMockCharacter, 
  createMockPrisma 
} from './CharacterService.helpers';

describe('CharacterService - delete operations', () => {
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

  describe('delete', () => {
    it('should delete character successfully', async () => {
      const existingCharacter = createMockCharacter();
      vi.spyOn(characterService, 'findById').mockResolvedValue(existingCharacter);
      mockPrisma.character.delete = vi.fn().mockResolvedValue(existingCharacter);

      const result = await characterService.delete('char_123', 'user_123');

      expect(characterService.findById).toHaveBeenCalledWith('char_123', 'user_123');
      expect(mockPrisma.character.delete).toHaveBeenCalledWith({
        where: {
          id: 'char_123',
        },
      });

      expect(result).toBe(true);
    });

    it('should return false when character not found', async () => {
      vi.spyOn(characterService, 'findById').mockResolvedValue(null);

      const result = await characterService.delete('nonexistent', 'user_123');

      expect(result).toBe(false);
      expect(mockPrisma.character.delete).not.toHaveBeenCalled();
    });

    it('should handle database errors during deletion', async () => {
      const existingCharacter = createMockCharacter();
      vi.spyOn(characterService, 'findById').mockResolvedValue(existingCharacter);
      mockPrisma.character.delete = vi.fn().mockRejectedValue(new Error('Database error'));

      await expect(characterService.delete('char_123', 'user_123'))
        .rejects.toThrow('Failed to delete character: Database error');
    });

    it('should handle generic errors during deletion', async () => {
      const existingCharacter = createMockCharacter();
      vi.spyOn(characterService, 'findById').mockResolvedValue(existingCharacter);
      mockPrisma.character.delete = vi.fn().mockRejectedValue('Unknown error');

      await expect(characterService.delete('char_123', 'user_123'))
        .rejects.toThrow('Failed to delete character');
    });
  });
});