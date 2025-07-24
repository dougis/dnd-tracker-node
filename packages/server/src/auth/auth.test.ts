import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthService } from '../services/AuthService';
import { hash, verify } from 'argon2';

// Mock Argon2
vi.mock('argon2', () => ({
  hash: vi.fn(),
  verify: vi.fn()
}));

// Mock Prisma
const mockPrisma = {
  user: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn()
  },
  session: {
    create: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn()
  }
};

describe('Authentication System', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService(mockPrisma as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('User Registration', () => {
    it('should register a new user with hashed password', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecurePassword123!'
      };
      
      const hashedPassword = 'hashed_password_value';
      (hash as any).mockResolvedValue(hashedPassword);
      
      const mockUser = {
        id: 'user_123',
        email: userData.email,
        username: userData.username,
        passwordHash: hashedPassword,
        failedLoginAttempts: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockPrisma.user.create.mockResolvedValue(mockUser);

      // Act
      const result = await authService.register(userData.email, userData.username, userData.password);

      // Assert
      expect(hash).toHaveBeenCalledWith(userData.password);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          username: userData.username,
          passwordHash: hashedPassword,
          failedLoginAttempts: 0,
          lockedUntil: null
        }
      });
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        failedLoginAttempts: mockUser.failedLoginAttempts,
        lockedUntil: mockUser.lockedUntil,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt
      });
    });

    it('should throw error if user already exists with email', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing_user' });

      // Act & Assert
      await expect(
        authService.register('existing@example.com', 'newuser', 'SecurePassword123!')
      ).rejects.toThrow('User with this email already exists');
    });

    it('should throw error if user already exists with username', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValueOnce(null); // Email check
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'existing_user' }); // Username check

      // Act & Assert
      await expect(
        authService.register('new@example.com', 'existinguser', 'SecurePassword123!')
      ).rejects.toThrow('User with this username already exists');
    });

    it('should validate password strength', async () => {
      // Act & Assert
      await expect(
        authService.register('test@example.com', 'testuser', 'weak')
      ).rejects.toThrow('Password does not meet security requirements');
    });

    it('should validate email format', async () => {
      // Act & Assert
      await expect(
        authService.register('invalid-email', 'testuser', 'SecurePassword123!')
      ).rejects.toThrow('Invalid email format');
    });
  });

  describe('User Login', () => {
    const mockUser = {
      id: 'user_123',
      email: 'test@example.com',
      username: 'testuser',
      passwordHash: 'hashed_password',
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should login successfully with correct credentials', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (verify as any).mockResolvedValue(true);
      
      const mockSession = {
        id: 'session_123',
        userId: mockUser.id,
        token: 'session_token_123',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockPrisma.session.create.mockResolvedValue(mockSession);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, failedLoginAttempts: 0, lockedUntil: null });

      // Act
      const result = await authService.login('test@example.com', 'correct_password');

      // Assert
      expect(verify).toHaveBeenCalledWith(mockUser.passwordHash, 'correct_password');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { failedLoginAttempts: 0, lockedUntil: null }
      });
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('session');
    });

    it('should fail login with incorrect password', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (verify as any).mockResolvedValue(false);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, failedLoginAttempts: 1 });

      // Act & Assert
      await expect(
        authService.login('test@example.com', 'wrong_password')
      ).rejects.toThrow('Invalid credentials');
      
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { failedLoginAttempts: 1 }
      });
    });

    it('should fail login with non-existent user', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        authService.login('nonexistent@example.com', 'password')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('Account Lockout', () => {
    const baseUser = {
      id: 'user_123',
      email: 'test@example.com',
      username: 'testuser',
      passwordHash: 'hashed_password',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should lock account after 5 failed login attempts', async () => {
      // Arrange
      const userWith4Fails = { ...baseUser, failedLoginAttempts: 4, lockedUntil: null };
      mockPrisma.user.findUnique.mockResolvedValue(userWith4Fails);
      (verify as any).mockResolvedValue(false);
      
      const expectedLockTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
      mockPrisma.user.update.mockResolvedValue({ 
        ...userWith4Fails, 
        failedLoginAttempts: 5, 
        lockedUntil: expectedLockTime 
      });

      // Act & Assert
      await expect(
        authService.login('test@example.com', 'wrong_password')
      ).rejects.toThrow('Account locked due to too many failed attempts');
      
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userWith4Fails.id },
        data: { 
          failedLoginAttempts: 5,
          lockedUntil: expect.any(Date)
        }
      });
    });

    it('should prevent login when account is locked', async () => {
      // Arrange
      const lockedUser = { 
        ...baseUser, 
        failedLoginAttempts: 5, 
        lockedUntil: new Date(Date.now() + 10 * 60 * 1000) // Locked for 10 more minutes
      };
      mockPrisma.user.findUnique.mockResolvedValue(lockedUser);

      // Act & Assert
      await expect(
        authService.login('test@example.com', 'correct_password')
      ).rejects.toThrow('Account is locked');
    });

    it('should allow login when lockout period has expired', async () => {
      // Arrange
      const expiredLockedUser = { 
        ...baseUser, 
        failedLoginAttempts: 5, 
        lockedUntil: new Date(Date.now() - 1000) // Lockout expired 1 second ago
      };
      mockPrisma.user.findUnique.mockResolvedValue(expiredLockedUser);
      (verify as any).mockResolvedValue(true);
      
      const mockSession = {
        id: 'session_123',
        userId: baseUser.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockPrisma.session.create.mockResolvedValue(mockSession);
      mockPrisma.user.update.mockResolvedValue({ 
        ...expiredLockedUser, 
        failedLoginAttempts: 0, 
        lockedUntil: null 
      });

      // Act
      const result = await authService.login('test@example.com', 'correct_password');

      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('session');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: expiredLockedUser.id },
        data: { failedLoginAttempts: 0, lockedUntil: null }
      });
    });

    it('should reset failed attempts on successful login', async () => {
      // Arrange
      const userWith3Fails = { ...baseUser, failedLoginAttempts: 3, lockedUntil: null };
      mockPrisma.user.findUnique.mockResolvedValue(userWith3Fails);
      (verify as any).mockResolvedValue(true);
      
      const mockSession = {
        id: 'session_123',
        userId: baseUser.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockPrisma.session.create.mockResolvedValue(mockSession);
      mockPrisma.user.update.mockResolvedValue({ 
        ...userWith3Fails, 
        failedLoginAttempts: 0, 
        lockedUntil: null 
      });

      // Act
      await authService.login('test@example.com', 'correct_password');

      // Assert
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userWith3Fails.id },
        data: { failedLoginAttempts: 0, lockedUntil: null }
      });
    });
  });

  describe('Session Management', () => {
    it('should create session on successful login', async () => {
      // Arrange
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashed_password',
        failedLoginAttempts: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (verify as any).mockResolvedValue(true);
      
      const mockSession = {
        id: 'session_123',
        userId: mockUser.id,
        token: 'session_token_123',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockPrisma.session.create.mockResolvedValue(mockSession);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      // Act
      const result = await authService.login('test@example.com', 'password');

      // Assert
      expect(mockPrisma.session.create).toHaveBeenCalledWith({
        data: {
          id: expect.any(String),
          userId: mockUser.id,
          token: expect.any(String),
          expiresAt: expect.any(Date)
        }
      });
      expect(result.session).toEqual(mockSession);
    });

    it('should validate session correctly', async () => {
      // Arrange
      const validSession = {
        id: 'session_123',
        userId: 'user_123',
        token: 'session_token_123',
        expiresAt: new Date(Date.now() + 60000), // Expires in 1 minute
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user_123',
          email: 'test@example.com',
          username: 'testuser'
        }
      };
      
      mockPrisma.session.findUnique.mockResolvedValue(validSession);

      // Act
      const result = await authService.validateSession('session_token_123');

      // Assert
      expect(result).toEqual({
        user: validSession.user,
        session: {
          id: validSession.id,
          userId: validSession.userId,
          expiresAt: validSession.expiresAt,
          createdAt: validSession.createdAt,
          updatedAt: validSession.updatedAt,
          user: validSession.user
        }
      });
    });

    it('should reject expired session', async () => {
      // Arrange
      const expiredSession = {
        id: 'session_123',
        userId: 'user_123',
        token: 'session_token_123',
        expiresAt: new Date(Date.now() - 60000), // Expired 1 minute ago
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockPrisma.session.findUnique.mockResolvedValue(expiredSession);
      mockPrisma.session.delete.mockResolvedValue(expiredSession);

      // Act
      const result = await authService.validateSession('session_token_123');

      // Assert
      expect(result).toBeNull();
      expect(mockPrisma.session.delete).toHaveBeenCalledWith({
        where: { token: 'session_token_123' }
      });
    });

    it('should logout and delete session', async () => {
      // Arrange
      mockPrisma.session.delete.mockResolvedValue({
        id: 'session_123',
        userId: 'user_123',
        token: 'session_token_123',
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Act
      await authService.logout('session_token_123');

      // Assert
      expect(mockPrisma.session.delete).toHaveBeenCalledWith({
        where: { token: 'session_token_123' }
      });
    });
  });

  describe('Password Security', () => {
    it('should enforce minimum password length', async () => {
      await expect(
        authService.register('test@example.com', 'testuser', 'short')
      ).rejects.toThrow('Password does not meet security requirements');
    });

    it('should require uppercase letter', async () => {
      await expect(
        authService.register('test@example.com', 'testuser', 'nouppercase123!')
      ).rejects.toThrow('Password does not meet security requirements');
    });

    it('should require lowercase letter', async () => {
      await expect(
        authService.register('test@example.com', 'testuser', 'NOLOWERCASE123!')
      ).rejects.toThrow('Password does not meet security requirements');
    });

    it('should require number', async () => {
      await expect(
        authService.register('test@example.com', 'testuser', 'NoNumbers!')
      ).rejects.toThrow('Password does not meet security requirements');
    });

    it('should require special character', async () => {
      await expect(
        authService.register('test@example.com', 'testuser', 'NoSpecialChar123')
      ).rejects.toThrow('Password does not meet security requirements');
    });

    it('should accept valid password', () => {
      expect(() => authService.validatePassword('ValidPass123!')).not.toThrow();
    });
  });
});