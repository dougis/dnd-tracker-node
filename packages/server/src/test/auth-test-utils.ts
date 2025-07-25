import { Request, Response, NextFunction } from 'express';
import { vi } from 'vitest';

// Mock user data factory
export const createMockUser = (overrides = {}) => ({
  id: 'user_123',
  email: 'test@example.com',
  username: 'testuser',
  tier: 'free' as const,
  failedLoginAttempts: 0,
  lockedUntil: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Mock session data factory
export const createMockSession = (overrides = {}) => ({
  id: 'session_123',
  userId: 'user_123',
  expiresAt: new Date(Date.now() + 60000),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Mock session data with user factory
export const createMockSessionData = (userOverrides = {}, sessionOverrides = {}) => ({
  user: createMockUser(userOverrides),
  session: createMockSession(sessionOverrides),
});

// Mock Express request factory
export const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  headers: {},
  cookies: {},
  params: {},
  body: {},
  ...overrides,
});

// Mock Express response factory
export const createMockResponse = (): Partial<Response> => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
});

// Mock Express next function
export const createMockNext = (): NextFunction => vi.fn();

// Common authentication test scenarios
export const AuthTestScenarios = {
  validCookieAuth: {
    cookies: { session_id: 'valid_session_123' },
    headers: {},
  },
  validBearerAuth: {
    cookies: {},
    headers: { authorization: 'Bearer valid_token_123' },
  },
  noCookieNoHeader: {
    cookies: {},
    headers: {},
  },
  invalidBearerFormat: {
    cookies: {},
    headers: { authorization: 'InvalidFormat token123' },
  },
  cookieAndBearer: {
    cookies: { session_id: 'cookie_session' },
    headers: { authorization: 'Bearer header_token' },
  },
};

// Common assertion helpers
export const expectAuthSuccess = (mockNext: NextFunction, mockRes: Partial<Response>) => {
  expect(mockNext).toHaveBeenCalled();
  expect(mockRes.status).not.toHaveBeenCalled();
};

export const expectAuthFailure = (
  mockRes: Partial<Response>, 
  mockNext: NextFunction, 
  statusCode: number, 
  message: string
) => {
  expect(mockRes.status).toHaveBeenCalledWith(statusCode);
  expect(mockRes.json).toHaveBeenCalledWith({
    success: false,
    message,
  });
  expect(mockNext).not.toHaveBeenCalled();
};

export const expectOptionalAuthSuccess = (
  mockNext: NextFunction, 
  mockRes: Partial<Response>, 
  mockReq: Partial<Request>,
  shouldHaveUser = true
) => {
  expect(mockNext).toHaveBeenCalled();
  expect(mockRes.status).not.toHaveBeenCalled();
  if (shouldHaveUser) {
    expect(mockReq.user).toBeDefined();
  } else {
    expect(mockReq.user).toBeUndefined();
  }
};