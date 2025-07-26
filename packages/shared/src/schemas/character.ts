import { z } from 'zod';
import { CharacterType } from '../types/character.js';

export const characterClassSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  level: z.number().int().min(1, 'Level must be at least 1').max(20, 'Level cannot exceed 20')
});

export const createCharacterSchema = z.object({
  name: z.string().min(1, 'Character name is required').max(100, 'Character name must be less than 100 characters'),
  type: z.nativeEnum(CharacterType),
  armorClass: z.number().int().min(1, 'AC must be at least 1').max(30, 'AC cannot exceed 30'),
  hitPoints: z.number().int().min(1, 'HP must be at least 1'),
  maxHitPoints: z.number().int().min(1, 'Max HP must be at least 1'),
  dexterity: z.number().int().min(1, 'Dexterity must be at least 1').max(30, 'Dexterity cannot exceed 30'),
  classes: z.array(characterClassSchema).optional(),
  level: z.number().int().min(1).max(20).optional()
}).refine(data => data.hitPoints <= data.maxHitPoints, {
  message: "Current HP cannot exceed max HP",
  path: ["hitPoints"]
});

export const characterSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1).max(100),
  type: z.nativeEnum(CharacterType),
  armorClass: z.number().int().min(1).max(30),
  hitPoints: z.number().int().min(0),
  maxHitPoints: z.number().int().min(1),
  initiative: z.number().int(),
  dexterity: z.number().int().min(1).max(30),
  classes: z.array(characterClassSchema).optional(),
  level: z.number().int().min(1).max(20).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const updateCharacterSchema = z.object({
  name: z.string().min(1, 'Character name is required').max(100, 'Character name must be less than 100 characters').optional(),
  armorClass: z.number().int().min(1, 'AC must be at least 1').max(30, 'AC cannot exceed 30').optional(),
  hitPoints: z.number().int().min(1, 'HP must be at least 1').optional(),
  maxHitPoints: z.number().int().min(1, 'Max HP must be at least 1').optional(),
  dexterity: z.number().int().min(1, 'Dexterity must be at least 1').max(30, 'Dexterity cannot exceed 30').optional(),
  classes: z.array(characterClassSchema).optional(),
  level: z.number().int().min(1).max(20).optional()
});