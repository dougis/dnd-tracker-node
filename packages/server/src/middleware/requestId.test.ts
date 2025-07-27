import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { requestIdMiddleware } from './requestId.js';

describe('Request ID Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {}
    };
    mockResponse = {
      setHeader: vi.fn(),
      locals: {}
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  it('should generate a unique request ID when none provided', () => {
    requestIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-ID', expect.any(String));
    expect(mockRequest.requestId).toBeDefined();
    expect(typeof mockRequest.requestId).toBe('string');
    expect(mockRequest.requestId!.length).toBeGreaterThan(0);
    expect(mockNext).toHaveBeenCalledOnce();
  });

  it('should use existing request ID from X-Request-ID header', () => {
    const existingId = 'existing-request-id-123';
    mockRequest.headers = { 'x-request-id': existingId };

    requestIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-ID', existingId);
    expect(mockRequest.requestId).toBe(existingId);
    expect(mockNext).toHaveBeenCalledOnce();
  });

  it('should use existing request ID from x-request-id header (lowercase)', () => {
    const existingId = 'existing-request-id-456';
    mockRequest.headers = { 'x-request-id': existingId };

    requestIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-ID', existingId);
    expect(mockRequest.requestId).toBe(existingId);
    expect(mockNext).toHaveBeenCalledOnce();
  });

  it('should use existing request ID from X-Request-Id header (mixed case)', () => {
    const existingId = 'existing-request-id-789';
    mockRequest.headers = { 'X-Request-Id': existingId };

    requestIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-ID', existingId);
    expect(mockRequest.requestId).toBe(existingId);
    expect(mockNext).toHaveBeenCalledOnce();
  });

  it('should generate different request IDs for multiple calls', () => {
    const request1 = { headers: {} } as Request;
    const request2 = { headers: {} } as Request;
    const response1 = { setHeader: vi.fn(), locals: {} } as Partial<Response>;
    const response2 = { setHeader: vi.fn(), locals: {} } as Partial<Response>;

    requestIdMiddleware(request1, response1 as Response, mockNext);
    requestIdMiddleware(request2, response2 as Response, mockNext);

    expect(request1.requestId).toBeDefined();
    expect(request2.requestId).toBeDefined();
    expect(request1.requestId).not.toBe(request2.requestId);
  });

  it('should handle array values in headers', () => {
    mockRequest.headers = { 'x-request-id': ['first-id', 'second-id'] };

    requestIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.requestId).toBe('first-id');
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-ID', 'first-id');
    expect(mockNext).toHaveBeenCalledOnce();
  });

  it('should generate new ID when header value is empty string', () => {
    mockRequest.headers = { 'x-request-id': '' };

    requestIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.requestId).toBeDefined();
    expect(mockRequest.requestId).not.toBe('');
    expect(typeof mockRequest.requestId).toBe('string');
    expect(mockNext).toHaveBeenCalledOnce();
  });

  it('should generate new ID when header value is only whitespace', () => {
    mockRequest.headers = { 'x-request-id': '   ' };

    requestIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.requestId).toBeDefined();
    expect(mockRequest.requestId).not.toBe('   ');
    expect(mockRequest.requestId!.trim().length).toBeGreaterThan(0);
    expect(mockNext).toHaveBeenCalledOnce();
  });

  it('should store request ID in response.locals for other middleware', () => {
    requestIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.locals!.requestId).toBe(mockRequest.requestId);
    expect(mockNext).toHaveBeenCalledOnce();
  });

  it('should handle missing headers object', () => {
    delete mockRequest.headers;

    requestIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.requestId).toBeDefined();
    expect(typeof mockRequest.requestId).toBe('string');
    expect(mockNext).toHaveBeenCalledOnce();
  });

  describe('Request ID Format', () => {
    it('should generate UUIDs by default', () => {
      requestIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      const requestId = mockRequest.requestId!;
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(requestId).toMatch(uuidRegex);
    });

    it('should generate cryptographically random IDs', () => {
      const ids = new Set();
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const req = { headers: {} } as Request;
        const res = { setHeader: vi.fn(), locals: {} } as Partial<Response>;
        
        requestIdMiddleware(req, res as Response, mockNext);
        ids.add(req.requestId);
      }

      // All IDs should be unique
      expect(ids.size).toBe(iterations);
    });
  });
});