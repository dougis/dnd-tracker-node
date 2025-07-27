// Standard API response types with versioning and timestamps

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StandardSuccessResponse<T> {
  success: true;
  data: T;
  message: string;
  timestamp: string;
  version: string;
}

export interface StandardErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  version: string;
  details?: string;
}

export interface PaginatedApiResponse<T> extends StandardSuccessResponse<T[]> {
  pagination: PaginationMetadata;
}

// Union type for all API responses
export type StandardApiResponse<T> = StandardSuccessResponse<T> | StandardErrorResponse;

// Legacy types (deprecated - use Standard types instead)
/** @deprecated Use StandardSuccessResponse instead */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** @deprecated Use PaginatedApiResponse instead */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** @deprecated Use StandardErrorResponse instead */
export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
}