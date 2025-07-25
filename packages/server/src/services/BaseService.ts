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
   * Validate that a required string field is not empty
   */
  protected validateRequiredStringField(value: string | undefined, errorMessage: string): void {
    if (!value || value.trim().length === 0) {
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
   * Validate that a required array field has at least one item
   */
  protected validateRequiredArrayField(value: any[] | undefined, errorMessage: string): void {
    if (!value || value.length === 0) {
      throw new Error(errorMessage);
    }
  }

  /**
   * Process a string field for update (trim and convert empty to null)
   */
  protected processStringField(value: string | undefined): string | null {
    if (value === undefined) {
      return null;
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

  /**
   * Copy defined fields from source to target object
   */
  protected copyDefinedFields(source: any, target: any, fields: string[]): void {
    fields.forEach(field => {
      if (source[field] !== undefined) {
        target[field] = source[field];
      }
    });
  }

  /**
   * Execute database operation with error handling
   */
  protected async executeOperation<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error, operationName);
    }
  }

  /**
   * Check if entity exists and belongs to user
   */
  protected async verifyEntityOwnership(
    entityId: string, 
    userId: string, 
    findOperation: () => Promise<any>
  ): Promise<void> {
    const entity = await findOperation();
    if (!entity) {
      throw new Error('Entity not found or does not belong to user');
    }
  }
}