import { PrismaClient, Character } from '@prisma/client';
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
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Character name is required');
    }

    if (!data.race || data.race.trim().length === 0) {
      throw new Error('Character race is required');
    }

    if (!data.classes || data.classes.length === 0) {
      throw new Error('Character must have at least one class');
    }

    try {
      // First verify the party exists and belongs to the user
      const party = await this.prisma.party.findFirst({
        where: {
          id: data.partyId,
          userId,
        },
      });

      if (!party) {
        throw new Error('Party not found or does not belong to user');
      }

      // Calculate total level from classes if not provided
      const totalLevel = data.level || data.classes.reduce((sum, cls) => sum + cls.level, 0);

      // Set default ability scores if not provided
      const defaultAbilities = {
        str: 10,
        dex: 10,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10,
      };

      const character = await this.prisma.character.create({
        data: {
          partyId: data.partyId,
          name: data.name.trim(),
          playerName: data.playerName?.trim() || null,
          race: data.race.trim(),
          classes: data.classes,
          level: totalLevel,
          ac: data.ac || 10,
          maxHp: data.maxHp || 10,
          currentHp: data.currentHp || data.maxHp || 10,
          tempHp: data.tempHp || 0,
          hitDice: data.hitDice || null,
          speed: data.speed || 30,
          abilities: data.abilities || defaultAbilities,
          proficiencyBonus: data.proficiencyBonus || Math.ceil(totalLevel / 4) + 1,
          features: data.features || [],
          equipment: data.equipment || [],
          notes: data.notes?.trim() || null,
        },
      });

      return character;
    } catch (error) {
      this.handleError(error, 'create character');
    }
  }

  /**
   * Find all characters in a party
   */
  async findByPartyId(partyId: string, userId: string): Promise<Character[]> {
    try {
      // First verify the party belongs to the user
      const party = await this.prisma.party.findFirst({
        where: {
          id: partyId,
          userId,
        },
      });

      if (!party) {
        throw new Error('Party not found or does not belong to user');
      }

      const characters = await this.prisma.character.findMany({
        where: {
          partyId,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return characters;
    } catch (error) {
      this.handleError(error, 'fetch characters');
    }
  }

  /**
   * Find a specific character by ID
   */
  async findById(characterId: string, userId: string): Promise<Character | null> {
    try {
      const character = await this.prisma.character.findFirst({
        where: {
          id: characterId,
          party: {
            userId,
          },
        },
        include: {
          party: true,
        },
      });

      if (!character) {
        return null;
      }

      // Remove party data from return to match expected Character type
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { party, ...characterData } = character;
      return characterData as Character;
    } catch (error) {
      this.handleError(error, 'fetch character');
    }
  }

  /**
   * Update a character
   */
  async update(characterId: string, userId: string, data: UpdateCharacterData): Promise<Character | null> {
    this.validateUpdateData(data);

    try {
      // First check if character exists and user has access
      const existingCharacter = await this.findById(characterId, userId);
      if (!existingCharacter) {
        return null;
      }

      const updateData = this.buildUpdateData(data);

      const character = await this.prisma.character.update({
        where: {
          id: characterId,
        },
        data: updateData,
      });

      return character;
    } catch (error) {
      this.handleError(error, 'update character');
    }
  }

  /**
   * Validate update data for character
   */
  private validateUpdateData(data: UpdateCharacterData): void {
    this.validateStringField(data.name, 'Character name cannot be empty');
    this.validateStringField(data.race, 'Character race cannot be empty');
    this.validateNonEmptyArrayField(data.classes, 'Character must have at least one class');
    this.validateNonNegativeField(data.currentHp, 'Current HP cannot be negative');
    this.validateNonNegativeField(data.tempHp, 'Temporary HP cannot be negative');
  }

  /**
   * Build update data object from partial update data
   */
  private buildUpdateData(data: UpdateCharacterData): any {
    const updateData: any = {};
    
    // Process string fields
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.race !== undefined) updateData.race = data.race.trim();
    if (data.playerName !== undefined) updateData.playerName = this.processStringField(data.playerName);
    if (data.notes !== undefined) updateData.notes = this.processStringField(data.notes);

    // Process direct fields
    const directFields = ['classes', 'level', 'ac', 'maxHp', 'currentHp', 'tempHp', 
                         'hitDice', 'speed', 'abilities', 'proficiencyBonus', 'features', 'equipment'];
    
    directFields.forEach(key => {
      if (data[key as keyof UpdateCharacterData] !== undefined) {
        updateData[key] = data[key as keyof UpdateCharacterData];
      }
    });

    return updateData;
  }

  /**
   * Delete a character
   */
  async delete(characterId: string, userId: string): Promise<boolean> {
    try {
      // First check if character exists and user has access
      const existingCharacter = await this.findById(characterId, userId);
      if (!existingCharacter) {
        return false;
      }

      await this.prisma.character.delete({
        where: {
          id: characterId,
        },
      });

      return true;
    } catch (error) {
      this.handleError(error, 'delete character');
    }
  }
}