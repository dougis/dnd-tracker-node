import { User } from '@prisma/client';

export type MockUser = User;

// Mock data factory for users
export const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  id: 'user_1',
  email: 'test@example.com',
  username: 'testuser',
  passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$randomsalt',
  isEmailVerified: false,
  isAdmin: false,
  failedLoginAttempts: 0,
  lockedUntil: null,
  lastLoginAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

// Helper for mocking Prisma user operations
export const mockPrismaUserCreate = (mockPrisma: any, result: MockUser) => {
  mockPrisma.user.create.mockResolvedValue(result);
};

export const mockPrismaUserFindUnique = (mockPrisma: any, result: MockUser | null) => {
  mockPrisma.user.findUnique.mockResolvedValue(result);
};

export const mockPrismaUserUpdate = (mockPrisma: any, result: MockUser) => {
  mockPrisma.user.update.mockResolvedValue(result);
};

export const mockPrismaUserDelete = (mockPrisma: any) => {
  mockPrisma.user.delete.mockResolvedValue({});
};


// Common user include pattern for Prisma queries
export const userIncludePattern = {
  sessions: true,
};

// User registration data helper
export const createUserRegistrationData = (overrides: any = {}) => ({
  email: 'test@example.com',
  username: 'testuser',
  password: 'SecurePassword123!',
  ...overrides,
});

// User profile update data helper
export const createUserProfileUpdateData = (overrides: any = {}) => ({
  username: 'updateduser',
  email: 'updated@example.com',
  ...overrides,
});

// Helper for password hashing mock
export const mockArgon2Hash = 'hashed_password_value';
export const mockArgon2Verify = true;

// Helper for setting up common Prisma user findUnique calls
export const setupUserFindUnique = (mockPrisma: any, result: MockUser | null, whereClause?: any, selectClause?: any) => {
  const call = {
    where: whereClause || expect.any(Object),
  };
  
  if (selectClause) {
    call.select = selectClause;
  }
  
  mockPrisma.user.findUnique.mockResolvedValue(result);
};

// Helper for expected findUnique calls with ID
export const expectUserFindUniqueById = (mockPrisma: any, userId: string, selectClause?: any) => {
  const expectedCall = {
    where: { id: userId }
  };
  
  if (selectClause) {
    expectedCall.select = selectClause;
  }
  
  expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(expectedCall);
};

// Helper for expected findUnique calls with email
export const expectUserFindUniqueByEmail = (mockPrisma: any, email: string) => {
  expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
    where: { email }
  });
};

// Helper for expected findUnique calls with username
export const expectUserFindUniqueByUsername = (mockPrisma: any, username: string) => {
  expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
    where: { username }
  });
};

// Helper for expected update calls
export const expectUserUpdate = (mockPrisma: any, userId: string, updateData: any) => {
  expect(mockPrisma.user.update).toHaveBeenCalledWith({
    where: { id: userId },
    data: updateData
  });
};

// Helper for password hash exclusion expectations
export const expectPasswordHashExcluded = (result: any) => {
  expect(result).not.toHaveProperty('passwordHash');
};

// Helper for user service result expectations
export const expectUserServiceResult = (actualResult: any, expectedResult: any) => {
  expect(actualResult).toEqual(expectedResult);
};

// Helper for creating expected user result without password hash
export const createExpectedUserResult = (mockUser: MockUser) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...expectedResult } = mockUser;
  return expectedResult;
};

// Helper for account lock scenarios
export const createLockedAccountScenario = (minutesInFuture = 1) => ({
  user: createMockUser({
    lockedUntil: new Date(Date.now() + (minutesInFuture * 60000))
  }),
  expectedResult: true
});

export const createUnlockedAccountScenario = () => ({
  user: createMockUser({ lockedUntil: null }),
  expectedResult: false
});

export const createExpiredLockScenario = (minutesInPast = 1) => ({
  user: createMockUser({
    lockedUntil: new Date(Date.now() - (minutesInPast * 60000))
  }),
  expectedResult: false
});

// Helper for failed login attempts scenarios
export const createFailedAttemptsScenario = (attempts: number) => ({
  user: createMockUser({ failedLoginAttempts: attempts }),
  expectedResult: attempts
});

// Helper for user stats scenarios
export const createUserStatsScenario = (overrides: any = {}) => {
  const defaultStats = {
    createdAt: new Date('2024-01-01'),
    failedLoginAttempts: 0,
    lockedUntil: null,
    sessions: []
  };
  
  return {
    userData: { ...defaultStats, ...overrides },
    expectedStats: {
      createdAt: overrides.createdAt || defaultStats.createdAt,
      lastLogin: overrides.sessions?.[0]?.createdAt || null,
      failedLoginAttempts: overrides.failedLoginAttempts || 0,
      isLocked: overrides.lockedUntil ? new Date(overrides.lockedUntil) > new Date() : false
    }
  };
};

// Helper for username validation scenarios
export const createUsernameValidationScenarios = () => ({
  tooShort: { username: 'ab', expectedError: 'Username must be between 3 and 30 characters' },
  tooLong: { username: 'a'.repeat(31), expectedError: 'Username must be between 3 and 30 characters' },
  invalidChars: { username: 'user@name', expectedError: 'Username can only contain letters, numbers, underscores, and hyphens' },
  usernameTaken: { username: 'taken', expectedError: 'Username is already taken' },
});

// Helper for valid username test data
export const getValidUsernames = () => ['user123', 'user_name', 'user-name', 'User123'];

// Helper for setup profile update test
export const setupProfileUpdateTest = (mockPrisma: any, findUniqueResult: MockUser | null, updateResult: MockUser) => {
  mockPrisma.user.findUnique.mockResolvedValue(findUniqueResult);
  mockPrisma.user.update.mockResolvedValue(updateResult);
};