import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CharacterService, CreateCharacterData } from '../CharacterService';
import { 
  createMockParty, 
  createMockCharacter, 
  createExpectedDefaultData, 
  createMockPrisma 
} from './CharacterService.helpers';

describe('CharacterService - create', () => {
  let characterService: CharacterService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

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
    mockPrisma = createMockPrisma();
    characterService = new CharacterService(mockPrisma);
    mockPrisma.party.findFirst = vi.fn().mockResolvedValue(createMockParty());
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
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
      ...createExpectedDefaultData()
    });

    const expectedCallData = {
      partyId: 'party_123',
      name: 'Simple Character',
      race: 'Elf',
      classes: [{ className: 'Wizard', level: 1 }],
      ...createExpectedDefaultData()
    };

    mockPrisma.character.create = vi.fn().mockResolvedValue(expectedCharacter);

    const result = await characterService.create('user_123', minimalData);

    expect(mockPrisma.character.create).toHaveBeenCalledWith({
      data: expectedCallData,
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