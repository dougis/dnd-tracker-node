// Validation constants
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const CHARACTER_NAME_MAX_LENGTH = 100;
export const ENCOUNTER_NAME_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;

export const MIN_ABILITY_SCORE = 1;
export const MAX_ABILITY_SCORE = 30;
export const MIN_ARMOR_CLASS = 1;
export const MAX_ARMOR_CLASS = 30;
export const MIN_CHARACTER_LEVEL = 1;
export const MAX_CHARACTER_LEVEL = 20;

export const RATE_LIMIT_WINDOWS = {
  LOGIN: 15 * 60 * 1000, // 15 minutes
  REGISTRATION: 60 * 60 * 1000, // 1 hour
  API: 60 * 1000, // 1 minute
  PASSWORD_RESET: 60 * 60 * 1000 // 1 hour
} as const;