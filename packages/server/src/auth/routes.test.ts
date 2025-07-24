import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Use vi.hoisted to ensure mocks are available during hoisting
const { mockRegister, mockLogin, mockLogout, mockValidateSession } = vi.hoisted(() => ({
  mockRegister: vi.fn(),
  mockLogin: vi.fn(),
  mockLogout: vi.fn(),
  mockValidateSession: vi.fn(),
}));

// Mock the entire services
vi.mock('../services/AuthService', () => ({
  AuthService: vi.fn().mockImplementation(() => ({
    register: mockRegister,
    login: mockLogin,
    logout: mockLogout,
    validateSession: mockValidateSession
  }))
}));

vi.mock('../services/UserService');
vi.mock('@prisma/client');

import { authRoutes } from './routes';

describe('Authentication Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
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
      
      mockRegister.mockResolvedValue(mockUser);

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
      expect(mockRegister).toHaveBeenCalledWith(
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
      expect(response.body.message).toContain('email');
    });

    it('should return 400 for missing username', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'SecurePassword123!' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('username');
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', username: 'testuser' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('password');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ 
          email: 'invalid-email', 
          username: 'testuser', 
          password: 'SecurePassword123!' 
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 409 for existing user', async () => {
      mockRegister.mockRejectedValue(new Error('User with this email already exists'));

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
          userId: 'user_123',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };
      
      mockLogin.mockResolvedValue(mockResult);

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
      expect(mockLogin).toHaveBeenCalledWith(
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
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for invalid credentials', async () => {
      mockLogin.mockRejectedValue(new Error('Invalid credentials'));

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return 423 for locked account', async () => {
      mockLogin.mockRejectedValue(new Error('Account is locked'));

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
      mockLogout.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', 'session_id=session_123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
      expect(mockLogout).toHaveBeenCalledWith('session_123');
    });

    it('should return 400 when no session cookie', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No session');
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
      
      mockValidateSession.mockResolvedValue(mockSessionData);

      // Act
      const response = await request(app)
        .get('/api/auth/session')
        .set('Cookie', 'session_id=session_123');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.id).toBe('user_123');
      expect(mockValidateSession).toHaveBeenCalledWith('session_123');
    });

    it('should return 401 for invalid session', async () => {
      mockValidateSession.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/auth/session')
        .set('Cookie', 'session_id=invalid_session');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid session');
    });

    it('should return 400 when no session cookie', async () => {
      const response = await request(app)
        .get('/api/auth/session');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No session');
    });
  });
});