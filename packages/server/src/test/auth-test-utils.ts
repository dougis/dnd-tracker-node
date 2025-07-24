import { vi, expect } from 'vitest';
import { AuthService } from '../services/auth.js';

export interface MockUser {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  isEmailVerified: boolean;
  isAdmin: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockSession {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'user123',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: 'hashedpassword',
    failedLoginAttempts: 0,
    lockedUntil: null,
    isEmailVerified: false,
    isAdmin: false,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockSession(overrides: Partial<MockSession> = {}): MockSession {
  return {
    id: 'session123',
    token: 'sessiontoken123',
    userId: 'user123',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    ipAddress: '192.168.1.1',
    userAgent: 'test-agent',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockAuthService(): Partial<AuthService> {
  return {
    registerUser: vi.fn(),
    authenticateUser: vi.fn(),
    createSession: vi.fn(),
    validateSession: vi.fn(),
    invalidateSession: vi.fn(),
    isAccountLocked: vi.fn(),
  };
}

export function createTestUserData() {
  return {
    email: 'test@example.com',
    username: 'testuser',
    password: 'SecurePass123!',
  };
}

export function createTestLoginData() {
  return {
    email: 'test@example.com',
    password: 'correctpassword',
  };
}