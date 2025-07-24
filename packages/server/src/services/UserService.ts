import { PrismaClient, User } from '@prisma/client';

export class UserService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get user by ID without password hash
   */
  async getUserById(id: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get user by email without password hash
   */
  async getUserByEmail(email: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get user by username without password hash
   */
  async getUserByUsername(username: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Check if account is locked
   */
  async isAccountLocked(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { lockedUntil: true }
    });

    if (!user) {
      return false;
    }

    return user.lockedUntil !== null && user.lockedUntil > new Date();
  }

  /**
   * Get failed login attempts count
   */
  async getFailedLoginAttempts(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true }
    });

    return user?.failedLoginAttempts || 0;
  }

  /**
   * Manually unlock an account (admin function)
   */
  async unlockAccount(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null
      }
    });
  }

  /**
   * Update user profile (non-sensitive fields only)
   */
  async updateProfile(userId: string, data: { username?: string }): Promise<Omit<User, 'passwordHash'>> {
    // Validate username if provided
    if (data.username) {
      this.validateUsername(data.username);
      
      // Check if username is already taken by another user
      const existingUser = await this.prisma.user.findUnique({
        where: { username: data.username }
      });

      if (existingUser && existingUser.id !== userId) {
        throw new Error('Username is already taken');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Validate username format
   */
  private validateUsername(username: string): void {
    if (!username || username.length < 3 || username.length > 30) {
      throw new Error('Username must be between 3 and 30 characters');
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      throw new Error('Username can only contain letters, numbers, underscores, and hyphens');
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<{
    createdAt: Date;
    lastLogin: Date | null;
    failedLoginAttempts: number;
    isLocked: boolean;
  } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      return null;
    }

    return {
      createdAt: user.createdAt,
      lastLogin: user.sessions[0]?.createdAt || null,
      failedLoginAttempts: user.failedLoginAttempts,
      isLocked: user.lockedUntil !== null && user.lockedUntil > new Date()
    };
  }
}