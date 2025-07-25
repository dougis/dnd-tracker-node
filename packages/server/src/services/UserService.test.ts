import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { UserService } from './UserService';
import { 
  createMockUser,
  setupUserFindUnique,
  expectUserFindUniqueById,
  expectUserFindUniqueByEmail,
  expectUserFindUniqueByUsername,
  expectUserUpdate,
  expectPasswordHashExcluded,
  expectUserServiceResult,
  createExpectedUserResult,
  createLockedAccountScenario,
  createUnlockedAccountScenario,
  createExpiredLockScenario,
  createFailedAttemptsScenario,
  createUserStatsScenario,
  createUsernameValidationScenarios,
  getValidUsernames,
  setupProfileUpdateTest
} from '../test/user-test-utils';

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
      setupUserFindUnique(mockPrisma, mockUser);

      const result = await userService.getUserById('user_1');

      expectUserFindUniqueById(mockPrisma, 'user_1');
      expectUserServiceResult(result, createExpectedUserResult(mockUser));
      expectPasswordHashExcluded(result);
    });

    it('should return null for non-existent user', async () => {
      setupUserFindUnique(mockPrisma, null);

      const result = await userService.getUserById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should get user by email successfully and exclude password hash', async () => {
      const mockUser = createMockUser();
      setupUserFindUnique(mockPrisma, mockUser);

      const result = await userService.getUserByEmail('test@example.com');

      expectUserFindUniqueByEmail(mockPrisma, 'test@example.com');
      expectPasswordHashExcluded(result);
      expect(result?.email).toBe(mockUser.email);
    });

    it('should return null for non-existent email', async () => {
      setupUserFindUnique(mockPrisma, null);

      const result = await userService.getUserByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('getUserByUsername', () => {
    it('should get user by username successfully and exclude password hash', async () => {
      const mockUser = createMockUser();
      setupUserFindUnique(mockPrisma, mockUser);

      const result = await userService.getUserByUsername('testuser');

      expectUserFindUniqueByUsername(mockPrisma, 'testuser');
      expectPasswordHashExcluded(result);
      expect(result?.username).toBe(mockUser.username);
    });

    it('should return null for non-existent username', async () => {
      setupUserFindUnique(mockPrisma, null);

      const result = await userService.getUserByUsername('notfound');

      expect(result).toBeNull();
    });
  });

  describe('isAccountLocked', () => {
    it('should return true for locked account', async () => {
      const scenario = createLockedAccountScenario();
      setupUserFindUnique(mockPrisma, scenario.user);

      const result = await userService.isAccountLocked('user_1');

      expectUserFindUniqueById(mockPrisma, 'user_1', { lockedUntil: true });
      expect(result).toBe(scenario.expectedResult);
    });

    it('should return false for unlocked account', async () => {
      const scenario = createUnlockedAccountScenario();
      setupUserFindUnique(mockPrisma, scenario.user);

      const result = await userService.isAccountLocked('user_1');

      expect(result).toBe(scenario.expectedResult);
    });

    it('should return false for expired lock', async () => {
      const scenario = createExpiredLockScenario();
      setupUserFindUnique(mockPrisma, scenario.user);

      const result = await userService.isAccountLocked('user_1');

      expect(result).toBe(scenario.expectedResult);
    });

    it('should return false for non-existent user', async () => {
      setupUserFindUnique(mockPrisma, null);

      const result = await userService.isAccountLocked('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('getFailedLoginAttempts', () => {
    it('should return failed login attempts count', async () => {
      const scenario = createFailedAttemptsScenario(3);
      setupUserFindUnique(mockPrisma, scenario.user);

      const result = await userService.getFailedLoginAttempts('user_1');

      expectUserFindUniqueById(mockPrisma, 'user_1', { failedLoginAttempts: true });
      expect(result).toBe(scenario.expectedResult);
    });

    it('should return 0 for non-existent user', async () => {
      setupUserFindUnique(mockPrisma, null);

      const result = await userService.getFailedLoginAttempts('nonexistent');

      expect(result).toBe(0);
    });
  });

  describe('unlockAccount', () => {
    it('should unlock account successfully', async () => {
      mockPrisma.user.update.mockResolvedValue({});

      await userService.unlockAccount('user_1');

      expectUserUpdate(mockPrisma, 'user_1', {
        failedLoginAttempts: 0,
        lockedUntil: null
      });
    });
  });

  describe('updateProfile', () => {
    it('should update username successfully', async () => {
      const updatedUser = createMockUser({ username: 'newusername' });
      setupProfileUpdateTest(mockPrisma, null, updatedUser);

      const result = await userService.updateProfile('user_1', { username: 'newusername' });

      expectUserFindUniqueByUsername(mockPrisma, 'newusername');
      expectUserUpdate(mockPrisma, 'user_1', { username: 'newusername' });
      expectPasswordHashExcluded(result);
      expect(result.username).toBe('newusername');
    });

    it('should throw error for username already taken by another user', async () => {
      const existingUser = createMockUser({ id: 'other_user', username: 'taken' });
      setupUserFindUnique(mockPrisma, existingUser);

      const scenarios = createUsernameValidationScenarios();
      await expect(userService.updateProfile('user_1', { username: 'taken' }))
        .rejects.toThrow(scenarios.usernameTaken.expectedError);
    });

    it('should allow updating to same username', async () => {
      const currentUser = createMockUser({ id: 'user_1', username: 'currentname' });
      const updatedUser = createMockUser({ id: 'user_1', username: 'currentname' });
      setupProfileUpdateTest(mockPrisma, currentUser, updatedUser);

      const result = await userService.updateProfile('user_1', { username: 'currentname' });

      expect(result.username).toBe('currentname');
    });

    it('should validate username length - too short', async () => {
      const scenarios = createUsernameValidationScenarios();
      await expect(userService.updateProfile('user_1', { username: scenarios.tooShort.username }))
        .rejects.toThrow(scenarios.tooShort.expectedError);
    });

    it('should validate username length - too long', async () => {
      const scenarios = createUsernameValidationScenarios();
      await expect(userService.updateProfile('user_1', { username: scenarios.tooLong.username }))
        .rejects.toThrow(scenarios.tooLong.expectedError);
    });

    it('should validate username format - invalid characters', async () => {
      const scenarios = createUsernameValidationScenarios();
      await expect(userService.updateProfile('user_1', { username: scenarios.invalidChars.username }))
        .rejects.toThrow(scenarios.invalidChars.expectedError);
    });

    it('should accept valid username formats', async () => {
      const validUsernames = getValidUsernames();
      
      for (const username of validUsernames) {
        const updatedUser = createMockUser({ username });
        setupProfileUpdateTest(mockPrisma, null, updatedUser);

        const result = await userService.updateProfile('user_1', { username });
        expect(result.username).toBe(username);
      }
    });
  });

  describe('getUserStats', () => {
    it('should return user stats successfully', async () => {
      const scenario = createUserStatsScenario({
        failedLoginAttempts: 2,
        sessions: [{ createdAt: new Date('2024-01-15') }]
      });
      setupUserFindUnique(mockPrisma, scenario.userData);

      const result = await userService.getUserStats('user_1');

      expectUserFindUniqueById(mockPrisma, 'user_1', {
        createdAt: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true }
        }
      });

      expectUserServiceResult(result, scenario.expectedStats);
    });

    it('should return stats with no last login if no sessions', async () => {
      const scenario = createUserStatsScenario({ sessions: [] });
      setupUserFindUnique(mockPrisma, scenario.userData);

      const result = await userService.getUserStats('user_1');

      expect(result?.lastLogin).toBeNull();
    });

    it('should return stats with locked status true for locked account', async () => {
      const scenario = createUserStatsScenario({
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 60000),
        sessions: []
      });
      setupUserFindUnique(mockPrisma, scenario.userData);

      const result = await userService.getUserStats('user_1');

      expect(result?.isLocked).toBe(true);
    });

    it('should return null for non-existent user', async () => {
      setupUserFindUnique(mockPrisma, null);

      const result = await userService.getUserStats('nonexistent');

      expect(result).toBeNull();
    });
  });
});