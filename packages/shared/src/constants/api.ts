// API constants
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
} as const;

// API Versioning constants
export const API_VERSION = {
  V1: 'v1',
  CURRENT: 'v1',
  SUPPORTED: ['v1'],
  DEFAULT: 'v1'
} as const;

export const API_VERSION_HEADER = 'API-Version' as const;
export const API_VERSION_RESPONSE_HEADER = 'api-version' as const;

// Versioned API endpoints
export const API_ENDPOINTS = {
  V1: {
    AUTH: {
      LOGIN: '/api/v1/auth/login',
      LOGOUT: '/api/v1/auth/logout',
      REGISTER: '/api/v1/auth/register',
      REFRESH: '/api/v1/auth/refresh',
      PROFILE: '/api/v1/auth/profile'
    },
    USERS: {
      BASE: '/api/v1/users',
      BY_ID: (id: string) => `/api/v1/users/${id}`,
      STATS: (id: string) => `/api/v1/users/${id}/stats`
    },
    CHARACTERS: {
      BASE: '/api/v1/characters',
      BY_ID: (id: string) => `/api/v1/characters/${id}`
    },
    ENCOUNTERS: {
      BASE: '/api/v1/encounters',
      BY_ID: (id: string) => `/api/v1/encounters/${id}`,
      PARTICIPANTS: (id: string) => `/api/v1/encounters/${id}/participants`,
      DAMAGE: (id: string) => `/api/v1/encounters/${id}/damage`,
      HEAL: (id: string) => `/api/v1/encounters/${id}/heal`,
      NEXT_TURN: (id: string) => `/api/v1/encounters/${id}/next-turn`
    }
  }
} as const;

// Current version endpoints (points to latest stable version)
export const CURRENT_API_ENDPOINTS = API_ENDPOINTS.V1;

// Legacy endpoints (deprecated - use versioned endpoints instead)
/** @deprecated Use API_ENDPOINTS.V1 or CURRENT_API_ENDPOINTS instead */
export const LEGACY_API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    PROFILE: '/api/auth/profile'
  },
  USERS: {
    BASE: '/api/users',
    BY_ID: (id: string) => `/api/users/${id}`,
    STATS: (id: string) => `/api/users/${id}/stats`
  },
  CHARACTERS: {
    BASE: '/api/characters',
    BY_ID: (id: string) => `/api/characters/${id}`
  },
  ENCOUNTERS: {
    BASE: '/api/encounters',
    BY_ID: (id: string) => `/api/encounters/${id}`,
    PARTICIPANTS: (id: string) => `/api/encounters/${id}/participants`,
    DAMAGE: (id: string) => `/api/encounters/${id}/damage`,
    HEAL: (id: string) => `/api/encounters/${id}/heal`,
    NEXT_TURN: (id: string) => `/api/encounters/${id}/next-turn`
  }
} as const;