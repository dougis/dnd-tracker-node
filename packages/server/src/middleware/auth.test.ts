import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requireAuth, optionalAuth, setAuthService } from './auth.js';
import { AuthService } from '../services/auth.js';
import { createMockUser, createMockSession, createMockAuthService } from '../test/auth-test-utils.js';

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockAuthService: Partial<AuthService>;

  const mockUser = createMockUser();
  const mockSession = createMockSession();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockRequest = {
      headers: {},
      cookies: {},
    };
    
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis(),
      clearCookie: vi.fn().mockReturnThis(),
    };
    
    mockNext = vi.fn();
    
    // Create mock AuthService instance
    mockAuthService = createMockAuthService();
    
    // Set the mock service
    setAuthService(mockAuthService as AuthService);
  });

  describe('requireAuth', () => {
    it('should authenticate user with valid session token from Authorization header', async () => {
      mockRequest.headers = {
        authorization: 'Bearer sessiontoken123',
      };

      mockAuthService.validateSession = vi.fn().mockResolvedValue({
        session: mockSession,
        user: mockUser,
      });

      await requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAuthService.validateSession).toHaveBeenCalledWith('sessiontoken123');
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockRequest.session).toEqual(mockSession);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should authenticate user with valid session token from cookie', async () => {
      mockRequest.cookies = {
        session: 'sessiontoken123',
      };

      mockAuthService.validateSession = vi.fn().mockResolvedValue({
        session: mockSession,
        user: mockUser,
      });

      await requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAuthService.validateSession).toHaveBeenCalledWith('sessiontoken123');
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockRequest.session).toEqual(mockSession);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when no token provided', async () => {
      await requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when session is invalid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalidtoken',
      };

      mockAuthService.validateSession = vi.fn().mockResolvedValue({
        session: null,
        user: null,
      });

      await requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid or expired session',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle validation errors gracefully', async () => {
      mockRequest.headers = {
        authorization: 'Bearer sessiontoken123',
      };

      mockAuthService.validateSession = vi.fn().mockRejectedValue(new Error('Database error'));

      await requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication failed',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should refresh session cookie when session is fresh', async () => {
      const freshSession = { ...mockSession, fresh: true };
      
      mockRequest.cookies = {
        session: 'sessiontoken123',
      };

      mockAuthService.validateSession = vi.fn().mockResolvedValue({
        session: freshSession,
        user: mockUser,
      });

      await requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.cookie).toHaveBeenCalledWith('session', freshSession.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: expect.any(Number),
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should clear cookie when session is null', async () => {
      mockRequest.cookies = {
        session: 'expiredtoken',
      };

      mockAuthService.validateSession = vi.fn().mockResolvedValue({
        session: null,
        user: null,
      });

      await requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('session');
      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });
  });

  describe('optionalAuth', () => {
    it('should set user and session when valid token provided', async () => {
      mockRequest.headers = {
        authorization: 'Bearer sessiontoken123',
      };

      mockAuthService.validateSession = vi.fn().mockResolvedValue({
        session: mockSession,
        user: mockUser,
      });

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual(mockUser);
      expect(mockRequest.session).toEqual(mockSession);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without user when no token provided', async () => {
      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBeUndefined();
      expect(mockRequest.session).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without user when session is invalid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalidtoken',
      };

      mockAuthService.validateSession = vi.fn().mockResolvedValue({
        session: null,
        user: null,
      });

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBeUndefined();
      expect(mockRequest.session).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without user when validation throws error', async () => {
      mockRequest.headers = {
        authorization: 'Bearer sessiontoken123',
      };

      mockAuthService.validateSession = vi.fn().mockRejectedValue(new Error('Database error'));

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBeUndefined();
      expect(mockRequest.session).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should refresh session cookie when session is fresh in optional auth', async () => {
      const freshSession = { ...mockSession, fresh: true };
      
      mockRequest.cookies = {
        session: 'sessiontoken123',
      };

      mockAuthService.validateSession = vi.fn().mockResolvedValue({
        session: freshSession,
        user: mockUser,
      });

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.cookie).toHaveBeenCalledWith('session', freshSession.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: expect.any(Number),
      });
      expect(mockNext).toHaveBeenCalled();
    });
  });
});