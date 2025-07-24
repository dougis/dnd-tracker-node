import { vi } from 'vitest';

/**
 * Common mock patterns for tests
 */

// Standard rate limiting mock
export const mockRateLimiting = () => ({
  loginRateLimit: vi.fn((req: any, res: any, next: any) => next()),
  registerRateLimit: vi.fn((req: any, res: any, next: any) => next()),
  createTierBasedRateLimit: vi.fn(() => (req: any, res: any, next: any) => next()),
});

// Standard auth middleware mock
export const mockAuthMiddleware = () => ({
  requireAuth: vi.fn((req: any, res: any, next: any) => {
    req.user = {
      id: '674f1234567890abcdef5678',
      email: 'test@example.com',
      username: 'testuser',
      tier: 'free',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    next();
  }),
  optionalAuth: vi.fn((req: any, res: any, next: any) => next()),
});

// Standard encounter mock data
export const mockEncounterData = {
  id: '674f1234567890abcdef1234',
  userId: '674f1234567890abcdef5678',
  name: 'Dragon Fight',
  description: 'Epic battle with ancient dragon',
  status: 'PLANNING' as const,
  round: 1,
  turn: 0,
  isActive: false,
  participants: [],
  lairActions: [],
  createdAt: new Date('2024-12-03T12:00:00Z'),
  updatedAt: new Date('2024-12-03T12:00:00Z'),
};

// Standard user mock data
export const mockUserData = {
  id: '674f1234567890abcdef5678',
  email: 'test@example.com',
  username: 'testuser',
  password: 'hashedpassword',
  tier: 'free' as const,
  createdAt: new Date('2024-12-03T12:00:00Z'),
  updatedAt: new Date('2024-12-03T12:00:00Z'),
};

// Express app setup helper
export const setupExpressApp = (router: any) => {
  const express = require('express'); // eslint-disable-line
  const app = express();
  app.use(express.json());
  app.use('/api', router);
  return app;
};

// Common test response assertions
export const expectValidationError = (response: any, field?: string) => {
  expect(response.status).toBe(400);
  expect(response.body.success).toBe(false);
  expect(response.body.message).toBe('Validation failed');
  if (field) {
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: field })
      ])
    );
  }
};

export const expectUnauthorizedError = (response: any) => {
  expect(response.status).toBe(401);
  expect(response.body.success).toBe(false);
};

export const expectNotFoundError = (response: any) => {
  expect(response.status).toBe(404);
  expect(response.body.success).toBe(false);
};

export const expectSuccessResponse = (response: any, statusCode = 200) => {
  expect(response.status).toBe(statusCode);
  expect(response.body.success).toBe(true);
};