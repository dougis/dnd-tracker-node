import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  createMockSessionData,
  createMockRequest,
  createMockResponse,
  createMockNext,
  createMockUser,
  AuthTestScenarios,
  expectAuthSuccess,
  expectAuthFailure,
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
      // Arrange
      const mockSessionData = createMockSessionData();
      Object.assign(mockReq, AuthTestScenarios.validCookieAuth);
      authServiceMock.validateSession.mockResolvedValue(mockSessionData);

      // Act
      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(authServiceMock.validateSession).toHaveBeenCalledWith('valid_session_123');
      expect(mockReq.user).toEqual(mockSessionData.user);
      expectAuthSuccess(mockNext, mockRes);
    });

    it('should return 401 for missing session cookie', async () => {
      // Arrange
      Object.assign(mockReq, AuthTestScenarios.noCookieNoHeader);

      // Act
      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expectAuthFailure(mockRes, mockNext, 401, 'Authentication required');
    });

    it('should return 401 for invalid session', async () => {
      // Arrange
      mockReq.cookies = { session_id: 'invalid_session' };
      authServiceMock.validateSession.mockResolvedValue(null);

      // Act
      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(authServiceMock.validateSession).toHaveBeenCalledWith('invalid_session');
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired session'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 for validation error', async () => {
      // Arrange
      mockReq.cookies = { session_id: 'session_123' };
      authServiceMock.validateSession.mockRejectedValue(new Error('Database error'));

      // Act
      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication error'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth middleware', () => {
    it('should set user for valid session', async () => {
      // Arrange
      const mockSessionData = createMockSessionData();
      Object.assign(mockReq, AuthTestScenarios.validCookieAuth);
      authServiceMock.validateSession.mockResolvedValue(mockSessionData);

      // Act
      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(authServiceMock.validateSession).toHaveBeenCalledWith('valid_session_123');
      expect(mockReq.user).toEqual(mockSessionData.user);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should call next() for missing session cookie', async () => {
      // Arrange
      Object.assign(mockReq, AuthTestScenarios.noCookieNoHeader);

      // Act
      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(authServiceMock.validateSession).not.toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should call next() for invalid session', async () => {
      // Arrange
      mockReq.cookies = { session_id: 'invalid_session' };
      authServiceMock.validateSession.mockResolvedValue(null);

      // Act
      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(authServiceMock.validateSession).toHaveBeenCalledWith('invalid_session');
      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should call next() for validation error', async () => {
      // Arrange
      mockReq.cookies = { session_id: 'session_123' };
      authServiceMock.validateSession.mockRejectedValue(new Error('Database error'));

      // Act
      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('requireAuth with Authorization header', () => {
    it('should authenticate using Bearer token from Authorization header', async () => {
      // Arrange
      const mockSessionData = createMockSessionData();
      Object.assign(mockReq, AuthTestScenarios.validBearerAuth);
      authServiceMock.validateSession.mockResolvedValue(mockSessionData);

      // Act
      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(authServiceMock.validateSession).toHaveBeenCalledWith('valid_token_123');
      expect(mockReq.user).toEqual(mockSessionData.user);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 401 for malformed Authorization header', async () => {
      // Arrange
      Object.assign(mockReq, AuthTestScenarios.invalidBearerFormat);

      // Act
      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(authServiceMock.validateSession).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should prefer cookie over Authorization header when both present', async () => {
      // Arrange
      const mockSessionData = createMockSessionData();
      Object.assign(mockReq, AuthTestScenarios.cookieAndBearer);
      authServiceMock.validateSession.mockResolvedValue(mockSessionData);

      // Act
      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(authServiceMock.validateSession).toHaveBeenCalledWith('cookie_session');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('optionalAuth with Authorization header', () => {
    it('should authenticate using Bearer token from Authorization header', async () => {
      // Arrange
      const mockSessionData = createMockSessionData();
      Object.assign(mockReq, AuthTestScenarios.validBearerAuth);
      authServiceMock.validateSession.mockResolvedValue(mockSessionData);

      // Act
      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(authServiceMock.validateSession).toHaveBeenCalledWith('valid_token_123');
      expect(mockReq.user).toEqual(mockSessionData.user);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should call next() for malformed Authorization header', async () => {
      // Arrange
      Object.assign(mockReq, AuthTestScenarios.invalidBearerFormat);

      // Act
      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(authServiceMock.validateSession).not.toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('requirePermission middleware', () => {
    it('should call next() for authenticated user', () => {
      // Arrange
      const middleware = requirePermission('read:posts');
      mockReq.user = createMockUser();

      // Act
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 401 for unauthenticated user', () => {
      // Arrange
      const middleware = requirePermission('read:posts');
      delete mockReq.user;

      // Act
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle different permission types', () => {
      // Arrange
      const middleware = requirePermission('write:comments');
      mockReq.user = createMockUser({ tier: 'premium' });

      // Act
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('requireOwnership middleware', () => {
    it('should call next() when user owns the resource (default userId param)', () => {
      // Arrange
      const middleware = requireOwnership();
      mockReq.user = createMockUser();
      mockReq.params = { userId: 'user_123' };

      // Act
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should call next() when user owns the resource (custom param)', () => {
      // Arrange
      const middleware = requireOwnership('ownerId');
      mockReq.user = createMockUser();
      mockReq.params = { ownerId: 'user_123' };

      // Act
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should call next() when user owns the resource (body param)', () => {
      // Arrange
      const middleware = requireOwnership();
      mockReq.user = createMockUser();
      mockReq.params = {};
      mockReq.body = { userId: 'user_123' };

      // Act
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 401 for unauthenticated user', () => {
      // Arrange
      const middleware = requireOwnership();
      delete mockReq.user;
      mockReq.params = { userId: 'user_123' };

      // Act
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user does not own the resource', () => {
      // Arrange
      const middleware = requireOwnership();
      mockReq.user = createMockUser();
      mockReq.params = { userId: 'other_user_456' };

      // Act
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied: insufficient permissions'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle missing resource userId', () => {
      // Arrange
      const middleware = requireOwnership();
      mockReq.user = createMockUser();
      mockReq.params = {};
      mockReq.body = {};

      // Act
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied: insufficient permissions'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});