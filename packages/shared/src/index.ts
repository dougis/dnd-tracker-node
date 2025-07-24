import { z } from 'zod';

export const BaseEntitySchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type BaseEntity = z.infer<typeof BaseEntitySchema>;

export const UserSchema = BaseEntitySchema.extend({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  passwordHash: z.string(),
});

export type User = z.infer<typeof UserSchema>;

export const CharacterSchema = BaseEntitySchema.extend({
  name: z.string().min(1).max(100),
  level: z.number().int().min(1).max(20),
  armorClass: z.number().int().min(1).max(30),
  maxHitPoints: z.number().int().min(1),
  currentHitPoints: z.number().int(),
  initiative: z.number().int(),
  userId: z.string(),
});

export type Character = z.infer<typeof CharacterSchema>;