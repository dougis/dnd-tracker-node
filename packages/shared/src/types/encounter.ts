// Encounter-related types
export interface Encounter {
  id: string;
  userId: string;
  name: string;
  description?: string;
  currentRound: number;
  currentTurn: number;
  isActive: boolean;
  participants: Participant[];
  lairActions?: LairAction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Participant {
  id: string;
  encounterId: string;
  characterId: string;
  character: Character;
  initiative: number;
  currentHitPoints: number;
  maxHitPoints: number;
  armorClass: number;
  conditions?: string[];
  notes?: string;
  turnOrder: number;
}

export interface LairAction {
  id: string;
  encounterId: string;
  name: string;
  description: string;
  initiative: number;
  isActive: boolean;
}

export interface CreateEncounterRequest {
  name: string;
  description?: string;
  characterIds: string[];
}

export interface DamageRequest {
  participantId: string;
  amount: number;
  type?: string;
}

export interface HealRequest {
  participantId: string;
  amount: number;
}

import type { Character } from './character.js';