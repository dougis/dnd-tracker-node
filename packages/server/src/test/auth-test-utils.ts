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

// Helper to set up mock service responses
export const setupValidSessionMock = (authServiceMock: any, sessionData?: any) => {
  const mockSessionData = sessionData || createMockSessionData();
  authServiceMock.validateSession.mockResolvedValue(mockSessionData);
  return mockSessionData;
};

export const setupInvalidSessionMock = (authServiceMock: any) => {
  authServiceMock.validateSession.mockResolvedValue(null);
};

export const setupSessionErrorMock = (authServiceMock: any, error = new Error('Database error')) => {
  authServiceMock.validateSession.mockRejectedValue(error);
};

// Helper for executing middleware tests
export const executeMiddleware = async (
  middleware: any,
  mockReq: Partial<Request>,
  mockRes: Partial<Response>,
  mockNext: NextFunction
) => {
  await middleware(mockReq, mockRes, mockNext);
};

// Helper for setting up cookie authentication scenarios
export const setupCookieAuth = (mockReq: Partial<Request>, sessionId: string) => {
  Object.assign(mockReq, { cookies: { session_id: sessionId } });
};

// Helper for setting up bearer token authentication scenarios
export const setupBearerAuth = (mockReq: Partial<Request>, token: string) => {
  Object.assign(mockReq, { headers: { authorization: `Bearer ${token}` } });
};

// Helper for permission middleware tests - This is meant to be imported alongside middleware in tests
export const createPermissionMiddleware = (permission: string, requirePermission: any) => {
  return requirePermission(permission);
};

// Helper for ownership middleware tests - This is meant to be imported alongside middleware in tests
export const createOwnershipMiddleware = (requireOwnership: any, paramName?: string) => {
  return requireOwnership(paramName);
};

// Common assertion for middleware that should authenticate and set user
export const expectAuthenticatedUser = (mockReq: Partial<Request>, expectedUser: any) => {
  expect(mockReq.user).toEqual(expectedUser);
};

// Common assertion for service validation calls
export const expectValidationCall = (authServiceMock: any, sessionId: string) => {
  expect(authServiceMock.validateSession).toHaveBeenCalledWith(sessionId);
};

// Helper for standard error response format
export const expectStandardErrorResponse = (
  mockRes: Partial<Response>,
  statusCode: number,
  message: string
) => {
  expect(mockRes.status).toHaveBeenCalledWith(statusCode);
  expect(mockRes.json).toHaveBeenCalledWith({
    success: false,
    message,
  });
};

// Helper for permission/ownership test scenarios
export const createResourceOwnershipScenario = (userId: string, paramName = 'userId') => ({
  user: createMockUser({ id: userId }),
  params: { [paramName]: userId },
});

export const createResourceOwnershipBodyScenario = (userId: string) => ({
  user: createMockUser({ id: userId }),
  params: {},
  body: { userId },
});

// Comprehensive test execution helpers to reduce duplication
export const createMiddlewareTestScenario = (
  middlewareFunc: any,
  setupFn: (mockReq: any, mockRes: any, authServiceMock: any) => any,
  assertionFn: (mockReq: any, mockRes: any, mockNext: any, authServiceMock: any, setupData?: any) => void
) => {
  return async (mockReq: any, mockRes: any, mockNext: any, authServiceMock: any) => {
    // Arrange
    const setupData = setupFn(mockReq, mockRes, authServiceMock);
    
    // Act
    await executeMiddleware(middlewareFunc, mockReq, mockRes, mockNext);
    
    // Assert
    assertionFn(mockReq, mockRes, mockNext, authServiceMock, setupData);
  };
};

// Helper for standard authentication success test
export const createAuthSuccessTest = (middlewareFunc: any, scenario: any, expectedToken: string) => {
  return async (mockReq: any, mockRes: any, mockNext: any, authServiceMock: any) => {
    // Arrange
    const mockSessionData = setupValidSessionMock(authServiceMock);
    Object.assign(mockReq, scenario);

    // Act
    await executeMiddleware(middlewareFunc, mockReq, mockRes, mockNext);

    // Assert
    expectValidationCall(authServiceMock, expectedToken);
    expectAuthenticatedUser(mockReq, mockSessionData.user);
    expectAuthSuccess(mockNext, mockRes);
  };
};

// Helper for standard authentication failure test
export const createAuthFailureTest = (middlewareFunc: any, scenario: any, expectedStatus: number, expectedMessage: string, shouldCallService = false) => {
  return async (mockReq: any, mockRes: any, mockNext: any, authServiceMock: any) => {
    // Arrange
    Object.assign(mockReq, scenario);
    if (shouldCallService) {
      setupInvalidSessionMock(authServiceMock);
    }

    // Act
    await executeMiddleware(middlewareFunc, mockReq, mockRes, mockNext);

    // Assert
    if (!shouldCallService) {
      expect(authServiceMock.validateSession).not.toHaveBeenCalled();
    }
    expectStandardErrorResponse(mockRes, expectedStatus, expectedMessage);
    expect(mockNext).not.toHaveBeenCalled();
  };
};

// Helper for optional auth success test (no failure on missing auth)
export const createOptionalAuthTest = (middlewareFunc: any, scenario: any, shouldAuthenticate: boolean) => {
  return async (mockReq: any, mockRes: any, mockNext: any, authServiceMock: any) => {
    // Arrange
    let mockSessionData;
    if (shouldAuthenticate) {
      mockSessionData = setupValidSessionMock(authServiceMock);
    }
    Object.assign(mockReq, scenario);

    // Act
    await executeMiddleware(middlewareFunc, mockReq, mockRes, mockNext);

    // Assert
    if (shouldAuthenticate && mockSessionData) {
      expectAuthenticatedUser(mockReq, mockSessionData.user);
    } else {
      expect(mockReq.user).toBeUndefined();
    }
    expectAuthSuccess(mockNext, mockRes);
  };
};

// Helper for permission middleware tests
export const createPermissionTest = (permission: string, requirePermissionFunc: any, userOverrides = {}, shouldSucceed = true) => {
  return (mockReq: any, mockRes: any, mockNext: any) => {
    // Arrange
    const middleware = createPermissionMiddleware(permission, requirePermissionFunc);
    if (shouldSucceed) {
      mockReq.user = createMockUser(userOverrides);
    } else {
      delete mockReq.user;
    }

    // Act
    middleware(mockReq, mockRes, mockNext);

    // Assert
    if (shouldSucceed) {
      expectAuthSuccess(mockNext, mockRes);
    } else {
      expectStandardErrorResponse(mockRes, 401, 'Authentication required');
      expect(mockNext).not.toHaveBeenCalled();
    }
  };
};

// Helper for ownership middleware tests
export const createOwnershipTest = (requireOwnershipFunc: any, scenario: any, shouldSucceed = true, expectedStatus = 403, expectedMessage = 'Access denied: insufficient permissions') => {
  return (mockReq: any, mockRes: any, mockNext: any) => {
    // Arrange
    const middleware = createOwnershipMiddleware(requireOwnershipFunc);
    Object.assign(mockReq, scenario);

    // Act
    middleware(mockReq, mockRes, mockNext);

    // Assert
    if (shouldSucceed) {
      expectAuthSuccess(mockNext, mockRes);
    } else {
      expectStandardErrorResponse(mockRes, expectedStatus, expectedMessage);
      expect(mockNext).not.toHaveBeenCalled();
    }
  };
};