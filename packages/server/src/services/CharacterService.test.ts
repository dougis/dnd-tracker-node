import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { CharacterService, CreateCharacterData, UpdateCharacterData } from './CharacterService';

// Create comprehensive mock data helpers
const createMockParty = (overrides = {}) => ({
  id: 'party_123',
  userId: 'user_123',
  name: 'Test Party',
  description: 'Test party description',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

const createMockCharacter = (overrides = {}) => ({
  id: 'char_123',
  partyId: 'party_123',
  name: 'Test Character',
  playerName: 'Test Player',
  race: 'Human',
  classes: [{ className: 'Fighter', level: 5 }],
  level: 5,
  ac: 16,
  maxHp: 45,
  currentHp: 45,
  tempHp: 0,
  hitDice: '5d10',
  speed: 30,
  abilities: {
    str: 16,
    dex: 14,
    con: 15,
    int: 12,
    wis: 13,
    cha: 11
  },
  proficiencyBonus: 3,
  features: ['Second Wind', 'Fighting Style'],
  equipment: ['Longsword', 'Chain Mail', 'Shield'],
  notes: 'Test character notes',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

// Create mock Prisma client with comprehensive mocking
const mockPrisma = {
  party: {
    findFirst: vi.fn(),
  },
  character: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
} as unknown as PrismaClient;

describe('CharacterService', () => {
  let characterService: CharacterService;

  beforeEach(() => {
    characterService = new CharacterService(mockPrisma);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('create', () => {
    const validCreateData: CreateCharacterData = {
      partyId: 'party_123',
      name: 'Aragorn',
      playerName: 'John Doe',
      race: 'Human',
      classes: [{ className: 'Ranger', level: 5 }],
      level: 5,
      ac: 16,
      maxHp: 45,
      currentHp: 45,
      tempHp: 0,
      hitDice: '5d10',
      speed: 30,
      abilities: {
        str: 16,
        dex: 18,
        con: 14,
        int: 12,
        wis: 15,
        cha: 13
      },
      proficiencyBonus: 3,
      features: ['Favored Enemy', 'Natural Explorer'],
      equipment: ['Longbow', 'Leather Armor'],
      notes: 'Ranger of the North'
    };

    beforeEach(() => {
      mockPrisma.party.findFirst = vi.fn().mockResolvedValue(createMockParty());
    });

    it('should create a character with valid data', async () => {
      const mockCreatedCharacter = createMockCharacter({
        ...validCreateData,
        id: 'char_new'
      });

      mockPrisma.character.create = vi.fn().mockResolvedValue(mockCreatedCharacter);

      const result = await characterService.create('user_123', validCreateData);

      expect(mockPrisma.party.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'party_123',
          userId: 'user_123',
        },
      });

      expect(mockPrisma.character.create).toHaveBeenCalledWith({
        data: {
          partyId: 'party_123',
          name: 'Aragorn',
          playerName: 'John Doe',
          race: 'Human',
          classes: [{ className: 'Ranger', level: 5 }],
          level: 5,
          ac: 16,
          maxHp: 45,
          currentHp: 45,
          tempHp: 0,
          hitDice: '5d10',
          speed: 30,
          abilities: {
            str: 16,
            dex: 18,
            con: 14,
            int: 12,
            wis: 15,
            cha: 13
          },
          proficiencyBonus: 3,
          features: ['Favored Enemy', 'Natural Explorer'],
          equipment: ['Longbow', 'Leather Armor'],
          notes: 'Ranger of the North',
        },
      });

      expect(result).toEqual(mockCreatedCharacter);
    });

    it('should create character with minimal data using defaults', async () => {
      const minimalData: CreateCharacterData = {
        partyId: 'party_123',
        name: 'Simple Character',
        race: 'Elf',
        classes: [{ className: 'Wizard', level: 1 }]
      };

      const expectedCharacter = createMockCharacter({
        name: 'Simple Character',
        race: 'Elf',
        classes: [{ className: 'Wizard', level: 1 }],
        level: 1,
        ac: 10,
        maxHp: 10,
        currentHp: 10,
        tempHp: 0,
        speed: 30,
        abilities: {
          str: 10,
          dex: 10,
          con: 10,
          int: 10,
          wis: 10,
          cha: 10
        },
        proficiencyBonus: 2,
        features: [],
        equipment: [],
        playerName: null,
        hitDice: null,
        notes: null
      });

      mockPrisma.character.create = vi.fn().mockResolvedValue(expectedCharacter);

      const result = await characterService.create('user_123', minimalData);

      expect(mockPrisma.character.create).toHaveBeenCalledWith({
        data: {
          partyId: 'party_123',
          name: 'Simple Character',
          playerName: null,
          race: 'Elf',
          classes: [{ className: 'Wizard', level: 1 }],
          level: 1,
          ac: 10,
          maxHp: 10,
          currentHp: 10,
          tempHp: 0,
          hitDice: null,
          speed: 30,
          abilities: {
            str: 10,
            dex: 10,
            con: 10,
            int: 10,
            wis: 10,
            cha: 10
          },
          proficiencyBonus: 2,
          features: [],
          equipment: [],
          notes: null,
        },
      });

      expect(result).toEqual(expectedCharacter);
    });

    it('should calculate total level from multiclass correctly', async () => {
      const multiclassData: CreateCharacterData = {
        partyId: 'party_123',
        name: 'Multiclass Character',
        race: 'Half-Elf',
        classes: [
          { className: 'Fighter', level: 3 },
          { className: 'Rogue', level: 2 }
        ]
      };

      const expectedCharacter = createMockCharacter({
        name: 'Multiclass Character',
        race: 'Half-Elf',
        classes: [
          { className: 'Fighter', level: 3 },
          { className: 'Rogue', level: 2 }
        ],
        level: 5,
        proficiencyBonus: 3
      });

      mockPrisma.character.create = vi.fn().mockResolvedValue(expectedCharacter);

      await characterService.create('user_123', multiclassData);

      expect(mockPrisma.character.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            level: 5,
            proficiencyBonus: 3
          })
        })
      );
    });

    it('should use provided level over calculated level', async () => {
      const dataWithLevel: CreateCharacterData = {
        partyId: 'party_123',
        name: 'Level Override Character',
        race: 'Dwarf',
        classes: [{ className: 'Cleric', level: 3 }],
        level: 10
      };

      const expectedCharacter = createMockCharacter({
        level: 10,
        proficiencyBonus: 4
      });

      mockPrisma.character.create = vi.fn().mockResolvedValue(expectedCharacter);

      await characterService.create('user_123', dataWithLevel);

      expect(mockPrisma.character.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            level: 10,
            proficiencyBonus: 4
          })
        })
      );
    });

    it('should set currentHp to maxHp when currentHp not provided', async () => {
      const dataWithoutCurrentHp: CreateCharacterData = {
        partyId: 'party_123',
        name: 'Auto HP Character',
        race: 'Human',
        classes: [{ className: 'Barbarian', level: 5 }],
        maxHp: 58
      };

      const expectedCharacter = createMockCharacter({
        maxHp: 58,
        currentHp: 58
      });

      mockPrisma.character.create = vi.fn().mockResolvedValue(expectedCharacter);

      await characterService.create('user_123', dataWithoutCurrentHp);

      expect(mockPrisma.character.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            maxHp: 58,
            currentHp: 58
          })
        })
      );
    });

    it('should trim string fields appropriately', async () => {
      const dataWithSpaces: CreateCharacterData = {
        partyId: 'party_123',
        name: '  Spaced Name  ',
        playerName: '  Spaced Player  ',
        race: '  Spaced Race  ',
        classes: [{ className: 'Fighter', level: 1 }],
        notes: '  Spaced Notes  '
      };

      mockPrisma.character.create = vi.fn().mockResolvedValue(createMockCharacter());

      await characterService.create('user_123', dataWithSpaces);

      expect(mockPrisma.character.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Spaced Name',
            playerName: 'Spaced Player',
            race: 'Spaced Race',
            notes: 'Spaced Notes'
          })
        })
      );
    });

    it('should throw error for empty name', async () => {
      const invalidData = { ...validCreateData, name: '' };

      await expect(characterService.create('user_123', invalidData))
        .rejects.toThrow('Character name is required');

      expect(mockPrisma.party.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.character.create).not.toHaveBeenCalled();
    });

    it('should throw error for whitespace-only name', async () => {
      const invalidData = { ...validCreateData, name: '   ' };

      await expect(characterService.create('user_123', invalidData))
        .rejects.toThrow('Character name is required');
    });

    it('should throw error for empty race', async () => {
      const invalidData = { ...validCreateData, race: '' };

      await expect(characterService.create('user_123', invalidData))
        .rejects.toThrow('Character race is required');
    });

    it('should throw error for whitespace-only race', async () => {
      const invalidData = { ...validCreateData, race: '   ' };

      await expect(characterService.create('user_123', invalidData))
        .rejects.toThrow('Character race is required');
    });

    it('should throw error for empty classes array', async () => {
      const invalidData = { ...validCreateData, classes: [] };

      await expect(characterService.create('user_123', invalidData))
        .rejects.toThrow('Character must have at least one class');
    });

    it('should throw error for missing classes', async () => {
      const invalidData = { ...validCreateData };
      delete (invalidData as any).classes;

      await expect(characterService.create('user_123', invalidData))
        .rejects.toThrow('Character must have at least one class');
    });

    it('should throw error when party not found', async () => {
      mockPrisma.party.findFirst = vi.fn().mockResolvedValue(null);

      await expect(characterService.create('user_123', validCreateData))
        .rejects.toThrow('Failed to create character: Party not found or does not belong to user');

      expect(mockPrisma.character.create).not.toHaveBeenCalled();
    });

    it('should throw error when party belongs to different user', async () => {
      mockPrisma.party.findFirst = vi.fn().mockResolvedValue(null);

      await expect(characterService.create('different_user', validCreateData))
        .rejects.toThrow('Failed to create character: Party not found or does not belong to user');
    });

    it('should handle database errors during creation', async () => {
      mockPrisma.character.create = vi.fn().mockRejectedValue(new Error('Database error'));

      await expect(characterService.create('user_123', validCreateData))
        .rejects.toThrow('Failed to create character: Database error');
    });

    it('should handle generic errors during creation', async () => {
      mockPrisma.character.create = vi.fn().mockRejectedValue('Unknown error');

      await expect(characterService.create('user_123', validCreateData))
        .rejects.toThrow('Failed to create character');
    });
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
        .rejects.toThrow('Failed to fetch characters: Party not found or does not belong to user');

      expect(mockPrisma.character.findMany).not.toHaveBeenCalled();
    });

    it('should throw error when party belongs to different user', async () => {
      mockPrisma.party.findFirst = vi.fn().mockResolvedValue(null);

      await expect(characterService.findByPartyId('party_123', 'different_user'))
        .rejects.toThrow('Failed to fetch characters: Party not found or does not belong to user');
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

  describe('update', () => {
    const validUpdateData: UpdateCharacterData = {
      name: 'Updated Character',
      currentHp: 30,
      tempHp: 5,
      notes: 'Updated notes'
    };

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

  describe('private methods', () => {
    it('should validate update data correctly', () => {
      const validData = {
        name: 'Valid Name',
        race: 'Valid Race',
        classes: [{ className: 'Fighter', level: 1 }],
        currentHp: 10,
        tempHp: 5
      };

      // This should not throw
      expect(() => (characterService as any).validateUpdateData(validData)).not.toThrow();
    });

    it('should build update data correctly', () => {
      const inputData: UpdateCharacterData = {
        name: '  Test Name  ',
        playerName: '  Test Player  ',
        race: '  Test Race  ',
        notes: '  Test Notes  ',
        level: 5,
        ac: 16,
        currentHp: 30
      };

      const result = (characterService as any).buildUpdateData(inputData);

      expect(result).toEqual({
        name: 'Test Name',
        playerName: 'Test Player',
        race: 'Test Race',
        notes: 'Test Notes',
        level: 5,
        ac: 16,
        currentHp: 30
      });
    });

    it('should process string fields with null handling', () => {
      const inputData = {
        playerName: '',
        notes: '   '
      };
      const updateData: any = {};

      (characterService as any).processStringFields(inputData, updateData);

      expect(updateData).toEqual({
        playerName: null,
        notes: null
      });
    });

    it('should process direct fields correctly', () => {
      const inputData = {
        level: 10,
        ac: 18,
        abilities: { str: 16, dex: 14, con: 15, int: 12, wis: 13, cha: 11 },
        features: ['Feature 1', 'Feature 2']
      };
      const updateData: any = {};

      (characterService as any).processDirectFields(inputData, updateData);

      expect(updateData).toEqual({
        level: 10,
        ac: 18,
        abilities: { str: 16, dex: 14, con: 15, int: 12, wis: 13, cha: 11 },
        features: ['Feature 1', 'Feature 2']
      });
    });
  });

  describe('edge cases', () => {
    it('should handle undefined values in update data', async () => {
      const updateData: UpdateCharacterData = {
        currentHp: 0
      };

      const existingCharacter = createMockCharacter();
      vi.spyOn(characterService, 'findById').mockResolvedValue(existingCharacter);
      mockPrisma.character.update = vi.fn().mockResolvedValue(createMockCharacter());

      await characterService.update('char_123', 'user_123', updateData);

      expect(mockPrisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char_123' },
        data: {
          currentHp: 0
        },
      });
    });

    it('should calculate proficiency bonus correctly for different levels', async () => {
      const testCases = [
        { level: 1, expectedBonus: 2 },
        { level: 4, expectedBonus: 2 },
        { level: 5, expectedBonus: 3 },
        { level: 8, expectedBonus: 3 },
        { level: 9, expectedBonus: 4 },
        { level: 12, expectedBonus: 4 },
        { level: 13, expectedBonus: 5 },
        { level: 16, expectedBonus: 5 },
        { level: 17, expectedBonus: 6 },
        { level: 20, expectedBonus: 6 }
      ];

      mockPrisma.party.findFirst = vi.fn().mockResolvedValue(createMockParty());

      for (const testCase of testCases) {
        const createData: CreateCharacterData = {
          partyId: 'party_123',
          name: `Level ${testCase.level} Character`,
          race: 'Human',
          classes: [{ className: 'Fighter', level: testCase.level }],
          level: testCase.level
        };

        mockPrisma.character.create = vi.fn().mockResolvedValue(createMockCharacter());

        await characterService.create('user_123', createData);

        expect(mockPrisma.character.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              proficiencyBonus: testCase.expectedBonus
            })
          })
        );
      }
    });

    it('should handle zero values correctly for tempHp but default speed', async () => {
      const dataWithZeros: CreateCharacterData = {
        partyId: 'party_123',
        name: 'Zero Character',
        race: 'Human',
        classes: [{ className: 'Fighter', level: 1 }],
        tempHp: 0,
        speed: 0 // Service will default this to 30 since 0 is falsy
      };

      mockPrisma.party.findFirst = vi.fn().mockResolvedValue(createMockParty());
      mockPrisma.character.create = vi.fn().mockResolvedValue(createMockCharacter());

      await characterService.create('user_123', dataWithZeros);

      expect(mockPrisma.character.create).toHaveBeenCalledWith({
        data: {
          partyId: 'party_123',
          name: 'Zero Character',
          playerName: null,
          race: 'Human',
          classes: [{ className: 'Fighter', level: 1 }],
          level: 1,
          ac: 10,
          maxHp: 10,
          currentHp: 10,
          tempHp: 0, // This should be 0 as provided
          hitDice: null,
          speed: 30, // This defaults to 30 because 0 is falsy
          abilities: {
            str: 10,
            dex: 10,
            con: 10,
            int: 10,
            wis: 10,
            cha: 10
          },
          proficiencyBonus: 2,
          features: [],
          equipment: [],
          notes: null,
        },
      });
    });
  });
});