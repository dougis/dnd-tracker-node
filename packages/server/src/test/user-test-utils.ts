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