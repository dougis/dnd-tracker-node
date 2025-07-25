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
    this.validateCreateData(data);

    return this.executeOperation(async () => {
      await this.verifyEntityOwnership(
        data.partyId, 
        userId, 
        () => this.prisma.party.findFirst({ where: { id: data.partyId, userId } })
      );
      
      const characterData = this.buildCharacterData(data);
      return await this.prisma.character.create({
        data: characterData,
      });
    }, 'create character');
  }

  /**
   * Validate create character data
   */
  private validateCreateData(data: CreateCharacterData): void {
    this.validateRequiredStringField(data.name, 'Character name is required');
    this.validateRequiredStringField(data.race, 'Character race is required');
    this.validateRequiredArrayField(data.classes, 'Character must have at least one class');
  }


  /**
   * Build character data object with defaults
   */
  private buildCharacterData(data: CreateCharacterData): any {
    const totalLevel = this.calculateTotalLevel(data);
    const characterDefaults = this.getCharacterDefaults(data, totalLevel);

    return {
      partyId: data.partyId,
      name: data.name.trim(),
      playerName: this.processStringField(data.playerName),
      race: data.race.trim(),
      classes: data.classes,
      level: totalLevel,
      notes: this.processStringField(data.notes),
      ...characterDefaults,
    };
  }

  /**
   * Get default values for character attributes
   */
  private getCharacterDefaults(data: CreateCharacterData, totalLevel: number): any {
    const defaultAbilities = this.getDefaultAbilities();
    const maxHp = data.maxHp || 10;

    return {
      ac: data.ac || 10,
      maxHp,
      currentHp: data.currentHp || maxHp,
      tempHp: data.tempHp || 0,
      hitDice: data.hitDice || null,
      speed: data.speed || 30,
      abilities: data.abilities || defaultAbilities,
      proficiencyBonus: data.proficiencyBonus || this.calculateProficiencyBonus(totalLevel),
      features: data.features || [],
      equipment: data.equipment || [],
    };
  }

  /**
   * Calculate total character level from classes
   */
  private calculateTotalLevel(data: CreateCharacterData): number {
    return data.level || data.classes.reduce((sum, cls) => sum + cls.level, 0);
  }

  /**
   * Get default ability scores
   */
  private getDefaultAbilities(): any {
    return {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    };
  }

  /**
   * Calculate proficiency bonus based on level
   */
  private calculateProficiencyBonus(level: number): number {
    return Math.ceil(level / 4) + 1;
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
    this.validateUpdateData(data);

    return this.executeOperation(async () => {
      // First check if character exists and user has access
      const existingCharacter = await this.findById(characterId, userId);
      if (!existingCharacter) {
        return null;
      }

      const updateData = this.buildUpdateData(data);

      return await this.prisma.character.update({
        where: { id: characterId },
        data: updateData,
      });
    }, 'update character');
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
    
    this.processStringUpdateFields(data, updateData);
    this.copyDirectUpdateFields(data, updateData);

    return updateData;
  }

  /**
   * Process string fields that need trimming or special handling
   */
  private processStringUpdateFields(data: UpdateCharacterData, updateData: any): void {
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.race !== undefined) updateData.race = data.race.trim();
    if (data.playerName !== undefined) updateData.playerName = this.processStringField(data.playerName);
    if (data.notes !== undefined) updateData.notes = this.processStringField(data.notes);
  }

  /**
   * Copy fields that can be directly assigned
   */
  private copyDirectUpdateFields(data: UpdateCharacterData, updateData: any): void {
    const directFields = ['classes', 'level', 'ac', 'maxHp', 'currentHp', 'tempHp', 
                         'hitDice', 'speed', 'abilities', 'proficiencyBonus', 'features', 'equipment'];
    this.copyDefinedFields(data, updateData, directFields);
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