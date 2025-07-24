import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterMemory, IRateLimiterOptions } from 'rate-limiter-flexible';
import { createClient } from 'redis';

interface RateLimitConfig {
  keyGenerator: (req: Request) => string;
  points: number;
  duration: number;
  blockDuration: number;
}

interface UserTier {
  id: string;
  tier: 'free' | 'basic' | 'premium' | 'pro' | 'enterprise';
}

declare global {
  namespace Express {
    interface Request {
      user?: UserTier;
    }
  }
}

// Rate limit configurations for different tiers
const TIER_LIMITS = {
  free: { points: 100, duration: 3600 }, // 100 requests per hour
  basic: { points: 500, duration: 3600 }, // 500 requests per hour
  premium: { points: 1000, duration: 3600 }, // 1000 requests per hour
  pro: { points: 5000, duration: 3600 }, // 5000 requests per hour
  enterprise: { points: 10000, duration: 3600 } // 10000 requests per hour
};

// Unauthenticated endpoint limits
const UNAUTHENTICATED_LIMITS = {
  login: { points: 5, duration: 60, blockDuration: 60 }, // 5 requests per minute
  register: { points: 3, duration: 300, blockDuration: 300 } // 3 requests per 5 minutes
};

let redisClient: any = null;

// Initialize Redis connection in production
async function initRedis(): Promise<any> {
  if (process.env.NODE_ENV === 'production') {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('Redis URL is required in production environment');
    }

    if (!redisClient) {
      redisClient = createClient({
        url: redisUrl,
        password: process.env.REDIS_PASSWORD || 'redispassword'
      });

      await redisClient.connect();
      
      // Test Redis connection
      await redisClient.ping();
      console.log('Redis connected successfully for rate limiting');
    }
  }
  
  return redisClient;
}

// Create rate limiter instance
export function createRateLimiter(options: Omit<IRateLimiterOptions, 'storeClient'>): RateLimiterRedis | RateLimiterMemory {
  if (process.env.NODE_ENV === 'production') {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('Redis URL is required in production environment');
    }

    // Use Redis in production
    return new RateLimiterRedis({
      ...options,
      storeClient: redisClient,
      keyPrefix: 'rl_'
    });
  } else {
    // Use in-memory storage for development/test
    return new RateLimiterMemory(options);
  }
}

// Main rate limiting middleware
export function rateLimitMiddleware(config: RateLimitConfig) {
  const rateLimiter = createRateLimiter({
    points: config.points,
    duration: config.duration,
    blockDuration: config.blockDuration
  });

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = config.keyGenerator(req);
      
      const result = await rateLimiter.consume(key);
      
      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': config.points.toString(),
        'X-RateLimit-Remaining': result.remainingPoints.toString(),
        'X-RateLimit-Reset': new Date(Date.now() + result.msBeforeNext).toISOString()
      });

      next();
    } catch (rejRes: any) {
      // Rate limit exceeded
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      
      res.set({
        'X-RateLimit-Limit': config.points.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(Date.now() + rejRes.msBeforeNext).toISOString(),
        'Retry-After': secs.toString()
      });

      res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: secs
      });
    }
  };
}

// Specific middleware for login endpoint
export const loginRateLimit = rateLimitMiddleware({
  keyGenerator: (req: Request) => req.ip || 'unknown',
  points: UNAUTHENTICATED_LIMITS.login.points,
  duration: UNAUTHENTICATED_LIMITS.login.duration,
  blockDuration: UNAUTHENTICATED_LIMITS.login.blockDuration
});

// Specific middleware for register endpoint
export const registerRateLimit = rateLimitMiddleware({
  keyGenerator: (req: Request) => req.ip || 'unknown',
  points: UNAUTHENTICATED_LIMITS.register.points,
  duration: UNAUTHENTICATED_LIMITS.register.duration,
  blockDuration: UNAUTHENTICATED_LIMITS.register.blockDuration
});

// Tier-based rate limiting for authenticated endpoints
export function createTierBasedRateLimit() {
  // Create rate limiters for each tier
  const tierLimiters = Object.entries(TIER_LIMITS).reduce((acc, [tier, config]) => {
    acc[tier as keyof typeof TIER_LIMITS] = createRateLimiter({
      points: config.points,
      duration: config.duration,
      blockDuration: config.duration
    });
    return acc;
  }, {} as Record<keyof typeof TIER_LIMITS, RateLimiterRedis | RateLimiterMemory>);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        // Fallback to IP-based limiting for unauthenticated requests
        const key = req.ip || 'unknown';
        const rateLimiter = tierLimiters.free; // Use free tier as default
        
        const result = await rateLimiter.consume(key);
        
        res.set({
          'X-RateLimit-Limit': TIER_LIMITS.free.points.toString(),
          'X-RateLimit-Remaining': result.remainingPoints.toString(),
          'X-RateLimit-Reset': new Date(Date.now() + result.msBeforeNext).toISOString()
        });
        
        return next();
      }

      const userTier = user.tier || 'free';
      const rateLimiter = tierLimiters[userTier];
      const tierConfig = TIER_LIMITS[userTier];
      
      const result = await rateLimiter.consume(user.id);
      
      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': tierConfig.points.toString(),
        'X-RateLimit-Remaining': result.remainingPoints.toString(),
        'X-RateLimit-Reset': new Date(Date.now() + result.msBeforeNext).toISOString()
      });

      next();
    } catch (rejRes: any) {
      // Rate limit exceeded
      const user = req.user;
      const tierConfig = user ? TIER_LIMITS[user.tier || 'free'] : TIER_LIMITS.free;
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      
      res.set({
        'X-RateLimit-Limit': tierConfig.points.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(Date.now() + rejRes.msBeforeNext).toISOString(),
        'Retry-After': secs.toString()
      });

      res.status(429).json({
        success: false,
        message: 'Rate limit exceeded for your tier. Please upgrade or try again later.',
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: secs,
        currentTier: user?.tier || 'free'
      });
    }
  };
}

// Initialize Redis on module load in production
if (process.env.NODE_ENV === 'production') {
  initRedis().catch(error => {
    console.error('Failed to initialize Redis for rate limiting:', error);
    process.exit(1);
  });
}

export { initRedis, TIER_LIMITS, UNAUTHENTICATED_LIMITS };