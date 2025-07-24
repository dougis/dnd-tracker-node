import { PrismaClient, User, Session } from '@prisma/client';
import { hash, verify } from 'argon2';
import { randomBytes } from 'crypto';

export interface AuthResult {
  user: Omit<User, 'passwordHash'>;
  session: Session;
}

export interface SessionValidationResult {
  user: Omit<User, 'passwordHash'>;
  session: Omit<Session, 'token'>;
}

export class AuthService {
  private prisma: PrismaClient;
  private readonly SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly MAX_LOGIN_ATTEMPTS = 5;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Register a new user with email, username, and password
   */
  async register(email: string, username: string, password: string): Promise<Omit<User, 'passwordHash'>> {
    // Validate input
    this.validateEmail(email);
    this.validateUsername(username);
    this.validatePassword(password);

    // Check if user already exists with this email
    const existingUserByEmail = await this.prisma.user.findUnique({
      where: { email }
    });

    if (existingUserByEmail) {
      throw new Error('User with this email already exists');
    }

    // Check if user already exists with this username
    const existingUserByUsername = await this.prisma.user.findUnique({
      where: { username }
    });

    if (existingUserByUsername) {
      throw new Error('User with this username already exists');
    }

    // Hash password with Argon2
    const passwordHash = await hash(password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null
      }
    });

    // Return user without password hash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<AuthResult> {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new Error('Account is locked');
    }

    // Verify password
    const isPasswordValid = await verify(user.passwordHash, password);

    if (!isPasswordValid) {
      // Increment failed login attempts
      const newFailedAttempts = user.failedLoginAttempts + 1;
      const shouldLock = newFailedAttempts >= this.MAX_LOGIN_ATTEMPTS;
      
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newFailedAttempts,
          ...(shouldLock && {
            lockedUntil: new Date(Date.now() + this.LOCKOUT_DURATION)
          })
        }
      });

      if (shouldLock) {
        throw new Error('Account locked due to too many failed attempts');
      }

      throw new Error('Invalid credentials');
    }

    // Reset failed login attempts on successful login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null
      }
    });

    // Create session
    const session = await this.createSession(user.id);

    // Return user without password hash and session
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      session
    };
  }

  /**
   * Validate an existing session
   */
  async validateSession(sessionToken: string): Promise<SessionValidationResult | null> {
    const session = await this.prisma.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: true
      }
    });

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      // Delete expired session
      await this.prisma.session.delete({
        where: { token: sessionToken }
      });
      return null;
    }

    // Return user without password hash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _userPasswordHash, ...userWithoutPassword } = session.user;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { token: _token, ...sessionWithoutToken } = session;
    return {
      user: userWithoutPassword,
      session: sessionWithoutToken
    };
  }

  /**
   * Logout user by deleting session
   */
  async logout(sessionToken: string): Promise<void> {
    await this.prisma.session.delete({
      where: { token: sessionToken }
    });
  }

  /**
   * Create a new session for a user
   */
  private async createSession(userId: string): Promise<Session> {
    const sessionId = this.generateSessionId();
    const token = this.generateSessionToken();
    const expiresAt = new Date(Date.now() + this.SESSION_DURATION);

    return await this.prisma.session.create({
      data: {
        id: sessionId,
        userId,
        token,
        expiresAt
      }
    });
  }

  /**
   * Generate a secure session ID
   */
  private generateSessionId(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Generate a secure session token
   */
  private generateSessionToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Validate email format
   */
  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
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
   * Validate password strength
   */
  validatePassword(password: string): void {
    if (!password || password.length < 8) {
      throw new Error('Password does not meet security requirements');
    }

    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
      throw new Error('Password does not meet security requirements');
    }

    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
      throw new Error('Password does not meet security requirements');
    }

    // Check for number
    if (!/\d/.test(password)) {
      throw new Error('Password does not meet security requirements');
    }

    // Check for special character
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      throw new Error('Password does not meet security requirements');
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    await this.prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
  }
}