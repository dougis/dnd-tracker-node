import { RateLimiterRedis } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '@dnd-tracker/shared/constants';
import { config } from '../config/index.js';
import Redis from 'redis';

const redisClient = Redis.createClient({ url: config.redis.url });

// Global rate limiter
const globalLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'global',
  points: 100, // requests
  duration: 60, // per 60 seconds
});

// Auth-specific rate limiters
const loginLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'login',
  points: 5, // login attempts
  duration: 900, // per 15 minutes
  blockDuration: 900, // block for 15 minutes
});

const registerLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'register',
  points: 3, // registration attempts
  duration: 3600, // per 1 hour
  blockDuration: 3600, // block for 1 hour
});

const createRateLimitMiddleware = (limiter: RateLimiterRedis) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await limiter.consume(req.ip!);
      next();
    } catch (rejRes: unknown) {
      const rejResponse = rejRes as { remainingPoints?: number; msBeforeNext?: number };
      const remainingPoints = rejResponse?.remainingPoints || 0;
      const msBeforeNext = rejResponse?.msBeforeNext || 0;
      
      res.set('Retry-After', Math.round(msBeforeNext / 1000).toString());
      res.set('X-RateLimit-Limit', limiter.points.toString());
      res.set('X-RateLimit-Remaining', remainingPoints.toString());
      res.set('X-RateLimit-Reset', new Date(Date.now() + msBeforeNext).toISOString());
      
      res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        success: false,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        statusCode: HTTP_STATUS.TOO_MANY_REQUESTS
      });
    }
  };
};

export const rateLimiter = {
  global: createRateLimitMiddleware(globalLimiter),
  login: createRateLimitMiddleware(loginLimiter),
  register: createRateLimitMiddleware(registerLimiter)
};