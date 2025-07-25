import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UserService } from '../UserService';
import { createMockPrisma } from './PartyService.helpers';

describe('UserService', () => {
  let userService: UserService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: 'hashed_password',
    failedLoginAttempts: 0,
    lockedUntil: null,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z')
  };

  const mockUserWithoutPassword = {
    id: 'user123',
    email: 'test@example.com',
    username: 'testuser',
    failedLoginAttempts: 0,
    lockedUntil: null,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z')
  };

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    userService = new UserService(mockPrisma);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getUserById', () => {
    it('should return user without password hash when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.getUserById('user123');

      expect(result).toEqual(mockUserWithoutPassword);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user123' }
      });
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.getUserById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should return user without password hash when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.getUserByEmail('test@example.com');

      expect(result).toEqual(mockUserWithoutPassword);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.getUserByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('getUserByUsername', () => {
    it('should return user without password hash when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.getUserByUsername('testuser');

      expect(result).toEqual(mockUserWithoutPassword);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' }
      });
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.getUserByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('isAccountLocked', () => {
    it('should return true when account is locked', async () => {
      const futureDate = new Date(Date.now() + 60000); // 1 minute from now
      mockPrisma.user.findUnique.mockResolvedValue({
        lockedUntil: futureDate
      });

      const result = await userService.isAccountLocked('user123');

      expect(result).toBe(true);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user123' },
        select: { lockedUntil: true }
      });
    });

    it('should return false when account is not locked', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        lockedUntil: null
      });

      const result = await userService.isAccountLocked('user123');

      expect(result).toBe(false);
    });

    it('should return false when lock has expired', async () => {
      const pastDate = new Date(Date.now() - 60000); // 1 minute ago
      mockPrisma.user.findUnique.mockResolvedValue({
        lockedUntil: pastDate
      });

      const result = await userService.isAccountLocked('user123');

      expect(result).toBe(false);
    });

    it('should return false when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.isAccountLocked('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('getFailedLoginAttempts', () => {
    it('should return failed login attempts count', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        failedLoginAttempts: 3
      });

      const result = await userService.getFailedLoginAttempts('user123');

      expect(result).toBe(3);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user123' },
        select: { failedLoginAttempts: true }
      });
    });

    it('should return 0 when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.getFailedLoginAttempts('nonexistent');

      expect(result).toBe(0);
    });
  });

  describe('unlockAccount', () => {
    it('should reset failed attempts and clear lock', async () => {
      mockPrisma.user.update.mockResolvedValue({});

      await userService.unlockAccount('user123');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user123' },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null
        }
      });
    });
  });

  describe('updateProfile', () => {
    it('should update username successfully', async () => {
      const updatedUser = { ...mockUser, username: 'newusername' };
      const expectedResult = { ...mockUserWithoutPassword, username: 'newusername' };
      
      mockPrisma.user.findUnique.mockResolvedValue(null); // No existing user with new username
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await userService.updateProfile('user123', { username: 'newusername' });

      expect(result).toEqual(expectedResult);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'newusername' }
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user123' },
        data: { username: 'newusername' }
      });
    });

    it('should allow user to keep their own username', async () => {
      const existingUser = { ...mockUser };
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const result = await userService.updateProfile('user123', { username: 'testuser' });

      expect(result).toEqual(mockUserWithoutPassword);
    });

    it('should reject taken username', async () => {
      const existingUser = { ...mockUser, id: 'different-user' };
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);

      await expect(userService.updateProfile('user123', { username: 'testuser' }))
        .rejects.toThrow('Username is already taken');

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should reject username shorter than 3 characters', async () => {
      await expect(userService.updateProfile('user123', { username: 'ab' }))
        .rejects.toThrow('Username must be between 3 and 30 characters');

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should reject username longer than 30 characters', async () => {
      const longUsername = 'a'.repeat(31);
      await expect(userService.updateProfile('user123', { username: longUsername }))
        .rejects.toThrow('Username must be between 3 and 30 characters');

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should reject username with invalid characters', async () => {
      await expect(userService.updateProfile('user123', { username: 'user@name' }))
        .rejects.toThrow('Username can only contain letters, numbers, underscores, and hyphens');

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should accept valid username with allowed characters', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, username: 'valid_user-123' });

      await userService.updateProfile('user123', { username: 'valid_user-123' });

      expect(mockPrisma.user.update).toHaveBeenCalled();
    });
  });

  describe('getUserStats', () => {
    it('should return user stats with session data', async () => {
      const mockUserStats = {
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        failedLoginAttempts: 2,
        lockedUntil: null,
        sessions: [
          { createdAt: new Date('2025-01-15T10:00:00.000Z') }
        ]
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUserStats);

      const result = await userService.getUserStats('user123');

      expect(result).toEqual({
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        lastLogin: new Date('2025-01-15T10:00:00.000Z'),
        failedLoginAttempts: 2,
        isLocked: false
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user123' },
        select: {
          createdAt: true,
          failedLoginAttempts: true,
          lockedUntil: true,
          sessions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true }
          }
        }
      });
    });

    it('should return stats without last login when no sessions', async () => {
      const mockUserStats = {
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        failedLoginAttempts: 0,
        lockedUntil: null,
        sessions: []
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUserStats);

      const result = await userService.getUserStats('user123');

      expect(result).toEqual({
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        lastLogin: null,
        failedLoginAttempts: 0,
        isLocked: false
      });
    });

    it('should indicate locked status correctly', async () => {
      const futureDate = new Date(Date.now() + 60000);
      const mockUserStats = {
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        failedLoginAttempts: 5,
        lockedUntil: futureDate,
        sessions: []
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUserStats);

      const result = await userService.getUserStats('user123');

      expect(result).toEqual({
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        lastLogin: null,
        failedLoginAttempts: 5,
        isLocked: true
      });
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.getUserStats('nonexistent');

      expect(result).toBeNull();
    });
  });
});