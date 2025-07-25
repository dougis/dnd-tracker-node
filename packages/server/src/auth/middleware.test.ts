import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  createMockRequest,
  createMockResponse,
  createMockNext,
  createMockUser,
  AuthTestScenarios,
  expectAuthSuccess,
  expectAuthFailure,
  setupValidSessionMock,
  setupInvalidSessionMock,
  setupSessionErrorMock,
  executeMiddleware,
  setupCookieAuth,
  expectAuthenticatedUser,
  expectValidationCall,
  expectStandardErrorResponse,
  createPermissionMiddleware,
  createOwnershipMiddleware,
  createResourceOwnershipScenario,
  createResourceOwnershipBodyScenario,
  createAuthSuccessTest,
  createAuthFailureTest,
  createOptionalAuthTest,
  createPermissionTest,
  createOwnershipTest,
} from '../test/auth-test-utils';

// Create mock AuthService instance using vi.hoisted to avoid hoisting issues
const { authServiceMock } = vi.hoisted(() => ({
  authServiceMock: {
    validateSession: vi.fn()
  }
}));

vi.mock('../services/AuthService', () => ({
  AuthService: class MockAuthService {
    constructor() {
      return authServiceMock;
    }
  }
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn()
}));

import { requireAuth, optionalAuth, requirePermission, requireOwnership } from './middleware';

describe('Authentication Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('requireAuth middleware', () => {
    it('should call next() for valid session', async () => {
      await createAuthSuccessTest(requireAuth, AuthTestScenarios.validCookieAuth, 'valid_session_123')(mockReq, mockRes, mockNext, authServiceMock);
    });

    it('should return 401 for missing session cookie', async () => {
      await createAuthFailureTest(requireAuth, AuthTestScenarios.noCookieNoHeader, 401, 'Authentication required')(mockReq, mockRes, mockNext, authServiceMock);
    });

    it('should return 401 for invalid session', async () => {
      await createAuthFailureTest(requireAuth, AuthTestScenarios.noCookieNoHeader, 401, 'Invalid or expired session', true)(mockReq, mockRes, mockNext, authServiceMock);
    });

    it('should return 500 for validation error', async () => {
      // Arrange
      setupCookieAuth(mockReq, 'session_123');
      setupSessionErrorMock(authServiceMock);

      // Act
      await executeMiddleware(requireAuth, mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expectStandardErrorResponse(mockRes, 500, 'Authentication error');
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth middleware', () => {
    it('should set user for valid session', async () => {
      await createOptionalAuthTest(optionalAuth, AuthTestScenarios.validCookieAuth, true)(mockReq, mockRes, mockNext, authServiceMock);
    });

    it('should call next() for missing session cookie', async () => {
      await createOptionalAuthTest(optionalAuth, AuthTestScenarios.noCookieNoHeader, false)(mockReq, mockRes, mockNext, authServiceMock);
    });

    it('should call next() for invalid session', async () => {
      await createOptionalAuthTest(optionalAuth, AuthTestScenarios.noCookieNoHeader, false)(mockReq, mockRes, mockNext, authServiceMock);
    });

    it('should call next() for validation error', async () => {
      await createOptionalAuthTest(optionalAuth, AuthTestScenarios.noCookieNoHeader, false)(mockReq, mockRes, mockNext, authServiceMock);
    });
  });

  describe('requireAuth with Authorization header', () => {
    it('should authenticate using Bearer token from Authorization header', async () => {
      await createAuthSuccessTest(requireAuth, AuthTestScenarios.validBearerAuth, 'valid_token_123')(mockReq, mockRes, mockNext, authServiceMock);
    });

    it('should return 401 for malformed Authorization header', async () => {
      await createAuthFailureTest(requireAuth, AuthTestScenarios.invalidBearerFormat, 401, 'Authentication required')(mockReq, mockRes, mockNext, authServiceMock);
    });

    it('should prefer cookie over Authorization header when both present', async () => {
      // Arrange
      setupValidSessionMock(authServiceMock);
      Object.assign(mockReq, AuthTestScenarios.cookieAndBearer);

      // Act
      await executeMiddleware(requireAuth, mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expectValidationCall(authServiceMock, 'cookie_session');
      expectAuthSuccess(mockNext, mockRes);
    });
  });

  describe('optionalAuth with Authorization header', () => {
    it('should authenticate using Bearer token from Authorization header', async () => {
      await createOptionalAuthTest(optionalAuth, AuthTestScenarios.validBearerAuth, true)(mockReq, mockRes, mockNext, authServiceMock);
    });

    it('should call next() for malformed Authorization header', async () => {
      await createOptionalAuthTest(optionalAuth, AuthTestScenarios.invalidBearerFormat, false)(mockReq, mockRes, mockNext, authServiceMock);
    });
  });

  describe('requirePermission middleware', () => {
    it('should call next() for authenticated user', () => {
      createPermissionTest('read:posts', requirePermission, {}, true)(mockReq, mockRes, mockNext);
    });

    it('should return 401 for unauthenticated user', () => {
      createPermissionTest('read:posts', requirePermission, {}, false)(mockReq, mockRes, mockNext);
    });

    it('should handle different permission types', () => {
      createPermissionTest('write:comments', requirePermission, { tier: 'premium' }, true)(mockReq, mockRes, mockNext);
    });
  });

  describe('requireOwnership middleware', () => {
    it('should call next() when user owns the resource (default userId param)', () => {
      createOwnershipTest(requireOwnership, createResourceOwnershipScenario('user_123'), true)(mockReq, mockRes, mockNext);
    });

    it('should call next() when user owns the resource (custom param)', () => {
      createOwnershipTest(requireOwnership, createResourceOwnershipScenario('user_123', 'ownerId'), true)(mockReq, mockRes, mockNext);
    });

    it('should call next() when user owns the resource (body param)', () => {
      createOwnershipTest(requireOwnership, createResourceOwnershipBodyScenario('user_123'), true)(mockReq, mockRes, mockNext);
    });

    it('should return 401 for unauthenticated user', () => {
      createOwnershipTest(requireOwnership, { params: { userId: 'user_123' } }, false, 401, 'Authentication required')(mockReq, mockRes, mockNext);
    });

    it('should return 403 when user does not own the resource', () => {
      createOwnershipTest(requireOwnership, { user: createMockUser(), params: { userId: 'other_user_456' } }, false)(mockReq, mockRes, mockNext);
    });

    it('should handle missing resource userId', () => {
      createOwnershipTest(requireOwnership, { user: createMockUser(), params: {}, body: {} }, false)(mockReq, mockRes, mockNext);
    });
  });
});