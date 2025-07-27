import { describe, it, expect } from 'vitest';
import { API_ENDPOINTS, HTTP_STATUS } from './api.js';

describe('API Constants', () => {
  it('should have valid API endpoints', () => {
    expect(API_ENDPOINTS.AUTH.LOGIN).toBe('/api/auth/login');
    expect(API_ENDPOINTS.AUTH.LOGOUT).toBe('/api/auth/logout');
    expect(API_ENDPOINTS.USERS.BASE).toBe('/api/users');
    expect(API_ENDPOINTS.CHARACTERS.BASE).toBe('/api/characters');
  });

  it('should have valid HTTP status codes', () => {
    expect(HTTP_STATUS.OK).toBe(200);
    expect(HTTP_STATUS.CREATED).toBe(201);
    expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
    expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
    expect(HTTP_STATUS.NOT_FOUND).toBe(404);
    expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
  });

  it('should generate dynamic endpoints', () => {
    expect(API_ENDPOINTS.USERS.BY_ID('123')).toBe('/api/users/123');
    expect(API_ENDPOINTS.CHARACTERS.BY_ID('abc')).toBe('/api/characters/abc');
    expect(API_ENDPOINTS.ENCOUNTERS.BY_ID('xyz')).toBe('/api/encounters/xyz');
  });
});