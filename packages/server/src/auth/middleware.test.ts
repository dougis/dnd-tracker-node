import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';

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
    
    mockReq = {
      headers: {},
      cookies: {},
      params: {},
      body: {}
    };
    
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    
    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('requireAuth middleware', () => {
    it('should call next() for valid session', async () => {
      // Arrange
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        tier: 'free',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockSessionData = {
        user: mockUser,
        session: {
          id: 'session_123',
          userId: 'user_123',
          expiresAt: new Date(Date.now() + 60000),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      mockReq.cookies = { session_id: 'valid_session_123' };
      authServiceMock.validateSession.mockResolvedValue(mockSessionData);

      // Act
      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(authServiceMock.validateSession).toHaveBeenCalledWith('valid_session_123');
      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 401 for missing session cookie', async () => {
      // Arrange
      mockReq.cookies = {};

      // Act
      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(mockNext).not.toHaveBeenCalled();
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
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        tier: 'free',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockSessionData = {
        user: mockUser,
        session: {
          id: 'session_123',
          userId: 'user_123',
          expiresAt: new Date(Date.now() + 60000),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      mockReq.cookies = { session_id: 'valid_session_123' };
      authServiceMock.validateSession.mockResolvedValue(mockSessionData);

      // Act
      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(authServiceMock.validateSession).toHaveBeenCalledWith('valid_session_123');
      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should call next() for missing session cookie', async () => {
      // Arrange
      mockReq.cookies = {};

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
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        tier: 'free',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockSessionData = {
        user: mockUser,
        session: {
          id: 'session_123',
          userId: 'user_123',
          expiresAt: new Date(Date.now() + 60000),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      mockReq.cookies = {}; // No cookie
      mockReq.headers = { authorization: 'Bearer valid_token_123' };
      authServiceMock.validateSession.mockResolvedValue(mockSessionData);

      // Act
      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(authServiceMock.validateSession).toHaveBeenCalledWith('valid_token_123');
      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 401 for malformed Authorization header', async () => {
      // Arrange
      mockReq.cookies = {};
      mockReq.headers = { authorization: 'InvalidFormat token123' };

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
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        tier: 'free',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockSessionData = {
        user: mockUser,
        session: {
          id: 'session_123',
          userId: 'user_123',
          expiresAt: new Date(Date.now() + 60000),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      mockReq.cookies = { session_id: 'cookie_session' };
      mockReq.headers = { authorization: 'Bearer header_token' };
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
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        tier: 'free',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockSessionData = {
        user: mockUser,
        session: {
          id: 'session_123',
          userId: 'user_123',
          expiresAt: new Date(Date.now() + 60000),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      mockReq.cookies = {}; // No cookie
      mockReq.headers = { authorization: 'Bearer valid_token_123' };
      authServiceMock.validateSession.mockResolvedValue(mockSessionData);

      // Act
      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(authServiceMock.validateSession).toHaveBeenCalledWith('valid_token_123');
      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should call next() for malformed Authorization header', async () => {
      // Arrange
      mockReq.cookies = {};
      mockReq.headers = { authorization: 'InvalidFormat token123' };

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
      mockReq.user = {
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        tier: 'free',
        failedLoginAttempts: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Act
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 401 for unauthenticated user', () => {
      // Arrange
      const middleware = requirePermission('read:posts');
      mockReq.user = undefined;

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
      mockReq.user = {
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        tier: 'premium',
        failedLoginAttempts: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

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
      mockReq.user = {
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        tier: 'free',
        failedLoginAttempts: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
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
      mockReq.user = {
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        tier: 'free',
        failedLoginAttempts: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
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
      mockReq.user = {
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        tier: 'free',
        failedLoginAttempts: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
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
      mockReq.user = undefined;
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
      mockReq.user = {
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        tier: 'free',
        failedLoginAttempts: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
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
      mockReq.user = {
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        tier: 'free',
        failedLoginAttempts: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
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