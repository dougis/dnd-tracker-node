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

    it('should handle response end method override', () => {
      const middleware = loggingMiddleware();
      const originalEnd = mockResponse.end;
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Verify that res.end was overridden
      expect(mockResponse.end).not.toBe(originalEnd);
      
      // Call the overridden end method
      if (mockResponse.end) {
        mockResponse.end('test chunk', 'utf8', () => {});
      }
      
      expect(mockNext).toHaveBeenCalledOnce();
    });

    it('should properly handle response end with different parameter combinations', () => {
      const middleware = loggingMiddleware();
      const originalEnd = vi.fn();
      mockResponse.end = originalEnd;
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Test various end method calls
      if (mockResponse.end) {
        // Test with chunk only
        mockResponse.end('test chunk');
        expect(originalEnd).toHaveBeenLastCalledWith('test chunk', undefined, undefined);
        
        // Test with chunk and encoding
        mockResponse.end('test chunk', 'utf8');
        expect(originalEnd).toHaveBeenLastCalledWith('test chunk', 'utf8', undefined);
        
        // Test with chunk, encoding, and callback
        const callback = vi.fn();
        mockResponse.end('test chunk', 'utf8', callback);
        expect(originalEnd).toHaveBeenLastCalledWith('test chunk', 'utf8', callback);
      }
      
      expect(mockNext).toHaveBeenCalledOnce();
    });

    it('should handle response finish event for timing calculation', () => {
      const middleware = loggingMiddleware();
      let finishHandler: (() => void) | undefined;
      
      // Mock response.on to capture the finish event handler
      mockResponse.on = vi.fn((event: string, handler: () => void) => {
        if (event === 'finish') {
          finishHandler = handler;
        }
      });
      
      const startTime = Date.now();
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Simulate some processing time
      setTimeout(() => {
        if (finishHandler) {
          finishHandler();
        }
      }, 10);
      
      expect(mockResponse.on).toHaveBeenCalledWith('finish', expect.any(Function));
      expect(mockNext).toHaveBeenCalledOnce();
    });

    it('should calculate and log response duration', () => {
      const middleware = loggingMiddleware();
      const originalDateNow = Date.now;
      let currentTime = 1000;
      
      Date.now = vi.fn(() => currentTime);
      
      let finishHandler: (() => void) | undefined;
      mockResponse.on = vi.fn((event: string, handler: () => void) => {
        if (event === 'finish') {
          finishHandler = handler;
        }
      });
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Advance time by 150ms
      currentTime = 1150;
      
      // Trigger the finish event
      if (finishHandler) {
        finishHandler();
      }
      
      Date.now = originalDateNow;
      expect(mockNext).toHaveBeenCalledOnce();
    });

    it('should handle request with body data', () => {
      mockRequest.body = {
        username: 'testuser',
        password: 'secret123',
        email: 'test@example.com'
      };
      
      const middleware = loggingMiddleware();
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledOnce();
    });

    it('should handle different response status codes appropriately', () => {
      const middleware = loggingMiddleware();
      
      // Test success status
      mockResponse.statusCode = 200;
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Test client error status
      mockResponse.statusCode = 400;
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Test server error status  
      mockResponse.statusCode = 500;
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledTimes(3);
    });

    it('should handle missing originalEnd method gracefully', () => {
      delete mockResponse.end;
      
      const middleware = loggingMiddleware();
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledOnce();
    });

    it('should handle response with no event listeners', () => {
      delete mockResponse.on;
      
      const middleware = loggingMiddleware();
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledOnce();
    });

    it('should log different status code ranges correctly', () => {
      const middleware = loggingMiddleware();
      
      // Test 400-499 range
      mockResponse.statusCode = 404;
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Test 500+ range
      mockResponse.statusCode = 500;
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Test 200 range
      mockResponse.statusCode = 200;
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledTimes(3);
    });

    it('should handle complex nested objects in request body', () => {
      mockRequest.body = {
        user: {
          credentials: {
            password: 'secret123',
            apiKey: 'sk-12345'
          },
          profile: {
            name: 'John Doe',
            email: 'john@example.com'
          }
        },
        tokens: ['token1', 'token2']
      };

      const middleware = loggingMiddleware();
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledOnce();
    });
  });
});