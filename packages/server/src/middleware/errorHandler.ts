import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { HTTP_STATUS } from '@dnd-tracker/shared/constants';

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: CustomError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err);

  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: 'Validation Error',
      message: err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      statusCode: HTTP_STATUS.BAD_REQUEST
    });
    return;
  }

  // Custom application errors
  if (err.statusCode) {
    res.status(err.statusCode).json({
      success: false,
      error: err.name || 'Application Error',
      message: err.message,
      statusCode: err.statusCode
    });
    return;
  }

  // Default server error
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR
  });
};