import { Request, Response } from 'express';
import { validationResult } from 'express-validator';

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}

/**
 * Handle validation errors in a consistent way
 */
export function handleValidationErrors(req: Request, res: Response): boolean {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
    return true;
  }
  return false;
}

/**
 * Send a successful response
 */
export function sendSuccessResponse<T>(
  res: Response,
  data: T,
  message: string,
  statusCode: number = 200
): void {
  res.status(statusCode).json({
    success: true,
    data,
    message,
  });
}

/**
 * Send an error response
 */
export function sendErrorResponse(
  res: Response,
  error: unknown,
  defaultMessage: string,
  statusCode: number = 500
): void {
  console.error(`Error: ${defaultMessage}`, error);
  res.status(statusCode).json({
    success: false,
    message: error instanceof Error ? error.message : defaultMessage,
  });
}

/**
 * Send a not found response
 */
export function sendNotFoundResponse(res: Response, message: string): void {
  res.status(404).json({
    success: false,
    message,
  });
}

/**
 * Async route handler wrapper that catches errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response) => Promise<void>
) {
  return (req: Request, res: Response): void => {
    Promise.resolve(fn(req, res)).catch((error) => {
      sendErrorResponse(res, error, 'Internal server error');
    });
  };
}