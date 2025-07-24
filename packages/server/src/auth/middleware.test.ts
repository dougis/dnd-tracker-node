import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';

// Mock AuthService before importing middleware
const { mockValidateSession } = vi.hoisted(() => ({
  mockValidateSession: vi.fn()
}));

vi.mock('../services/AuthService', () => ({
  AuthService: vi.fn().mockImplementation(() => ({
    validateSession: mockValidateSession
  }))
}));

// Mock PrismaClient
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn()
}));

import { requireAuth, optionalAuth } from './middleware';

describe('Authentication Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
      cookies: {}
    };
    
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    
    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('requireAuth middleware', () => {
    it('should call next() for valid session', async () => {
      // Arrange
      mockReq.cookies = { session_id: 'valid_session_123' };
      
      const mockSessionData = {
        session: {
          id: 'valid_session_123',
          userId: 'user_123',
          expiresAt: new Date(Date.now() + 60000),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        user: {
          id: 'user_123',
          email: 'test@example.com',
          username: 'testuser',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };
      
      mockValidateSession.mockResolvedValue(mockSessionData);

      // Act
      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockValidateSession).toHaveBeenCalledWith('valid_session_123');
      expect(mockReq.user).toEqual({
        ...mockSessionData.user,
        tier: 'free'
      });
      expect(mockReq.session).toEqual(mockSessionData.session);
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
      mockValidateSession.mockResolvedValue(null);

      // Act
      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockValidateSession).toHaveBeenCalledWith('invalid_session');
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired session'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 for authentication service error', async () => {
      // Arrange
      mockReq.cookies = { session_id: 'valid_session_123' };
      mockValidateSession.mockRejectedValue(new Error('Database error'));

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

    it('should check Authorization header if no cookie', async () => {
      // Arrange
      mockReq.cookies = {};
      mockReq.headers = { authorization: 'Bearer valid_session_123' };
      
      const mockSessionData = {
        session: {
          id: 'valid_session_123',
          userId: 'user_123',
          expiresAt: new Date(Date.now() + 60000),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        user: {
          id: 'user_123',
          email: 'test@example.com',
          username: 'testuser',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };
      
      mockValidateSession.mockResolvedValue(mockSessionData);

      // Act
      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockValidateSession).toHaveBeenCalledWith('valid_session_123');
      expect(mockReq.user).toEqual({
        ...mockSessionData.user,
        tier: 'free'
      });
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('optionalAuth middleware', () => {
    it('should add user to request for valid session', async () => {
      // Arrange
      mockReq.cookies = { session_id: 'valid_session_123' };
      
      const mockSessionData = {
        session: {
          id: 'valid_session_123',
          userId: 'user_123',
          expiresAt: new Date(Date.now() + 60000),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        user: {
          id: 'user_123',
          email: 'test@example.com',
          username: 'testuser',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };
      
      mockValidateSession.mockResolvedValue(mockSessionData);

      // Act
      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockValidateSession).toHaveBeenCalledWith('valid_session_123');
      expect(mockReq.user).toEqual({
        ...mockSessionData.user,
        tier: 'free'
      });
      expect(mockReq.session).toEqual(mockSessionData.session);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should call next() without user for missing session', async () => {
      // Arrange
      mockReq.cookies = {};

      // Act
      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockValidateSession).not.toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should call next() without user for invalid session', async () => {
      // Arrange
      mockReq.cookies = { session_id: 'invalid_session' };
      mockValidateSession.mockResolvedValue(null);

      // Act
      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockValidateSession).toHaveBeenCalledWith('invalid_session');
      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should call next() without user for service error', async () => {
      // Arrange
      mockReq.cookies = { session_id: 'valid_session_123' };
      mockValidateSession.mockRejectedValue(new Error('Database error'));

      // Act
      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});