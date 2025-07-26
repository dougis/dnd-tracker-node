// User-related types
export interface User {
  id: string;
  email: string;
  username: string;
  tier: SubscriptionTier;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStats {
  id: string;
  userId: string;
  encountersCreated: number;
  charactersCreated: number;
  totalCombatRounds: number;
  lastActivity: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export enum SubscriptionTier {
  FREE = 'free',
  BASIC = 'basic', 
  PRO = 'pro',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise'
}

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}