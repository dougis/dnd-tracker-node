import { PrismaClient, Character } from '@prisma/client';

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

export class CharacterService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

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
      if (error instanceof Error) {
        throw new Error(`Failed to create character: ${error.message}`);
      }
      throw new Error('Failed to create character');
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
      if (error instanceof Error) {
        throw new Error(`Failed to fetch characters: ${error.message}`);
      }
      throw new Error('Failed to fetch characters');
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
      if (error instanceof Error) {
        throw new Error(`Failed to fetch character: ${error.message}`);
      }
      throw new Error('Failed to fetch character');
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
      if (error instanceof Error) {
        throw new Error(`Failed to update character: ${error.message}`);
      }
      throw new Error('Failed to update character');
    }
  }

  /**
   * Validate update data for character
   */
  private validateUpdateData(data: UpdateCharacterData): void {
    this.validateStringFields(data);
    this.validateNumericFields(data);
  }

  /**
   * Validate string fields in update data
   */
  private validateStringFields(data: UpdateCharacterData): void {
    this.validateStringField(data.name, 'Character name cannot be empty');
    this.validateStringField(data.race, 'Character race cannot be empty'); 
    this.validateClassesField(data.classes);
  }

  /**
   * Validate a single string field
   */
  private validateStringField(value: string | undefined, errorMessage: string): void {
    if (value !== undefined && (!value || value.trim().length === 0)) {
      throw new Error(errorMessage);
    }
  }

  /**
   * Validate classes field
   */
  private validateClassesField(classes: any[] | undefined): void {
    if (classes !== undefined && (!classes || classes.length === 0)) {
      throw new Error('Character must have at least one class');
    }
  }

  /**
   * Validate numeric fields in update data
   */
  private validateNumericFields(data: UpdateCharacterData): void {
    if (data.currentHp !== undefined && data.currentHp < 0) {
      throw new Error('Current HP cannot be negative');
    }

    if (data.tempHp !== undefined && data.tempHp < 0) {
      throw new Error('Temporary HP cannot be negative');
    }
  }

  /**
   * Build update data object from partial update data
   */
  private buildUpdateData(data: UpdateCharacterData): any {
    const updateData: any = {};
    
    this.processStringFields(data, updateData);
    this.processDirectFields(data, updateData);

    return updateData;
  }

  /**
   * Process string fields that need trimming
   */
  private processStringFields(data: UpdateCharacterData, updateData: any): void {
    const stringFields = [
      { key: 'name', transform: (val: string) => val.trim() },
      { key: 'race', transform: (val: string) => val.trim() },
      { key: 'playerName', transform: (val: string) => val?.trim() || null },
      { key: 'notes', transform: (val: string) => val?.trim() || null }
    ];

    stringFields.forEach(({ key, transform }) => {
      if (data[key as keyof UpdateCharacterData] !== undefined) {
        updateData[key] = transform(data[key as keyof UpdateCharacterData] as string);
      }
    });
  }

  /**
   * Process fields that need direct assignment
   */
  private processDirectFields(data: UpdateCharacterData, updateData: any): void {
    const directFields = [
      'classes', 'level', 'ac', 'maxHp', 'currentHp', 'tempHp', 
      'hitDice', 'speed', 'abilities', 'proficiencyBonus', 'features', 'equipment'
    ];

    directFields.forEach(key => {
      if (data[key as keyof UpdateCharacterData] !== undefined) {
        updateData[key] = data[key as keyof UpdateCharacterData];
      }
    });
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
      if (error instanceof Error) {
        throw new Error(`Failed to delete character: ${error.message}`);
      }
      throw new Error('Failed to delete character');
    }
  }
}