import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock services
const mockAuthService = {
  register: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  validateSession: vi.fn()
};

const mockUserService = {
  getUserStats: vi.fn(),
  updateProfile: vi.fn()
};

// Mock rate limiting middleware
const mockRateLimit = vi.fn((req, res, next) => next());

vi.mock('../services/AuthService', () => ({
  AuthService: vi.fn(() => mockAuthService)
}));

vi.mock('../services/UserService', () => ({
  UserService: vi.fn(() => mockUserService)
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn()
}));

vi.mock('../middleware/rate-limiting', () => ({
  loginRateLimit: mockRateLimit,
  registerRateLimit: mockRateLimit,
  createTierBasedRateLimit: () => mockRateLimit
}));

vi.mock('./middleware', () => ({
  requireAuth: vi.fn((req, res, next) => {
    req.user = {
      id: 'user123',
      email: 'test@example.com',
      username: 'testuser',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    };
    next();
  })
}));

import { authRoutes } from '../routes';

describe('Auth Routes', () => {
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

  describe('POST /register', () => {
    const validRegisterData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'SecurePass123!'
    };

    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      };

      mockAuthService.register.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegisterData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: {
          user: {
            id: 'user123',
            email: 'test@example.com',
            username: 'testuser',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          }
        },
        message: 'User registered successfully'
      });

      expect(mockAuthService.register).toHaveBeenCalledWith(
        'test@example.com',
        'testuser',
        'SecurePass123!'
      );
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validRegisterData,
          email: 'invalid-email'
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: expect.any(Array)
      });
    });

    it('should return 400 for short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validRegisterData,
          password: 'short'
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: expect.any(Array)
      });
    });

    it('should return 400 for invalid username', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validRegisterData,
          username: 'a'
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: expect.any(Array)
      });
    });

    it('should return 409 for existing user', async () => {
      mockAuthService.register.mockRejectedValue(new Error('User already exists'));

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegisterData)
        .expect(409);

      expect(response.body).toEqual({
        success: false,
        message: 'User already exists'
      });
    });

    it('should return 400 for security requirements error', async () => {
      mockAuthService.register.mockRejectedValue(new Error('Password does not meet security requirements'));

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegisterData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Password does not meet security requirements'
      });
    });

    it('should return 500 for internal server error', async () => {
      mockAuthService.register.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegisterData)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Internal server error during registration'
      });
    });
  });

  describe('POST /login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'SecurePass123!'
    };

    it('should login user successfully', async () => {
      const mockLoginResult = {
        user: {
          id: 'user123',
          email: 'test@example.com',
          username: 'testuser',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        },
        session: {
          id: 'session123',
          token: 'session_token_123',
          expiresAt: new Date('2024-02-01')
        }
      };

      mockAuthService.login.mockResolvedValue(mockLoginResult);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          user: {
            id: 'user123',
            email: 'test@example.com',
            username: 'testuser',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          },
          sessionId: 'session123',
          expiresAt: '2024-02-01T00:00:00.000Z'
        },
        message: 'Login successful'
      });

      expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'SecurePass123!');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password'
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: expect.any(Array)
      });
    });

    it('should return 401 for invalid credentials', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Invalid credentials'
      });
    });

    it('should return 423 for locked account', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Account is locked'));

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(423);

      expect(response.body).toEqual({
        success: false,
        message: 'Account is locked'
      });
    });

    it('should return 500 for internal server error', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Internal server error during login'
      });
    });
  });

  describe('POST /logout', () => {
    it('should logout user successfully', async () => {
      mockAuthService.logout.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', 'session_id=session123')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Logged out successfully'
      });

      expect(mockAuthService.logout).toHaveBeenCalledWith('session123');
    });

    it('should return 400 when no session found', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'No session found'
      });
    });

    it('should return 500 for internal server error', async () => {
      mockAuthService.logout.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', 'session_id=session123')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Internal server error during logout'
      });
    });
  });

  describe('GET /session', () => {
    it('should return session info successfully', async () => {
      const mockSessionData = {
        user: {
          id: 'user123',
          email: 'test@example.com',
          username: 'testuser',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        },
        session: {
          id: 'session123',
          expiresAt: new Date('2024-02-01'),
          createdAt: new Date('2024-01-01')
        }
      };

      mockAuthService.validateSession.mockResolvedValue(mockSessionData);

      const response = await request(app)
        .get('/api/auth/session')
        .set('Cookie', 'session_id=session123')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          user: {
            id: 'user123',
            email: 'test@example.com',
            username: 'testuser',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          },
          session: {
            id: 'session123',
            expiresAt: '2024-02-01T00:00:00.000Z',
            createdAt: '2024-01-01T00:00:00.000Z'
          }
        }
      });
    });

    it('should return 400 when no session found', async () => {
      const response = await request(app)
        .get('/api/auth/session')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'No session found'
      });
    });

    it('should return 401 for invalid session', async () => {
      mockAuthService.validateSession.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/auth/session')
        .set('Cookie', 'session_id=invalid_session')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Invalid or expired session'
      });
    });

    it('should return 500 for internal server error', async () => {
      mockAuthService.validateSession.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/auth/session')
        .set('Cookie', 'session_id=session123')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Internal server error during session validation'
      });
    });
  });

  describe('GET /profile', () => {
    it('should return user profile successfully', async () => {
      const mockUserStats = {
        createdAt: new Date('2024-01-01'),
        lastLogin: new Date('2024-01-02'),
        failedLoginAttempts: 0,
        isLocked: false
      };

      mockUserService.getUserStats.mockResolvedValue(mockUserStats);

      const response = await request(app)
        .get('/api/auth/profile')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          user: {
            id: 'user123',
            email: 'test@example.com',
            username: 'testuser',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          },
          stats: {
            createdAt: '2024-01-01T00:00:00.000Z',
            lastLogin: '2024-01-02T00:00:00.000Z',
            failedLoginAttempts: 0,
            isLocked: false
          }
        }
      });

      expect(mockUserService.getUserStats).toHaveBeenCalledWith('user123');
    });

    it('should return profile with null stats', async () => {
      mockUserService.getUserStats.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/auth/profile')
        .expect(200);

      expect(response.body.data.stats).toBeNull();
    });

    it('should return 500 for internal server error', async () => {
      mockUserService.getUserStats.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/auth/profile')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Internal server error fetching profile'
      });
    });
  });

  describe('PUT /profile', () => {
    it('should update profile successfully', async () => {
      const mockUpdatedUser = {
        id: 'user123',
        email: 'test@example.com',
        username: 'newusername',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02')
      };

      mockUserService.updateProfile.mockResolvedValue(mockUpdatedUser);

      const response = await request(app)
        .put('/api/auth/profile')
        .send({ username: 'newusername' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          user: {
            id: 'user123',
            email: 'test@example.com',
            username: 'newusername',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-02T00:00:00.000Z'
          }
        },
        message: 'Profile updated successfully'
      });

      expect(mockUserService.updateProfile).toHaveBeenCalledWith('user123', { username: 'newusername' });
    });

    it('should return 400 for invalid username', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({ username: 'a' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: expect.any(Array)
      });
    });

    it('should return 400 for username already taken', async () => {
      mockUserService.updateProfile.mockRejectedValue(new Error('Username already taken'));

      const response = await request(app)
        .put('/api/auth/profile')
        .send({ username: 'taken' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Username already taken'
      });
    });

    it('should return 500 for internal server error', async () => {
      mockUserService.updateProfile.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/auth/profile')
        .send({ username: 'newusername' })
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Internal server error updating profile'
      });
    });
  });
});