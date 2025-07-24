import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Create mock service instances using vi.hoisted to avoid hoisting issues
const { authServiceMock, userServiceMock } = vi.hoisted(() => ({
  authServiceMock: {
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    validateSession: vi.fn()
  },
  userServiceMock: {
    getUserStats: vi.fn(),
    updateProfile: vi.fn()
  }
}));

// Mock the services at module level
vi.mock('../services/AuthService', () => ({
  AuthService: class MockAuthService {
    constructor() {
      return authServiceMock;
    }
  }
}));

vi.mock('../services/UserService', () => ({
  UserService: class MockUserService {
    constructor() {
      return userServiceMock;
    }
  }
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn()
}));

// Mock rate limiting middleware
vi.mock('../middleware/rate-limiting', () => ({
  loginRateLimit: vi.fn((req: any, res: any, next: any) => next()),
  registerRateLimit: vi.fn((req: any, res: any, next: any) => next()),
  createTierBasedRateLimit: vi.fn(() => (req: any, res: any, next: any) => next()),
}));

// Mock auth middleware
vi.mock('./middleware', () => ({
  requireAuth: vi.fn((req: any, res: any, next: any) => {
    req.user = {
      id: 'user_123',
      email: 'test@example.com',
      username: 'testuser',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    next();
  })
}));

import { authRoutes } from './routes';

describe('Authentication Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /api/auth/register', () => {
    const validRegistrationData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'SecurePassword123!'
    };

    it('should register user successfully', async () => {
      // Arrange
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      authServiceMock.register.mockResolvedValue(mockUser);

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: {
          user: {
            id: mockUser.id,
            email: mockUser.email,
            username: mockUser.username,
            createdAt: mockUser.createdAt.toISOString(),
            updatedAt: mockUser.updatedAt.toISOString()
          }
        },
        message: 'User registered successfully'
      });
      expect(authServiceMock.register).toHaveBeenCalledWith(
        validRegistrationData.email,
        validRegistrationData.username,
        validRegistrationData.password
      );
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: 'SecurePassword123!' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 400 for missing username', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'SecurePassword123!' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', username: 'testuser' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'invalid-email', username: 'testuser', password: 'SecurePassword123!' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 409 for existing user', async () => {
      authServiceMock.register.mockRejectedValue(new Error('User with this email already exists'));

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'SecurePassword123!'
    };

    it('should login user successfully', async () => {
      // Arrange
      const mockResult = {
        user: {
          id: 'user_123',
          email: 'test@example.com',
          username: 'testuser',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        session: {
          id: 'session_123',
          token: 'session_token_123',
          userId: 'user_123',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };
      
      authServiceMock.login.mockResolvedValue(mockResult);

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.sessionId).toBe(mockResult.session.id);
      expect(response.headers['set-cookie']).toBeDefined();
      expect(authServiceMock.login).toHaveBeenCalledWith(
        validLoginData.email,
        validLoginData.password
      );
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'SecurePassword123!' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 401 for invalid credentials', async () => {
      authServiceMock.login.mockRejectedValue(new Error('Invalid credentials'));

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 423 for locked account', async () => {
      authServiceMock.login.mockRejectedValue(new Error('Account is locked due to too many failed login attempts'));

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(423);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('locked');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      authServiceMock.logout.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', 'session_id=session_123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
      expect(authServiceMock.logout).toHaveBeenCalledWith('session_123');
    });

    it('should return 400 when no session cookie', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No session found');
    });
  });

  describe('GET /api/auth/session', () => {
    it('should return current session info', async () => {
      // Arrange
      const mockSessionData = {
        session: {
          id: 'session_123',
          userId: 'user_123',
          expiresAt: new Date(Date.now() + 60000),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        user: {
          id: 'user_123',
          email: 'test@example.com',
          username: 'testuser',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };
      
      authServiceMock.validateSession.mockResolvedValue(mockSessionData);

      // Act
      const response = await request(app)
        .get('/api/auth/session')
        .set('Cookie', 'session_id=session_123');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.session).toBeDefined();
      expect(authServiceMock.validateSession).toHaveBeenCalledWith('session_123');
    });

    it('should return 401 for invalid session', async () => {
      authServiceMock.validateSession.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/auth/session')
        .set('Cookie', 'session_id=invalid_session');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired session');
    });

    it('should return 400 when no session cookie', async () => {
      const response = await request(app)
        .get('/api/auth/session');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No session found');
    });
  });
});