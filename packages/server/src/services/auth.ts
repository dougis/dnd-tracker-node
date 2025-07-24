import { PrismaClient, User } from '@prisma/client';
import * as argon2 from 'argon2';
import { Lucia } from 'lucia';
import { PrismaAdapter } from '@lucia-auth/adapter-prisma';

export interface AuthenticationResult {
  id: string;
  email: string;
  username: string;
  isEmailVerified: boolean;
  isAdmin: boolean;
  lastLoginAt: Date | null;
}

export interface DatabaseUserAttributes {
  email: string;
  username: string;
  isEmailVerified: boolean;
  isAdmin: boolean;
}

export interface SessionData {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  fresh?: boolean;
}

export interface ValidationResult {
  session: SessionData | null;
  user: AuthenticationResult | null;
}

export class AuthService {
  public lucia: Lucia;

  constructor(private prisma: PrismaClient) {
    const adapter = new PrismaAdapter(prisma.session, prisma.user);
    
    this.lucia = new Lucia(adapter, {
      sessionCookie: {
        attributes: {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          httpOnly: true,
        },
      },
      getUserAttributes: (attributes: DatabaseUserAttributes) => {
        return {
          email: attributes.email,
          username: attributes.username,
          isEmailVerified: attributes.isEmailVerified,
          isAdmin: attributes.isAdmin,
        };
      },
    });
  }

  async registerUser(email: string, username: string, password: string): Promise<AuthenticationResult> {
    try {
      const passwordHash = await argon2.hash(password);

      const user = await this.prisma.user.create({
        data: {
          email,
          username,
          passwordHash,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });

      return this.sanitizeUser(user);
    } catch (error: unknown) {
      if (error instanceof Error && (error.message?.includes('Unique constraint') || (error as { code?: string }).code === 'P2002')) {
        throw new Error('User with this email or username already exists');
      }
      throw error;
    }
  }

  async authenticateUser(email: string, password: string): Promise<AuthenticationResult> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if account is locked
    if (this.isAccountLocked(user)) {
      throw new Error('Account is locked. Please try again later.');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, password);

    if (!isPasswordValid) {
      // Increment failed login attempts
      const newFailedAttempts = user.failedLoginAttempts + 1;
      const updateData: { failedLoginAttempts: number; lockedUntil?: Date } = {
        failedLoginAttempts: newFailedAttempts,
      };

      // Lock account after 5 failed attempts
      if (newFailedAttempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      throw new Error('Invalid email or password');
    }

    // Reset failed login attempts and lockout on successful login
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    return this.sanitizeUser(updatedUser);
  }

  isAccountLocked(user: User): boolean {
    if (!user.lockedUntil) {
      return false;
    }
    return user.lockedUntil > new Date();
  }

  async createSession(userId: string, ipAddress?: string, userAgent?: string): Promise<SessionData> {
    const session = await this.lucia.createSession(userId, {
      ipAddress,
      userAgent,
    });

    return {
      id: session.id,
      token: session.id,
      userId: session.userId,
      expiresAt: session.expiresAt,
      ipAddress,
      userAgent,
      fresh: true,
    };
  }

  async validateSession(sessionToken: string): Promise<ValidationResult> {
    try {
      const result = await this.lucia.validateSession(sessionToken);
      
      if (!result.session || !result.user) {
        return { session: null, user: null };
      }

      return {
        session: {
          id: result.session.id,
          token: result.session.id,
          userId: result.session.userId,
          expiresAt: result.session.expiresAt,
          fresh: result.session.fresh,
        },
        user: result.user as AuthenticationResult,
      };
    } catch (error) {
      return { session: null, user: null };
    }
  }

  async invalidateSession(sessionId: string): Promise<void> {
    await this.lucia.invalidateSession(sessionId);
  }

  private sanitizeUser(user: User): AuthenticationResult {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      isEmailVerified: user.isEmailVerified,
      isAdmin: user.isAdmin,
      lastLoginAt: user.lastLoginAt,
    };
  }
}

// Extend Express Request interface for TypeScript
declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticationResult;
    session?: SessionData;
  }
}