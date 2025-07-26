import { z } from 'zod';

const configSchema = z.object({
  env: z.enum(['development', 'test', 'production']).default('development'),
  server: z.object({
    port: z.number().default(3001),
    host: z.string().default('localhost')
  }),
  client: z.object({
    url: z.string().default('http://localhost:5173')
  }),
  database: z.object({
    url: z.string()
  }),
  redis: z.object({
    url: z.string()
  }),
  auth: z.object({
    jwtSecret: z.string().min(32),
    sessionExpiry: z.number().default(30 * 24 * 60 * 60 * 1000), // 30 days
    bcryptRounds: z.number().default(12)
  }),
  sentry: z.object({
    dsn: z.string().optional()
  })
});

const env = {
  env: process.env.NODE_ENV as 'development' | 'test' | 'production',
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    host: process.env.HOST || 'localhost'
  },
  client: {
    url: process.env.CLIENT_URL || 'http://localhost:5173'
  },
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/dnd-tracker'
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    sessionExpiry: parseInt(process.env.SESSION_EXPIRY || '2592000000', 10), // 30 days
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10)
  },
  sentry: {
    dsn: process.env.SENTRY_DSN
  }
};

export const config = configSchema.parse(env);