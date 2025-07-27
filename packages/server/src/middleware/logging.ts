import type { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';

// Sensitive headers that should not be logged
const SENSITIVE_HEADERS = [
  'authorization',
  'cookie',
  'x-api-key',
  'x-auth-token',
  'x-access-token',
  'x-refresh-token'
];

/**
 * Sanitizes headers by removing sensitive information
 */
function sanitizeHeaders(headers: Record<string, unknown>): Record<string, unknown> {
  if (!headers || typeof headers !== 'object') {
    return {};
  }

  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    
    if (SENSITIVE_HEADERS.includes(lowerKey)) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitizes request body by removing sensitive fields
 */
function sanitizeBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') {
    return body;
  }

  if (Array.isArray(body)) {
    return body.map(sanitizeBody);
  }

  const sensitiveFields = ['password', 'token', 'secret', 'key', 'credentials'];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeBody(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Logging middleware that logs request/response details with performance metrics
 */
export function loggingMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const requestId = (req as Request & { requestId?: string }).requestId || res.locals?.requestId || 'unknown';

    // Log incoming request
    logger.info({
      requestId,
      method: req.method,
      url: req.url,
      headers: sanitizeHeaders(req.headers || {}),
      userAgent: req.headers?.['user-agent'],
      remoteAddress: req.ip || req.connection?.remoteAddress,
      body: sanitizeBody(req.body)
    }, `Incoming ${req.method} ${req.url}`);

    // Override res.end to log response
    const originalEnd = res.end;
    if (originalEnd) {
      res.end = function(chunk?: unknown, encoding?: unknown, callback?: unknown) {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Determine log level based on status code
      let logLevel: 'info' | 'warn' | 'error' = 'info';
      if (statusCode >= 400 && statusCode < 500) {
        logLevel = 'warn';
      } else if (statusCode >= 500) {
        logLevel = 'error';
      }

      // Log response
      logger[logLevel]({
        requestId,
        method: req.method,
        url: req.url,
        statusCode,
        duration,
        contentLength: res.getHeader('content-length')
      }, `${req.method} ${req.url} - ${statusCode} - ${duration}ms`);

        // Call original end method with proper type casting
        return originalEnd.call(this, chunk, encoding as BufferEncoding, callback as (() => void) | undefined);
      };
    }

    // Handle response finish event for additional logging
    if (res.on) {
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        // Only log if we haven't already logged in res.end
        if (!res.headersSent) {
          logger.info({
            requestId,
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration
          }, `Response finished - ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
        }
      });

      // Handle errors
      res.on('error', (error: Error) => {
        const duration = Date.now() - startTime;
        
        logger.error({
          requestId,
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          }
        }, `Response error - ${req.method} ${req.url} - ${error.message}`);
      });
    }

    next();
  };
}