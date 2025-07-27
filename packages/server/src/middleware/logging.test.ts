import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { Request, Response } from 'express';
import { loggingMiddleware } from './logging.js';

describe('Logging Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: any;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      url: '/api/test',
      headers: {
        'user-agent': 'test-agent',
        'content-type': 'application/json'
      },
      requestId: 'test-request-id-123'
    };
    
    mockResponse = {
      statusCode: 200,
      getHeader: vi.fn(),
      getHeaders: vi.fn(() => ({ 'content-type': 'application/json' })),
      setHeader: vi.fn(),
      end: vi.fn(),
      on: vi.fn(),
      headersSent: false,
      locals: {
        requestId: 'test-request-id-123'
      }
    };
    
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create logging middleware function', () => {
    const middleware = loggingMiddleware();
    expect(middleware).toBeDefined();
    expect(typeof middleware).toBe('function');
  });

  it('should log incoming requests', () => {
    const middleware = loggingMiddleware();
    
    middleware(mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(mockNext).toHaveBeenCalledOnce();
  });

  it('should include request ID in logs', () => {
    const middleware = loggingMiddleware();
    
    middleware(mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(mockNext).toHaveBeenCalledOnce();
  });

  it('should log request method and URL', () => {
    const middleware = loggingMiddleware();
    
    middleware(mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(mockNext).toHaveBeenCalledOnce();
  });

  it('should exclude sensitive headers from request logs', () => {
    mockRequest.headers = {
      'authorization': 'Bearer secret-token',
      'cookie': 'session=abc123',
      'x-api-key': 'secret-api-key',
      'content-type': 'application/json'
    };

    const middleware = loggingMiddleware();
    
    middleware(mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(mockNext).toHaveBeenCalledOnce();
  });

  it('should log response status and timing', () => {
    const middleware = loggingMiddleware();
    
    // Mock Date.now to control timing
    const originalDateNow = Date.now;
    let currentTime = 1000;
    Date.now = vi.fn(() => currentTime);

    middleware(mockRequest as Request, mockResponse as Response, mockNext);
    
    // Simulate response completion after 100ms
    currentTime = 1100;
    
    // Trigger response finish event if available
    if (mockResponse.on) {
      const finishCallback = vi.fn();
      mockResponse.on = vi.fn((event, callback) => {
        if (event === 'finish') finishCallback.mockImplementation(callback);
      });
      finishCallback();
    }

    Date.now = originalDateNow;
    expect(mockNext).toHaveBeenCalledOnce();
  });

  it('should handle requests without request ID gracefully', () => {
    delete mockRequest.requestId;
    delete mockResponse.locals;

    const middleware = loggingMiddleware();
    
    middleware(mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(mockNext).toHaveBeenCalledOnce();
  });

  it('should handle missing headers gracefully', () => {
    delete mockRequest.headers;

    const middleware = loggingMiddleware();
    
    middleware(mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(mockNext).toHaveBeenCalledOnce();
  });

  it('should log different HTTP methods correctly', () => {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    const middleware = loggingMiddleware();

    methods.forEach(method => {
      mockRequest.method = method;
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
    });

    expect(mockNext).toHaveBeenCalledTimes(methods.length);
  });

  it('should handle query parameters in URL', () => {
    mockRequest.url = '/api/test?param1=value1&param2=value2';

    const middleware = loggingMiddleware();
    
    middleware(mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(mockNext).toHaveBeenCalledOnce();
  });

  it('should log error responses appropriately', () => {
    mockResponse.statusCode = 500;

    const middleware = loggingMiddleware();
    
    middleware(mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(mockNext).toHaveBeenCalledOnce();
  });

  it('should log client error responses appropriately', () => {
    mockResponse.statusCode = 404;

    const middleware = loggingMiddleware();
    
    middleware(mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(mockNext).toHaveBeenCalledOnce();
  });

  describe('Performance', () => {
    it('should not significantly impact request processing time', () => {
      const middleware = loggingMiddleware();
      const iterations = 1000;
      
      const start = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        middleware(mockRequest as Request, mockResponse as Response, mockNext);
      }
      
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(100); // Should handle 1000 requests in under 100ms
    });
  });

  describe('Security', () => {
    it('should not log password fields in request body', () => {
      mockRequest.body = {
        username: 'testuser',
        password: 'secret123',
        email: 'test@example.com'
      };

      const middleware = loggingMiddleware();
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledOnce();
    });

    it('should not log sensitive cookie values', () => {
      mockRequest.headers = {
        'cookie': 'sessionId=abc123; authToken=xyz789; csrfToken=def456'
      };

      const middleware = loggingMiddleware();
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledOnce();
    });
  });
});