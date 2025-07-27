import { describe, it, expect } from 'vitest';
import { 
  API_ENDPOINTS, 
  CURRENT_API_ENDPOINTS,
  LEGACY_API_ENDPOINTS,
  HTTP_STATUS, 
  API_VERSION,
  API_VERSION_HEADER,
  API_VERSION_RESPONSE_HEADER
} from './api.js';

describe('API Constants', () => {
  describe('HTTP Status Codes', () => {
    it('should have valid HTTP status codes', () => {
      expect(HTTP_STATUS.OK).toBe(200);
      expect(HTTP_STATUS.CREATED).toBe(201);
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
      expect(HTTP_STATUS.NOT_FOUND).toBe(404);
      expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
    });
  });

  describe('API Versioning', () => {
    it('should have valid API version constants', () => {
      expect(API_VERSION.V1).toBe('v1');
      expect(API_VERSION.CURRENT).toBe('v1');
      expect(API_VERSION.DEFAULT).toBe('v1');
      expect(API_VERSION.SUPPORTED).toContain('v1');
    });

    it('should have correct version headers', () => {
      expect(API_VERSION_HEADER).toBe('API-Version');
      expect(API_VERSION_RESPONSE_HEADER).toBe('api-version');
    });
  });

  describe('Versioned API Endpoints', () => {
    it('should have valid v1 API endpoints', () => {
      expect(API_ENDPOINTS.V1.AUTH.LOGIN).toBe('/api/v1/auth/login');
      expect(API_ENDPOINTS.V1.AUTH.LOGOUT).toBe('/api/v1/auth/logout');
      expect(API_ENDPOINTS.V1.USERS.BASE).toBe('/api/v1/users');
      expect(API_ENDPOINTS.V1.CHARACTERS.BASE).toBe('/api/v1/characters');
    });

    it('should generate dynamic v1 endpoints', () => {
      expect(API_ENDPOINTS.V1.USERS.BY_ID('123')).toBe('/api/v1/users/123');
      expect(API_ENDPOINTS.V1.CHARACTERS.BY_ID('abc')).toBe('/api/v1/characters/abc');
      expect(API_ENDPOINTS.V1.ENCOUNTERS.BY_ID('xyz')).toBe('/api/v1/encounters/xyz');
    });

    it('should point current endpoints to latest version', () => {
      expect(CURRENT_API_ENDPOINTS).toBe(API_ENDPOINTS.V1);
      expect(CURRENT_API_ENDPOINTS.AUTH.LOGIN).toBe('/api/v1/auth/login');
    });
  });

  describe('Legacy API Endpoints', () => {
    it('should have legacy endpoints for backward compatibility', () => {
      expect(LEGACY_API_ENDPOINTS.AUTH.LOGIN).toBe('/api/auth/login');
      expect(LEGACY_API_ENDPOINTS.AUTH.LOGOUT).toBe('/api/auth/logout');
      expect(LEGACY_API_ENDPOINTS.USERS.BASE).toBe('/api/users');
      expect(LEGACY_API_ENDPOINTS.CHARACTERS.BASE).toBe('/api/characters');
    });

    it('should generate dynamic legacy endpoints', () => {
      expect(LEGACY_API_ENDPOINTS.USERS.BY_ID('123')).toBe('/api/users/123');
      expect(LEGACY_API_ENDPOINTS.CHARACTERS.BY_ID('abc')).toBe('/api/characters/abc');
      expect(LEGACY_API_ENDPOINTS.ENCOUNTERS.BY_ID('xyz')).toBe('/api/encounters/xyz');
    });
  });
});