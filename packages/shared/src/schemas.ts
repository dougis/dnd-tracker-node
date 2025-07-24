import { z } from 'zod';

// Validation schemas using Zod

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string().min(3).max(20),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CharacterSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  level: z.number().int().min(1).max(20),
  hitPoints: z.number().int().min(0),
  maxHitPoints: z.number().int().min(1),
  armorClass: z.number().int().min(1).max(30),
  dexterity: z.number().int().min(1).max(30),
  isPlayerCharacter: z.boolean(),
});

export const PartySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  characters: z.array(CharacterSchema),
  ownerId: z.string().uuid(),
});

export const EncounterSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  participants: z.array(CharacterSchema),
  currentRound: z.number().int().min(0),
  currentTurn: z.number().int().min(0),
  isActive: z.boolean(),
});