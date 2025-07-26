import { z } from 'zod';
import { SubscriptionTier } from '../types/user.js';

export const createUserSchema = z.object({
  email: z.string().email('Valid email is required'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be less than 30 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password must be less than 128 characters')
});

export const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required')
});

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string().min(3).max(30),
  tier: z.nativeEnum(SubscriptionTier),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const updateUserSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  email: z.string().email().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided"
});