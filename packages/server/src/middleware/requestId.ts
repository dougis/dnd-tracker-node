import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware to generate or extract request IDs for tracking requests across the application
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Check for existing request ID in headers (case-insensitive)
  const headers = req.headers || {};
  const existingId = 
    headers['x-request-id'] || 
    headers['X-Request-ID'] || 
    headers['X-Request-Id'];

  let requestId: string;

  if (existingId) {
    // Use existing ID (handle array case)
    requestId = Array.isArray(existingId) ? existingId[0] : existingId;
    
    // Validate that the ID is not empty or just whitespace
    if (!requestId || !requestId.trim()) {
      requestId = crypto.randomUUID();
    } else {
      requestId = requestId.trim();
    }
  } else {
    // Generate new UUID v4
    requestId = crypto.randomUUID();
  }

  // Attach request ID to request object
  req.requestId = requestId;

  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);

  // Store in response.locals for other middleware
  res.locals = res.locals || {};
  res.locals.requestId = requestId;

  next();
}