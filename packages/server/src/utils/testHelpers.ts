import express from 'express';
import { vi } from 'vitest';

/**
 * Create a test Express app with common setup
 */
export function createTestApp(routePath: string, routes: any): express.Application {
  const app = express();
  app.use(express.json());
  app.use(routePath, routes);
  return app;
}

/**
 * Standard mock configurations for common dependencies
 */
export const standardMocks = {
  prismaClient: {
    PrismaClient: vi.fn().mockImplementation(() => ({}))
  },
  authMiddleware: {
    requireAuth: (req: any, res: any, next: any) => {
      req.user = { id: 'user123', email: 'test@example.com' };
      next();
    }
  }
};