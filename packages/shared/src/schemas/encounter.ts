import { z } from 'zod';

export const createEncounterSchema = z.object({
  name: z.string().min(1, 'Encounter name is required').max(100, 'Encounter name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  characterIds: z.array(z.string()).min(1, 'At least one character is required')
});

export const lairActionSchema = z.object({
  id: z.string(),
  encounterId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  initiative: z.number().int().min(0).max(30),
  isActive: z.boolean()
});

export const participantSchema = z.object({
  id: z.string(),
  encounterId: z.string(),
  characterId: z.string(),
  initiative: z.number().int(),
  currentHitPoints: z.number().int().min(0),
  maxHitPoints: z.number().int().min(1),
  armorClass: z.number().int().min(1).max(30),
  conditions: z.array(z.string()).optional(),
  notes: z.string().max(500).optional(),
  turnOrder: z.number().int().min(0)
});

export const encounterSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  currentRound: z.number().int().min(0),
  currentTurn: z.number().int().min(0),
  isActive: z.boolean(),
  participants: z.array(participantSchema),
  lairActions: z.array(lairActionSchema).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const damageSchema = z.object({
  participantId: z.string(),
  amount: z.number().int().min(1, 'Damage amount must be at least 1'),
  type: z.string().optional()
});

export const healSchema = z.object({
  participantId: z.string(),
  amount: z.number().int().min(1, 'Heal amount must be at least 1')
});