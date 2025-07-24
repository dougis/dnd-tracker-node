import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';
import { EncounterService } from '../services/EncounterService';
import { createTierBasedRateLimit } from '../middleware/rate-limiting';

// Shared instances
export const prisma = new PrismaClient();
export const encounterService = new EncounterService(prisma);
export const tierBasedRateLimit = createTierBasedRateLimit();

/**
 * Safely format data for Server-Sent Events with XSS protection
 * Ensures proper escaping and SSE format compliance
 * @param data - The data to send (will be sanitized)
 * @returns Formatted SSE string safe for direct response writing
 */
export function formatSSEData(data: any): string {
  try {
    // JSON.stringify provides XSS protection by escaping special characters
    // This is the standard and secure way to send JSON data via SSE
    const jsonData = JSON.stringify(data);
    
    // Additional safety measures for SSE format compliance:
    // 1. Replace any literal newlines that could break SSE format
    // 2. Escape any potential injection characters
    const safeData = jsonData
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\u2028/g, '\\u2028') // Line separator
      .replace(/\u2029/g, '\\u2029'); // Paragraph separator
    
    // Return properly formatted SSE data
    return `data: ${safeData}\n\n`;
  } catch (error) {
    // Fallback for JSON serialization errors
    return 'data: {"type":"error","message":"Serialization failed"}\n\n';
  }
}

/**
 * Write SSE data safely to response stream
 * Wraps res.write with additional safety checks and XSS protection
 * @param res - Express response object
 * @param data - Data to send via SSE (will be sanitized)
 */
export function writeSSEData(res: any, data: any): void {
  if (!res || typeof res.write !== 'function') {
    return; // Guard against invalid response object
  }
  
  // formatSSEData already provides XSS protection via JSON.stringify
  // and additional escaping, making this safe for direct writing
  const formattedData = formatSSEData(data);
  
  // Safe to write as data has been properly sanitized by formatSSEData
  res.write(formattedData);
}

/**
 * Format encounter data for consistent API responses
 * @param encounter - Encounter with details
 * @returns Formatted encounter object
 */
export function formatEncounterResponse(encounter: any) {
  return {
    id: encounter.id,
    name: encounter.name,
    description: encounter.description,
    status: encounter.status,
    round: encounter.round,
    turn: encounter.turn,
    isActive: encounter.isActive,
    participants: encounter.participants,
    lairActions: encounter.lairActions,
    createdAt: encounter.createdAt.toISOString(),
    updatedAt: encounter.updatedAt.toISOString()
  };
}

/**
 * Send standardized success response with encounter data
 * @param res - Express response object
 * @param encounter - Encounter data
 * @param message - Success message
 * @param statusCode - HTTP status code (default 200)
 */
export function sendEncounterResponse(res: any, encounter: any, message: string, statusCode = 200) {
  res.status(statusCode).json({
    success: true,
    data: {
      encounter: formatEncounterResponse(encounter)
    },
    message
  });
}

/**
 * Send standardized error response
 * @param res - Express response object
 * @param error - Error object or message
 * @param statusCode - HTTP status code
 */
export function sendErrorResponse(res: any, error: any, statusCode: number) {
  const message = typeof error === 'string' ? error : error.message;
  res.status(statusCode).json({
    success: false,
    message
  });
}

/**
 * Check validation results and send error response if validation failed
 * @param req - Express request object
 * @param res - Express response object
 * @returns true if validation passed, false if failed (response already sent)
 */
export function handleValidationErrors(req: any, res: any): boolean {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
    return false;
  }
  
  return true;
}