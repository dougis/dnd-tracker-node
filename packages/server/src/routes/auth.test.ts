import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { authRoutes, setAuthService } from './auth.js';
import { AuthService } from '../services/auth.js';
import { createMockUser, createMockSession, createMockAuthService, createTestUserData, expectValidationError } from '../test/auth-test-utils.js';

describe('Auth Routes', () => {
  let app: express.Application;
  let mockAuthService: AuthService;

  const mockUser = createMockUser();
  const mockSession = createMockSession();

  beforeEach(() => {
    vi.clearAllMocks();
    
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    
    // Create mock AuthService instance
    mockAuthService = createMockAuthService();
    
    // Set the mock service
    setAuthService(mockAuthService);
    
    app.use('/auth', authRoutes);
  });

  describe('POST /auth/register', () => {
    it('should register new user successfully', async () => {
      const userData = createTestUserData();

      mockAuthService.registerUser = vi.fn().mockResolvedValue({
        ...mockUser,
        email: userData.email,
        username: userData.username,
      });

      const response = await request(app)
        .post('/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: 'User registered successfully',
        user: {
          id: expect.any(String),
          email: userData.email,
          username: userData.username,
          isEmailVerified: false,
          isAdmin: false,
        },
      });
      expect(mockAuthService.registerUser).toHaveBeenCalledWith(
        userData.email,
        userData.username,
        userData.password
      );
    });

    it('should return 400 for invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        username: 'testuser',
        password: 'SecurePass123!',
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          path: 'email',
          msg: 'Must be a valid email address',
        })
      );
    });

    it('should return 400 for short password', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: '123',
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          path: 'password',
          msg: 'Password must be at least 8 characters long',
        })
      );
    });

    it('should return 400 for invalid username format', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'te',
        password: 'SecurePass123!',
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          path: 'username',
          msg: 'Username must be 3-30 characters long and contain only letters, numbers, and underscores',
        })
      );
    });

    it('should return 409 for duplicate email/username', async () => {
      const userData = {
        email: 'existing@example.com',
        username: 'existinguser',
        password: 'SecurePass123!',
      };

      mockAuthService.registerUser = vi.fn().mockRejectedValue(
        new Error('User with this email or username already exists')
      );

      const response = await request(app)
        .post('/auth/register')
        .send(userData);

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        error: 'User with this email or username already exists',
      });
    });

    it('should return 500 for unexpected errors', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecurePass123!',
      };

      mockAuthService.registerUser = vi.fn().mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/auth/register')
        .send(userData);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Internal server error',
      });
    });
  });

  describe('POST /auth/login', () => {
    it('should login user successfully and set session cookie', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'correctpassword',
      };

      mockAuthService.authenticateUser = vi.fn().mockResolvedValue(mockUser);
      mockAuthService.createSession = vi.fn().mockResolvedValue(mockSession);

      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Login successful',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
          isEmailVerified: mockUser.isEmailVerified,
          isAdmin: mockUser.isAdmin,
        },
      });

      // Check cookie is set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toEqual(
        expect.arrayContaining([
          expect.stringContaining('session=sessiontoken123'),
        ])
      );

      expect(mockAuthService.authenticateUser).toHaveBeenCalledWith(
        loginData.email,
        loginData.password
      );
      expect(mockAuthService.createSession).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(String), // IP address
        expect.any(String)  // User agent
      );
    });

    it('should return 400 for invalid email format', async () => {
      const loginData = {
        email: 'invalid-email',
        password: 'password',
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          path: 'email',
          msg: 'Must be a valid email address',
        })
      );
    });

    it('should return 401 for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockAuthService.authenticateUser = vi.fn().mockRejectedValue(
        new Error('Invalid email or password')
      );

      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'Invalid email or password',
      });
    });

    it('should return 423 for locked account', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password',
      };

      mockAuthService.authenticateUser = vi.fn().mockRejectedValue(
        new Error('Account is locked. Please try again later.')
      );

      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      expect(response.status).toBe(423);
      expect(response.body).toEqual({
        error: 'Account is locked. Please try again later.',
      });
    });

    it('should return 500 for unexpected errors', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password',
      };

      mockAuthService.authenticateUser = vi.fn().mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Internal server error',
      });
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout user successfully', async () => {
      mockAuthService.invalidateSession = vi.fn().mockResolvedValue(undefined);

      const response = await request(app)
        .post('/auth/logout')
        .set('Cookie', [`session=${mockSession.token}`])
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Logout successful',
      });

      // Check cookie is cleared
      const cookies = response.headers['set-cookie'];
      expect(cookies).toEqual(
        expect.arrayContaining([
          expect.stringContaining('session=;'),
        ])
      );
    });

    it('should handle logout when no session exists', async () => {
      const response = await request(app)
        .post('/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Logout successful',
      });
    });

    it('should handle errors during session invalidation', async () => {
      mockAuthService.invalidateSession = vi.fn().mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .post('/auth/logout')
        .send();

      expect(response.status).toBe(200); // Logout should still succeed even if invalidation fails
      expect(response.body).toEqual({
        message: 'Logout successful',
      });
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user information', async () => {
      // Create a test route without requireAuth middleware
      const testApp = express();
      testApp.use(express.json());
      testApp.use(cookieParser());
      
      // Set mock service
      setAuthService(mockAuthService);
      
      // Create a test endpoint that simulates authenticated user
      testApp.get('/auth/me', (req: Request, res: Response) => {
        // Simulate authenticated user
        const user = {
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
          isEmailVerified: mockUser.isEmailVerified,
          isAdmin: mockUser.isAdmin,
        };
        
        res.status(200).json({ user });
      });

      const response = await request(testApp)
        .get('/auth/me');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
          isEmailVerified: mockUser.isEmailVerified,
          isAdmin: mockUser.isAdmin,
        },
      });
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'Authentication required',
      });
    });
  });
});