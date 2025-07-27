import { Request, Response, NextFunction } from 'express';
import { 
  StandardSuccessResponse, 
  StandardErrorResponse, 
  PaginatedApiResponse,
  PaginationMetadata,
  API_VERSION, 
  HTTP_STATUS 
} from '@dnd-tracker/shared';

// Extend Express Response to include response helpers
declare module 'express-serve-static-core' {
  interface Response {
    success<T>(data: T, message?: string, statusCode?: number): void;
    error(error: Error | { name?: string; message: string }, statusCode?: number, details?: string): void;
    paginated<T>(data: T[], pagination: PaginationMetadata, message?: string, statusCode?: number): void;
  }
}

/**
 * Creates a standardized success response
 */
export function successResponse<T>(
  data: T, 
  message = 'Success',
  pagination?: PaginationMetadata
) {
  const baseResponse: StandardSuccessResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    version: API_VERSION.CURRENT
  };

  if (pagination) {
    return {
      ...baseResponse,
      data: data as T[],
      pagination
    } as PaginatedApiResponse<T>;
  }

  return baseResponse;
}

/**
 * Creates a standardized error response
 */
export function errorResponse(
  error: Error | { name?: string; message: string },
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  details?: string
): StandardErrorResponse {
  return {
    success: false,
    error: error.name || 'Error',
    message: error.message,
    statusCode,
    timestamp: new Date().toISOString(),
    version: API_VERSION.CURRENT,
    ...(details && { details })
  };
}

/**
 * API response middleware that adds helper methods to Response object
 */
export function apiResponseMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  // Add success response helper
  res.success = function<T>(
    data: T, 
    message: string = 'Success',
    statusCode: number = HTTP_STATUS.OK
  ): void {
    const response = successResponse(data, message);
    this.status(statusCode).json(response);
  };

  // Add error response helper
  res.error = function(
    error: Error | { name?: string; message: string },
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    details?: string
  ): void {
    const response = errorResponse(error, statusCode, details);
    this.status(statusCode).json(response);
  };

  // Add paginated response helper
  res.paginated = function<T>(
    data: T[],
    pagination: PaginationMetadata,
    message: string = 'Data retrieved successfully',
    statusCode: number = HTTP_STATUS.OK
  ): void {
    const response = successResponse(data, message, pagination);
    this.status(statusCode).json(response);
  };

  next();
}

/**
 * Creates pagination metadata
 */
export function createPaginationMetadata(
  page: number,
  limit: number,
  total: number
): PaginationMetadata {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Validates pagination parameters
 */
export function validatePaginationParams(
  page?: string | number,
  limit?: string | number
): { page: number; limit: number; offset: number } {
  const parsedPage = Math.max(1, parseInt(String(page || 1), 10));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(String(limit || 10), 10)));
  const offset = (parsedPage - 1) * parsedLimit;

  return {
    page: parsedPage,
    limit: parsedLimit,
    offset
  };
}