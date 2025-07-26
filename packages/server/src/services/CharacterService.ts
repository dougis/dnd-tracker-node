import { Character } from '@prisma/client';
import { BaseService } from './BaseService';

export interface CreateCharacterData {
  partyId: string;
  name: string;
  playerName?: string;
  race: string;
  classes: Array<{ className: string; level: number }>;
  level?: number;
  ac?: number;
  maxHp?: number;
  currentHp?: number;
  tempHp?: number;
  hitDice?: string;
  speed?: number;
  abilities?: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  proficiencyBonus?: number;
  features?: string[];
  equipment?: string[];
  notes?: string;
}

export interface UpdateCharacterData {
  name?: string;
  playerName?: string;
  race?: string;
  classes?: Array<{ className: string; level: number }>;
  level?: number;
  ac?: number;
  maxHp?: number;
  currentHp?: number;
  tempHp?: number;
  hitDice?: string;
  speed?: number;
  abilities?: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  proficiencyBonus?: number;
  features?: string[];
  equipment?: string[];
  notes?: string;
}

export class CharacterService extends BaseService {

  /**
   * Create a new character in a party
   */
  async create(userId: string, data: CreateCharacterData): Promise<Character> {
    // Validate required fields
    this.validateRequiredStringField(data.name, 'Character name is required');
    this.validateRequiredStringField(data.race, 'Character race is required');
    this.validateRequiredArrayField(data.classes, 'Character must have at least one class');

    return this.executeOperation(async () => {
      await this.verifyEntityOwnership(
        data.partyId, 
        userId, 
        () => this.prisma.party.findFirst({ where: { id: data.partyId, userId } })
      );
      
      // Build character data with defaults
      const totalLevel = data.level || data.classes.reduce((sum, cls) => sum + cls.level, 0);
      const maxHp = data.maxHp || 10;
      
      const characterData = {
        partyId: data.partyId,
        name: data.name.trim(),
        playerName: this.processStringField(data.playerName),
        race: data.race.trim(),
        classes: data.classes,
        level: totalLevel,
        notes: this.processStringField(data.notes),
        ac: data.ac || 10,
        maxHp,
        currentHp: data.currentHp || maxHp,
        tempHp: data.tempHp || 0,
        hitDice: data.hitDice || null,
        speed: data.speed || 30,
        abilities: data.abilities || {
          str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10
        },
        proficiencyBonus: data.proficiencyBonus || Math.ceil(totalLevel / 4) + 1,
        features: data.features || [],
        equipment: data.equipment || [],
      };
      
      return await this.prisma.character.create({
        data: characterData,
      });
    }, 'create character');
  }

  /**
   * Find all characters in a party
   */
  async findByPartyId(partyId: string, userId: string): Promise<Character[]> {
    return this.executeOperation(async () => {
      await this.verifyEntityOwnership(
        partyId, 
        userId, 
        () => this.prisma.party.findFirst({ where: { id: partyId, userId } })
      );

      return await this.prisma.character.findMany({
        where: { partyId },
        orderBy: { name: 'asc' },
      });
    }, 'fetch characters');
  }

  /**
   * Find a specific character by ID
   */
  async findById(characterId: string, userId: string): Promise<Character | null> {
    return this.executeOperation(async () => {
      const character = await this.prisma.character.findFirst({
        where: {
          id: characterId,
          party: { userId },
        },
        include: { party: true },
      });

      if (!character) {
        return null;
      }

      // Remove party data from return to match expected Character type
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { party, ...characterData } = character;
      return characterData as Character;
    }, 'fetch character');
  }

  /**
   * Update a character
   */
  async update(characterId: string, userId: string, data: UpdateCharacterData): Promise<Character | null> {
    // Validate update data
    this.validateStringField(data.name, 'Character name cannot be empty');
    this.validateStringField(data.race, 'Character race cannot be empty');
    this.validateNonEmptyArrayField(data.classes, 'Character must have at least one class');
    this.validateNonNegativeField(data.currentHp, 'Current HP cannot be negative');
    this.validateNonNegativeField(data.tempHp, 'Temporary HP cannot be negative');

    return this.executeOperation(async () => {
      // First check if character exists and user has access
      const existingCharacter = await this.findById(characterId, userId);
      if (!existingCharacter) {
        return null;
      }

      // Build update data object
      const updateData: any = {};
      
      // Handle string fields that need processing
      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.race !== undefined) updateData.race = data.race.trim();
      if (data.playerName !== undefined) updateData.playerName = this.processStringField(data.playerName);
      if (data.notes !== undefined) updateData.notes = this.processStringField(data.notes);
      
      // Handle direct copy fields
      const directFields = ['classes', 'level', 'ac', 'maxHp', 'currentHp', 'tempHp', 
                           'hitDice', 'speed', 'abilities', 'proficiencyBonus', 'features', 'equipment'];
      this.copyDefinedFields(data, updateData, directFields);

      return await this.prisma.character.update({
        where: { id: characterId },
        data: updateData,
      });
    }, 'update character');
  }

  /**
   * Delete a character
   */
  async delete(characterId: string, userId: string): Promise<boolean> {
    return this.executeOperation(async () => {
      // First check if character exists and user has access
      const existingCharacter = await this.findById(characterId, userId);
      if (!existingCharacter) {
        return false;
      }

      await this.prisma.character.delete({
        where: { id: characterId },
      });

      return true;
    }, 'delete character');
  }
}