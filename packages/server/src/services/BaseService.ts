import { PrismaClient } from '@prisma/client';

/**
 * Base service class with common validation and data processing utilities
 */
export abstract class BaseService {
  protected prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Validate that a string field is not empty if defined
   */
  protected validateStringField(value: string | undefined, errorMessage: string): void {
    if (value !== undefined && (!value || value.trim().length === 0)) {
      throw new Error(errorMessage);
    }
  }

  /**
   * Validate that a numeric field is not negative if defined
   */
  protected validateNonNegativeField(value: number | undefined, errorMessage: string): void {
    if (value !== undefined && value < 0) {
      throw new Error(errorMessage);
    }
  }

  /**
   * Validate that an array field has at least one item if defined
   */
  protected validateNonEmptyArrayField(value: any[] | undefined, errorMessage: string): void {
    if (value !== undefined && (!value || value.length === 0)) {
      throw new Error(errorMessage);
    }
  }

  /**
   * Process a string field for update (trim and convert empty to null)
   */
  protected processStringField(value: string | undefined): string | null {
    if (value === undefined) {
      return undefined as any;
    }
    return value?.trim() || null;
  }

  /**
   * Build error message with context
   */
  protected buildErrorMessage(operation: string, baseMessage: string): string {
    return `Failed to ${operation}: ${baseMessage}`;
  }

  /**
   * Handle common error scenarios
   */
  protected handleError(error: unknown, operation: string): never {
    if (error instanceof Error) {
      throw new Error(this.buildErrorMessage(operation, error.message));
    }
    throw new Error(`Failed to ${operation}`);
  }
}