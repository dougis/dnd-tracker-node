import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { AuthService } from './auth.js';
import * as argon2 from 'argon2';

// Mock argon2
vi.mock('argon2');
const mockArgon2 = vi.mocked(argon2);

// Mock Lucia
vi.mock('lucia', () => ({
  Lucia: vi.fn().mockImplementation(() => ({
    createSession: vi.fn(),
    validateSession: vi.fn(),
    invalidateSession: vi.fn(),
    deleteExpiredSessions: vi.fn(),
  })),
}));

describe('AuthService', () => {
  let prisma: PrismaClient;
  let authService: AuthService;

  const mockUser = {
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
  };

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService(prisma);
  });

  describe('registerUser', () => {
    it('should successfully register a new user with hashed password', async () => {
      const userData = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'SecurePass123!',
      };

      mockArgon2.hash.mockResolvedValue('hashedpassword');
      
      const mockCreatedUser = {
        ...mockUser,
        id: 'newuser123',
        email: userData.email,
        username: userData.username,
        passwordHash: 'hashedpassword',
      };

      prisma.user.create = vi.fn().mockResolvedValue(mockCreatedUser);

      const result = await authService.registerUser(userData.email, userData.username, userData.password);

      expect(mockArgon2.hash).toHaveBeenCalledWith(userData.password);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          username: userData.username,
          passwordHash: 'hashedpassword',
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
      expect(result).toEqual({
        id: mockCreatedUser.id,
        email: mockCreatedUser.email,
        username: mockCreatedUser.username,
        isEmailVerified: mockCreatedUser.isEmailVerified,
        isAdmin: mockCreatedUser.isAdmin,
        lastLoginAt: mockCreatedUser.lastLoginAt,
      });
    });

    it('should throw error if email already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        username: 'newuser',
        password: 'SecurePass123!',
      };

      prisma.user.create = vi.fn().mockRejectedValue(new Error('Unique constraint failed'));

      await expect(authService.registerUser(userData.email, userData.username, userData.password))
        .rejects.toThrow('User with this email or username already exists');
    });

    it('should throw error if username already exists', async () => {
      const userData = {
        email: 'newuser@example.com',
        username: 'existinguser',
        password: 'SecurePass123!',
      };

      prisma.user.create = vi.fn().mockRejectedValue(new Error('Unique constraint failed'));

      await expect(authService.registerUser(userData.email, userData.username, userData.password))
        .rejects.toThrow('User with this email or username already exists');
    });
  });

  describe('authenticateUser', () => {
    it('should successfully authenticate user with correct credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'correctpassword',
      };

      mockArgon2.verify.mockResolvedValue(true);
      prisma.user.findUnique = vi.fn().mockResolvedValue(mockUser);
      prisma.user.update = vi.fn().mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      });

      const result = await authService.authenticateUser(loginData.email, loginData.password);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginData.email },
      });
      expect(mockArgon2.verify).toHaveBeenCalledWith(mockUser.passwordHash, loginData.password);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: expect.any(Date),
        },
      });
      expect(result).toEqual(expect.objectContaining({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
      }));
    });

    it('should throw error if user does not exist', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password',
      };

      prisma.user.findUnique = vi.fn().mockResolvedValue(null);

      await expect(authService.authenticateUser(loginData.email, loginData.password))
        .rejects.toThrow('Invalid email or password');
    });

    it('should throw error if password is incorrect', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockArgon2.verify.mockResolvedValue(false);
      prisma.user.findUnique = vi.fn().mockResolvedValue(mockUser);
      prisma.user.update = vi.fn().mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 1,
      });

      await expect(authService.authenticateUser(loginData.email, loginData.password))
        .rejects.toThrow('Invalid email or password');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          failedLoginAttempts: 1,
        },
      });
    });

    it('should lock account after 5 failed login attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const userWith4Attempts = {
        ...mockUser,
        failedLoginAttempts: 4,
      };

      mockArgon2.verify.mockResolvedValue(false);
      prisma.user.findUnique = vi.fn().mockResolvedValue(userWith4Attempts);
      prisma.user.update = vi.fn().mockResolvedValue({
        ...userWith4Attempts,
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      });

      await expect(authService.authenticateUser(loginData.email, loginData.password))
        .rejects.toThrow('Invalid email or password');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          failedLoginAttempts: 5,
          lockedUntil: expect.any(Date),
        },
      });
    });

    it('should reject login for locked account within lockout period', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'correctpassword',
      };

      const lockedUser = {
        ...mockUser,
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes in future
      };

      prisma.user.findUnique = vi.fn().mockResolvedValue(lockedUser);

      await expect(authService.authenticateUser(loginData.email, loginData.password))
        .rejects.toThrow('Account is locked. Please try again later.');
    });

    it('should allow login for account past lockout period', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'correctpassword',
      };

      const expiredLockedUser = {
        ...mockUser,
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() - 1000), // 1 second in past
      };

      mockArgon2.verify.mockResolvedValue(true);
      prisma.user.findUnique = vi.fn().mockResolvedValue(expiredLockedUser);
      prisma.user.update = vi.fn().mockResolvedValue({
        ...expiredLockedUser,
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      });

      const result = await authService.authenticateUser(loginData.email, loginData.password);

      expect(result).toEqual(expect.objectContaining({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
      }));
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: expect.any(Date),
        },
      });
    });
  });

  describe('isAccountLocked', () => {
    it('should return true for account locked within lockout period', () => {
      const lockedUser = {
        ...mockUser,
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes in future
      };

      const result = authService.isAccountLocked(lockedUser);
      expect(result).toBe(true);
    });

    it('should return false for account past lockout period', () => {
      const expiredLockedUser = {
        ...mockUser,
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() - 1000), // 1 second in past
      };

      const result = authService.isAccountLocked(expiredLockedUser);
      expect(result).toBe(false);
    });

    it('should return false for account with no lockout', () => {
      const unlockedUser = {
        ...mockUser,
        failedLoginAttempts: 2,
        lockedUntil: null,
      };

      const result = authService.isAccountLocked(unlockedUser);
      expect(result).toBe(false);
    });
  });

  describe('createSession', () => {
    it('should create session for authenticated user', async () => {
      const sessionData = {
        userId: 'user123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
      };

      const mockLuciaSession = {
        id: 'session123',
        userId: sessionData.userId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        fresh: true,
      };

      authService.lucia.createSession = vi.fn().mockResolvedValue(mockLuciaSession);

      const result = await authService.createSession(sessionData.userId, sessionData.ipAddress, sessionData.userAgent);

      expect(authService.lucia.createSession).toHaveBeenCalledWith(
        sessionData.userId,
        {
          ipAddress: sessionData.ipAddress,
          userAgent: sessionData.userAgent,
        }
      );
      expect(result).toEqual({
        id: mockLuciaSession.id,
        token: mockLuciaSession.id,
        userId: mockLuciaSession.userId,
        expiresAt: mockLuciaSession.expiresAt,
        ipAddress: sessionData.ipAddress,
        userAgent: sessionData.userAgent,
        fresh: true,
      });
    });
  });

  describe('validateSession', () => {
    it('should validate valid session', async () => {
      const sessionToken = 'validtoken123';
      const mockLuciaResult = {
        session: {
          id: 'session123',
          userId: 'user123',
          expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
          fresh: true,
        },
        user: {
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
          isEmailVerified: mockUser.isEmailVerified,
          isAdmin: mockUser.isAdmin,
        },
      };

      authService.lucia.validateSession = vi.fn().mockResolvedValue(mockLuciaResult);

      const result = await authService.validateSession(sessionToken);

      expect(authService.lucia.validateSession).toHaveBeenCalledWith(sessionToken);
      expect(result).toEqual({
        session: {
          id: mockLuciaResult.session.id,
          token: mockLuciaResult.session.id,
          userId: mockLuciaResult.session.userId,
          expiresAt: mockLuciaResult.session.expiresAt,
          fresh: mockLuciaResult.session.fresh,
        },
        user: mockLuciaResult.user,
      });
    });

    it('should return null for invalid session', async () => {
      const sessionToken = 'invalidtoken123';

      authService.lucia.validateSession = vi.fn().mockResolvedValue({
        session: null,
        user: null,
      });

      const result = await authService.validateSession(sessionToken);

      expect(result.session).toBeNull();
      expect(result.user).toBeNull();
    });
  });

  describe('invalidateSession', () => {
    it('should invalidate session', async () => {
      const sessionId = 'session123';

      authService.lucia.invalidateSession = vi.fn().mockResolvedValue(undefined);

      await authService.invalidateSession(sessionId);

      expect(authService.lucia.invalidateSession).toHaveBeenCalledWith(sessionId);
    });
  });
});