// Character-related types  
export interface Character {
  id: string;
  userId: string;
  name: string;
  type: CharacterType;
  armorClass: number;
  hitPoints: number;
  maxHitPoints: number;
  initiative: number;
  dexterity: number;
  classes?: CharacterClass[];
  level?: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum CharacterType {
  PC = 'pc',
  NPC = 'npc',
  MONSTER = 'monster'
}

export interface CharacterClass {
  name: string;
  level: number;
}

export interface CreateCharacterRequest {
  name: string;
  type: CharacterType;
  armorClass: number;
  hitPoints: number;
  maxHitPoints: number;
  dexterity: number;
  classes?: CharacterClass[];
  level?: number;
}