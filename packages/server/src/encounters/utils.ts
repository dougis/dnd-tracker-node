import { PrismaClient } from '@prisma/client';
import { EncounterService } from '../services/EncounterService';
import { createTierBasedRateLimit } from '../middleware/rate-limiting';

// Shared instances
export const prisma = new PrismaClient();
export const encounterService = new EncounterService(prisma);
export const tierBasedRateLimit = createTierBasedRateLimit();

/**
 * Safely format data for Server-Sent Events
 * Ensures proper escaping and SSE format compliance
 * @param data - The data to send
 * @returns Formatted SSE string
 */
export function formatSSEData(data: any): string {
  // JSON.stringify provides XSS protection by escaping special characters
  // This is the standard way to send JSON data via SSE
  const jsonData = JSON.stringify(data);
  
  // Additional safety: ensure no newlines in the JSON that could break SSE format
  const safeData = jsonData.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
  
  // Format according to SSE specification
  return `data: ${safeData}\n\n`;
}