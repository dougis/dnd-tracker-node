import { Request, Response } from 'express';
import { sendErrorResponse } from './routeHelpers';

/**
 * Helper functions to reduce route validation duplication
 */
export class RouteValidators {
  /**
   * Validate and extract route parameter
   */
  static validateParam(req: Request, res: Response, paramName: string, entityType: string): string | null {
    const paramValue = req.params[paramName];
    if (!paramValue) {
      sendErrorResponse(
        res, 
        new Error(`${entityType} ID is required`), 
        `${entityType} ID is required`, 
        400
      );
      return null;
    }
    return paramValue;
  }

  /**
   * Extract and validate user ID from authenticated request
   */
  static extractUserId(req: Request): string {
    return (req.user as any).id as string;
  }

  /**
   * Combined validation for common route patterns
   */
  static validateParamAndUser(req: Request, res: Response, paramName: string, entityType: string): { id: string; userId: string } | null {
    const id = this.validateParam(req, res, paramName, entityType);
    if (!id) return null;

    const userId = this.extractUserId(req);
    return { id, userId };
  }
}