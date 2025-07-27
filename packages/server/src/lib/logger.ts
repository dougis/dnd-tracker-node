import pino from 'pino';
import pinoHttp from 'pino-http';
import type { Logger } from 'pino';

// Sensitive fields that should never be logged
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'apiKey',
  'authorization',
  'cookie',
  'x-api-key',
  'auth',
  'secret',
  'key',
  'credentials'
];

// Custom serializer to remove sensitive data
export function sanitizeObject(obj: unknown): Record<string, unknown> | unknown {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    
    // Check if this is a sensitive field
    const isSensitive = SENSITIVE_FIELDS.some(field => 
      lowerKey.includes(field.toLowerCase())
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Creates a configured Pino logger instance
 */
export function createLogger(): Logger {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';
  const logLevel = process.env.LOG_LEVEL || (isTest ? 'silent' : isDevelopment ? 'debug' : 'info');

  const baseConfig = {
    name: 'dnd-tracker-server',
    level: logLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
    serializers: {
      req: (req: unknown) => {
        if (!req) return req;
        
        const reqObj = req as Record<string, unknown>;
        const sanitizedReq = {
          method: reqObj.method,
          url: reqObj.url,
          headers: sanitizeObject(reqObj.headers),
          remoteAddress: reqObj.remoteAddress,
          remotePort: reqObj.remotePort,
          requestId: reqObj.requestId
        };

        return sanitizedReq;
      },
      res: (res: unknown) => {
        if (!res) return res;
        
        const resObj = res as Record<string, unknown>;
        return {
          statusCode: resObj.statusCode,
          headers: sanitizeObject(resObj.headers)
        };
      },
      err: pino.stdSerializers.err
    },
    formatters: {
      log: (obj: unknown): Record<string, unknown> => {
        const sanitized = sanitizeObject(obj);
        return (typeof sanitized === 'object' && sanitized !== null && !Array.isArray(sanitized)) 
          ? sanitized as Record<string, unknown>
          : {};
      }
    },
    hooks: {
      logMethod(this: Logger, args: [msg: string, ...rest: unknown[]], method: (msg: string, ...args: unknown[]) => void, _level: number) {
        // Sanitize all arguments passed to log methods
        const [msg, ...rest] = args;
        const sanitizedRest = rest.map((arg) => {
          if (typeof arg === 'object' && arg !== null) {
            return sanitizeObject(arg);
          }
          return arg;
        });
        return method.call(this, msg, ...sanitizedRest);
      }
    }
  };

  // Production: structured JSON logs
  if (isProduction) {
    return pino(baseConfig);
  }

  // Test: silent or minimal logging
  if (isTest) {
    return pino({
      ...baseConfig,
      level: 'silent'
    });
  }

  // Development: pretty printed logs
  return pino({
    ...baseConfig,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'time,pid,hostname',
        translateTime: 'HH:MM:ss',
        singleLine: false
      }
    }
  });
}

/**
 * Creates request logging middleware using pino-http
 */
export function createRequestLogger() {
  return pinoHttp({
    logger: createLogger(),
    genReqId: (req: Record<string, unknown>) => {
      // Use existing request ID if available
      return (req.requestId as string) || crypto.randomUUID();
    },
    customLogLevel: (_req: Record<string, unknown>, res: Record<string, unknown>, error?: Error) => {
      const statusCode = res.statusCode as number;
      if (statusCode >= 400 && statusCode < 500) {
        return 'warn';
      } else if (statusCode >= 500 || error) {
        return 'error';
      }
      return 'info';
    },
    customSuccessMessage: (req: Record<string, unknown>, res: Record<string, unknown>) => {
      return `${req.method} ${req.url} - ${res.statusCode}`;
    },
    customErrorMessage: (req: Record<string, unknown>, res: Record<string, unknown>, err: Error) => {
      return `${req.method} ${req.url} - ${res.statusCode} - ${err.message}`;
    },
    customAttributeKeys: {
      req: 'request',
      res: 'response',
      err: 'error',
      responseTime: 'duration'
    },
    serializers: {
      req: (req: Record<string, unknown>) => {
        return {
          method: req.method,
          url: req.url,
          headers: sanitizeObject(req.headers),
          remoteAddress: req.remoteAddress,
          remotePort: req.remotePort,
          requestId: req.requestId
        };
      },
      res: (res: Record<string, unknown>) => {
        const getHeaders = res.getHeaders as (() => Record<string, unknown>) | undefined;
        return {
          statusCode: res.statusCode,
          headers: sanitizeObject(getHeaders?.() || {})
        };
      }
    }
  });
}

// Create and export a default logger instance
export const logger = createLogger();