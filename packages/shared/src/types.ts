// Basic shared types for the D&D Tracker application

export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Character {
  id: string;
  name: string;
  level: number;
  hitPoints: number;
  maxHitPoints: number;
  armorClass: number;
  dexterity: number;
  isPlayerCharacter: boolean;
}

export interface Party {
  id: string;
  name: string;
  description?: string;
  characters: Character[];
  ownerId: string;
}

export interface Encounter {
  id: string;
  name: string;
  participants: Character[];
  currentRound: number;
  currentTurn: number;
  isActive: boolean;
}