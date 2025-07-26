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

export const API_ENDPOINTS = {
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