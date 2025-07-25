import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { UserService } from './UserService';
import { createMockUser } from '../test/user-test-utils';

// Get mocked Prisma instance
const mockPrisma = new PrismaClient() as any;

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    userService = new UserService(mockPrisma);
  });

  describe('getUserById', () => {
    it('should get user by id successfully and exclude password hash', async () => {
      const mockUser = createMockUser();
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.getUserById('user_1');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user_1' }
      });
      
      // Should exclude passwordHash
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        isEmailVerified: mockUser.isEmailVerified,
        isAdmin: mockUser.isAdmin,
        failedLoginAttempts: mockUser.failedLoginAttempts,
        lockedUntil: mockUser.lockedUntil,
        lastLoginAt: mockUser.lastLoginAt,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt
      });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should return null for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.getUserById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should get user by email successfully and exclude password hash', async () => {
      const mockUser = createMockUser();
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.getUserByEmail('test@example.com');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
      
      // Should exclude passwordHash
      expect(result).not.toHaveProperty('passwordHash');
      expect(result?.email).toBe(mockUser.email);
    });

    it('should return null for non-existent email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.getUserByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('getUserByUsername', () => {
    it('should get user by username successfully and exclude password hash', async () => {
      const mockUser = createMockUser();
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.getUserByUsername('testuser');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' }
      });
      
      // Should exclude passwordHash
      expect(result).not.toHaveProperty('passwordHash');
      expect(result?.username).toBe(mockUser.username);
    });

    it('should return null for non-existent username', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.getUserByUsername('notfound');

      expect(result).toBeNull();
    });
  });

  describe('isAccountLocked', () => {
    it('should return true for locked account', async () => {
      const lockedUser = createMockUser({
        lockedUntil: new Date(Date.now() + 60000) // 1 minute in future
      });
      mockPrisma.user.findUnique.mockResolvedValue(lockedUser);

      const result = await userService.isAccountLocked('user_1');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user_1' },
        select: { lockedUntil: true }
      });
      expect(result).toBe(true);
    });

    it('should return false for unlocked account', async () => {
      const unlockedUser = createMockUser({
        lockedUntil: null
      });
      mockPrisma.user.findUnique.mockResolvedValue(unlockedUser);

      const result = await userService.isAccountLocked('user_1');

      expect(result).toBe(false);
    });

    it('should return false for expired lock', async () => {
      const expiredLockUser = createMockUser({
        lockedUntil: new Date(Date.now() - 60000) // 1 minute in past
      });
      mockPrisma.user.findUnique.mockResolvedValue(expiredLockUser);

      const result = await userService.isAccountLocked('user_1');

      expect(result).toBe(false);
    });

    it('should return false for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.isAccountLocked('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('getFailedLoginAttempts', () => {
    it('should return failed login attempts count', async () => {
      const userWithFailedAttempts = createMockUser({
        failedLoginAttempts: 3
      });
      mockPrisma.user.findUnique.mockResolvedValue(userWithFailedAttempts);

      const result = await userService.getFailedLoginAttempts('user_1');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user_1' },
        select: { failedLoginAttempts: true }
      });
      expect(result).toBe(3);
    });

    it('should return 0 for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.getFailedLoginAttempts('nonexistent');

      expect(result).toBe(0);
    });
  });

  describe('unlockAccount', () => {
    it('should unlock account successfully', async () => {
      mockPrisma.user.update.mockResolvedValue({});

      await userService.unlockAccount('user_1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user_1' },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null
        }
      });
    });
  });

  describe('updateProfile', () => {
    it('should update username successfully', async () => {
      const updatedUser = createMockUser({ username: 'newusername' });
      mockPrisma.user.findUnique.mockResolvedValue(null); // No existing user with new username
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await userService.updateProfile('user_1', { username: 'newusername' });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'newusername' }
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user_1' },
        data: { username: 'newusername' }
      });
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.username).toBe('newusername');
    });

    it('should throw error for username already taken by another user', async () => {
      const existingUser = createMockUser({ id: 'other_user', username: 'taken' });
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);

      await expect(userService.updateProfile('user_1', { username: 'taken' }))
        .rejects.toThrow('Username is already taken');
    });

    it('should allow updating to same username', async () => {
      const currentUser = createMockUser({ id: 'user_1', username: 'currentname' });
      const updatedUser = createMockUser({ id: 'user_1', username: 'currentname' });
      
      mockPrisma.user.findUnique.mockResolvedValue(currentUser);
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await userService.updateProfile('user_1', { username: 'currentname' });

      expect(result.username).toBe('currentname');
    });

    it('should validate username length - too short', async () => {
      await expect(userService.updateProfile('user_1', { username: 'ab' }))
        .rejects.toThrow('Username must be between 3 and 30 characters');
    });

    it('should validate username length - too long', async () => {
      const longUsername = 'a'.repeat(31);
      await expect(userService.updateProfile('user_1', { username: longUsername }))
        .rejects.toThrow('Username must be between 3 and 30 characters');
    });

    it('should validate username format - invalid characters', async () => {
      await expect(userService.updateProfile('user_1', { username: 'user@name' }))
        .rejects.toThrow('Username can only contain letters, numbers, underscores, and hyphens');
    });

    it('should accept valid username formats', async () => {
      const validUsernames = ['user123', 'user_name', 'user-name', 'User123'];
      
      for (const username of validUsernames) {
        const updatedUser = createMockUser({ username });
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.update.mockResolvedValue(updatedUser);

        const result = await userService.updateProfile('user_1', { username });
        expect(result.username).toBe(username);
      }
    });
  });

  describe('getUserStats', () => {
    it('should return user stats successfully', async () => {
      const mockUser = {
        createdAt: new Date('2024-01-01'),
        failedLoginAttempts: 2,
        lockedUntil: null,
        sessions: [{ createdAt: new Date('2024-01-15') }]
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.getUserStats('user_1');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user_1' },
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

      expect(result).toEqual({
        createdAt: mockUser.createdAt,
        lastLogin: mockUser.sessions[0]?.createdAt,
        failedLoginAttempts: 2,
        isLocked: false
      });
    });

    it('should return stats with no last login if no sessions', async () => {
      const mockUser = {
        createdAt: new Date('2024-01-01'),
        failedLoginAttempts: 0,
        lockedUntil: null,
        sessions: []
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.getUserStats('user_1');

      expect(result?.lastLogin).toBeNull();
    });

    it('should return stats with locked status true for locked account', async () => {
      const mockUser = {
        createdAt: new Date('2024-01-01'),
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 60000), // Future date
        sessions: []
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.getUserStats('user_1');

      expect(result?.isLocked).toBe(true);
    });

    it('should return null for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.getUserStats('nonexistent');

      expect(result).toBeNull();
    });
  });
});