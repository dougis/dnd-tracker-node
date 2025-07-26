# Technical Design Document: D&D Encounter Tracker

**Version:** 4.0  
**Date:** July 2025  
**Architecture:** Modern Express/React Stack with Prisma and Advanced Authentication

## Table of Contents

1. [Introduction](#1-introduction)
2. [Architecture Overview](#2-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [Data Model](#4-data-model)
5. [API Design](#5-api-design)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Authentication & Security](#7-authentication--security)
8. [Real-time Features](#8-real-time-features)
9. [Subscription & Payment System](#9-subscription--payment-system)
10. [Performance & Scalability](#10-performance--scalability)
11. [Testing Strategy](#11-testing-strategy)
12. [Deployment & DevOps](#12-deployment--devops)
13. [Monitoring & Observability](#13-monitoring--observability)
14. [Progressive Web App Features](#14-progressive-web-app-features)

## 1. Introduction

This document outlines the technical architecture for the D&D Encounter Tracker, designed as a robust alternative to Next.js implementations. The architecture emphasizes full control over authentication, superior performance, and maintainability while supporting a freemium business model.

### Key Design Principles

- **Explicit Control**: Full control over authentication and session management
- **Type Safety**: TypeScript throughout with Prisma for database operations
- **Performance First**: Multi-layer caching and optimized queries
- **Security by Design**: Session-based auth with modern security practices
- **Developer Experience**: Modern tooling with Vite and comprehensive testing
- **Business Focus**: Built-in monetization with flexible subscription tiers

### Why Not Next.js?

This architecture is specifically designed to avoid common Next.js authentication complexities by providing:

- Direct control over session management
- Flexible authentication strategies without framework constraints
- Easier debugging of authentication flows
- Backend portability to work with any frontend framework

## 2. Architecture Overview

### High-Level Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────┐
│   React SPA (Vite)  │     │   Express.js API    │     │    MongoDB      │
│   TypeScript        │◄───►│   TypeScript        │◄───►│    with Prisma  │
│   Port: 5173        │ SSE │   Port: 3001        │     │                 │
└─────────────────────┘     └─────────────────────┘     └─────────────────┘
         │                           │                            │
         │                     ┌─────┴─────┐                     │
         │                     │   Redis   │                     │
         │                     │  (Cache)  │                     │
         │                     └───────────┘                     │
         │                                                       │
         └───────────── Server-Sent Events (SSE) ────────────────┘
```

### Project Structure

```
dnd-tracker-express/
├── packages/
│   ├── server/                 # Express backend
│   │   ├── src/
│   │   │   ├── config/         # Configuration files
│   │   │   ├── controllers/    # Request handlers
│   │   │   ├── services/       # Business logic
│   │   │   ├── repositories/   # Data access layer
│   │   │   ├── prisma/         # Prisma schema and migrations
│   │   │   ├── middleware/     # Express middleware
│   │   │   ├── routes/         # API routes
│   │   │   ├── lib/            # Utilities and integrations
│   │   │   ├── types/          # TypeScript types
│   │   │   └── app.ts          # Express app setup
│   │   ├── tests/              # Backend tests
│   │   └── package.json
│   │
│   ├── client/                 # React frontend
│   │   ├── src/
│   │   │   ├── components/     # React components
│   │   │   ├── pages/          # Page components
│   │   │   ├── hooks/          # Custom hooks
│   │   │   ├── services/       # API services
│   │   │   ├── stores/         # Zustand stores
│   │   │   ├── types/          # TypeScript types
│   │   │   ├── lib/            # Utilities
│   │   │   └── main.tsx        # App entry point
│   │   ├── public/             # Static assets
│   │   ├── index.html          # HTML template
│   │   ├── vite.config.ts      # Vite configuration
│   │   └── package.json
│   │
│   └── shared/                 # Shared types/utilities
│       ├── src/
│       │   ├── types/          # Shared TypeScript types
│       │   ├── constants/      # Shared constants
│       │   └── schemas/        # Zod validation schemas
│       └── package.json
│
├── docker/                     # Docker configurations
├── scripts/                    # Build/deployment scripts
├── docker-compose.yml          # Local development
├── package.json                # Root package.json
└── README.md
```

## 3. Technology Stack

Documented in [the tech stack document](TECH_STACK.md)

## 4. Data Model

### Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

model User {
  id                  String          @id @default(auto()) @map("_id") @db.ObjectId
  email               String          @unique
  username            String          @unique
  passwordHash        String
  isEmailVerified     Boolean         @default(false)
  isAdmin             Boolean         @default(false)

  // Security
  failedLoginAttempts Int             @default(0)
  lockedUntil         DateTime?

  // Relations
  subscription        Subscription?
  usage               Usage?
  sessions            Session[]
  parties             Party[]
  encounters          Encounter[]
  creatures           Creature[]
  payments            Payment[]

  // Timestamps
  lastLoginAt         DateTime?
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt

  @@index([email])
  @@index([username])
  @@map("users")
}

model ProcessedEvent {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  eventId   String   @unique
  source    String   // e.g., "stripe"
  createdAt DateTime @default(now())

  @@index([eventId])
  @@map("processed_events")
}

model Session {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    String   @db.ObjectId
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([token])
  @@index([userId])
  @@map("sessions")
}

model Subscription {
  id                    String              @id @default(auto()) @map("_id") @db.ObjectId
  userId                String              @unique @db.ObjectId
  user                  User                @relation(fields: [userId], references: [id])
  
  tier                  SubscriptionTier    @default(FREE)
  status                SubscriptionStatus  @default(ACTIVE)
  currentPeriodStart    DateTime
  currentPeriodEnd      DateTime
  cancelAtPeriodEnd     Boolean             @default(false)
  
  // Stripe
  stripeCustomerId      String?             @unique
  stripeSubscriptionId  String?             @unique
  stripePriceId         String?
  
  // Trial
  trialEnd              DateTime?
  
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt
  
  @@index([stripeCustomerId])
  @@map("subscriptions")
}

model Usage {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  userId            String   @unique @db.ObjectId
  user              User     @relation(fields: [userId], references: [id])
  
  partiesCreated    Int      @default(0)
  encountersCreated Int      @default(0)
  creaturesCreated  Int      @default(0)
  
  currentPeriodStart DateTime @default(now())
  lastResetDate      DateTime @default(now())
  
  @@map("usage")
}

model Party {
  id          String      @id @default(auto()) @map("_id") @db.ObjectId
  userId      String      @db.ObjectId
  user        User        @relation(fields: [userId], references: [id])
  
  name        String
  description String?
  isArchived  Boolean     @default(false)
  
  characters  Character[]
  
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  @@index([userId, isArchived])
  @@map("parties")
}

model Character {
  id            String          @id @default(auto()) @map("_id") @db.ObjectId
  partyId       String          @db.ObjectId
  party         Party           @relation(fields: [partyId], references: [id], onDelete: Cascade)
  
  name          String
  playerName    String?
  race          String
  classes       Json            // Array of {className, level}
  level         Int             @default(1)
  
  // Combat stats
  ac            Int             @default(10)
  maxHp         Int             @default(10)
  currentHp     Int             @default(10)
  tempHp        Int             @default(0)
  hitDice       String?
  speed         Int             @default(30)
  
  // Abilities
  abilities     Json            // {str, dex, con, int, wis, cha}
  
  // Additional
  proficiencyBonus Int          @default(2)
  features      String[]
  equipment     String[]
  notes         String?
  
  // Relations
  participations Participant[]
  
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  
  @@map("characters")
}

model Encounter {
  id            String              @id @default(auto()) @map("_id") @db.ObjectId
  userId        String              @db.ObjectId
  user          User                @relation(fields: [userId], references: [id])
  
  name          String
  description   String?
  status        EncounterStatus     @default(PLANNING)
  
  // Combat state
  round         Int                 @default(1)
  turn          Int                 @default(0)
  isActive      Boolean             @default(false)
  
  // Relations
  participants  Participant[]
  lairActions   LairAction?
  combatLogs    CombatLog[]
  
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt
  
  @@index([userId, status])
  @@map("encounters")
}

model Participant {
  id            String      @id @default(auto()) @map("_id") @db.ObjectId
  encounterId   String      @db.ObjectId
  encounter     Encounter   @relation(fields: [encounterId], references: [id], onDelete: Cascade)
  
  type          ParticipantType
  characterId   String?     @db.ObjectId
  character     Character?  @relation(fields: [characterId], references: [id])
  creatureId    String?     @db.ObjectId
  creature      Creature?   @relation(fields: [creatureId], references: [id])
  
  // Combat stats (may override base)
  name          String
  initiative    Int
  initiativeRoll Int?
  currentHp     Int
  maxHp         Int
  tempHp        Int         @default(0)
  ac            Int
  
  // Status
  conditions    Json[]      // Array of conditions
  isActive      Boolean     @default(true)
  notes         String?
  
  @@index([encounterId])
  @@map("participants")
}

model Creature {
  id            String          @id @default(auto()) @map("_id") @db.ObjectId
  userId        String?         @db.ObjectId  // null for system templates
  user          User?           @relation(fields: [userId], references: [id])
  
  name          String
  size          CreatureSize
  type          String
  subtype       String?
  alignment     String?
  
  // Combat stats
  ac            Int
  hp            Int
  hitDice       String?
  speed         Json            // {walk, swim, fly, climb, burrow}
  
  // Abilities
  abilities     Json            // {str, dex, con, int, wis, cha}
  
  // CR and proficiency
  challengeRating String?
  proficiencyBonus Int?
  
  // Features
  traits        Json[]
  actions       Json[]
  reactions     Json[]
  legendaryActions Json?        // {count, actions}
  lairActions   Json[]
  
  // Metadata
  isTemplate    Boolean         @default(true)
  source        String?
  tags          String[]
  
  // Relations
  participations Participant[]
  
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  
  @@index([userId, isTemplate])
  @@index([name])
  @@map("creatures")
}

model LairAction {
  id            String      @id @default(auto()) @map("_id") @db.ObjectId
  encounterId   String      @unique @db.ObjectId
  encounter     Encounter   @relation(fields: [encounterId], references: [id], onDelete: Cascade)
  
  enabled       Boolean     @default(false)
  initiative    Int         @default(20)
  actions       Json[]      // Array of {name, description, recharge}
  
  @@map("lair_actions")
}

model CombatLog {
  id            String      @id @default(auto()) @map("_id") @db.ObjectId
  encounterId   String      @db.ObjectId
  encounter     Encounter   @relation(fields: [encounterId], references: [id], onDelete: Cascade)
  
  timestamp     DateTime    @default(now())
  round         Int
  turn          Int
  action        String
  actor         String?
  target        String?
  details       Json?
  
  @@index([encounterId, timestamp])
  @@map("combat_logs")
}

model Payment {
  id                    String          @id @default(auto()) @map("_id") @db.ObjectId
  userId                String          @db.ObjectId
  user                  User            @relation(fields: [userId], references: [id])
  
  stripePaymentIntentId String          @unique
  amount                Int
  currency              String          @default("usd")
  status                PaymentStatus
  subscriptionTier      String?
  metadata              Json?
  
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt
  
  @@index([stripePaymentIntentId])
  @@map("payments")
}

// Enums
enum SubscriptionTier {
  FREE
  SEASONED
  EXPERT
  MASTER
  GUILD
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  TRIAL
}

enum EncounterStatus {
  PLANNING
  ACTIVE
  PAUSED
  COMPLETED
}

enum ParticipantType {
  CHARACTER
  CREATURE
}

enum CreatureSize {
  TINY
  SMALL
  MEDIUM
  LARGE
  HUGE
  GARGANTUAN
}

enum PaymentStatus {
  PENDING
  PROCESSING
  SUCCEEDED
  FAILED
}
```

## 5. API Design

### RESTful API Structure

```
BASE URL: /api/v1

Authentication:
POST   /auth/register          - User registration
POST   /auth/login             - User login (creates session)
POST   /auth/logout            - User logout (destroys session)
POST   /auth/refresh           - Refresh session
POST   /auth/forgot-password   - Request password reset
POST   /auth/reset-password    - Reset password
GET    /auth/verify-email      - Verify email address
GET    /auth/session           - Get current session

Users:
GET    /users/me               - Get current user profile
PUT    /users/me               - Update user profile
DELETE /users/me               - Delete user account
GET    /users/me/subscription  - Get subscription details
GET    /users/me/usage         - Get usage statistics

Parties:
GET    /parties                - List user's parties
POST   /parties                - Create new party
GET    /parties/:id            - Get party details
PUT    /parties/:id            - Update party
DELETE /parties/:id            - Delete party
POST   /parties/:id/archive    - Archive party
POST   /parties/:id/duplicate  - Duplicate party

Characters (nested under parties):
POST   /parties/:partyId/characters      - Add character
PUT    /parties/:partyId/characters/:id  - Update character
DELETE /parties/:partyId/characters/:id  - Remove character
POST   /parties/:partyId/characters/:id/duplicate - Duplicate character

Encounters:
GET    /encounters             - List user's encounters
POST   /encounters             - Create new encounter
GET    /encounters/:id         - Get encounter details
PUT    /encounters/:id         - Update encounter
DELETE /encounters/:id         - Delete encounter
POST   /encounters/:id/start   - Start combat
POST   /encounters/:id/end     - End combat
PUT    /encounters/:id/turn    - Update turn/round
GET    /encounters/:id/stream  - SSE stream for real-time updates

Combat Actions:
POST   /encounters/:id/hp      - Update participant HP
POST   /encounters/:id/conditions - Add/remove conditions
POST   /encounters/:id/initiative - Roll/set initiative
GET    /encounters/:id/log     - Get combat log (premium)

Creatures:
GET    /creatures              - List creatures (user + templates)
POST   /creatures              - Create creature
GET    /creatures/:id          - Get creature details
PUT    /creatures/:id          - Update creature
DELETE /creatures/:id          - Delete creature
GET    /creatures/templates    - Get system templates
POST   /creatures/import       - Import from external source

Subscriptions:
GET    /subscriptions/plans    - List available plans
POST   /subscriptions/checkout - Create Stripe checkout session
POST   /subscriptions/portal   - Access customer portal
POST   /webhooks/stripe        - Stripe webhook endpoint

Admin (requires admin role):
GET    /admin/users            - List all users
PUT    /admin/users/:id        - Update user details
GET    /admin/stats            - System statistics
GET    /admin/logs             - Admin action logs
POST   /admin/creatures        - Add system creature template
```

### API Response Format

```typescript
// Success response
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    version: string;
    requestId: string;
  };
}

// Error response
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    field?: string;
  };
  meta: {
    timestamp: string;
    version: string;
    requestId: string;
  };
}

// Paginated response
interface PaginatedResponse<T> {
  success: true;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  meta: ResponseMeta;
}
```

### Request Validation with Zod

```typescript
// shared/src/schemas/party.schemas.ts
import { z } from 'zod';

export const CreatePartySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  characters: z.array(
    z.object({
      name: z.string().min(1).max(100),
      playerName: z.string().optional(),
      race: z.string().min(1),
      classes: z.array(
        z.object({
          className: z.string(),
          level: z.number().min(1).max(20),
        })
      ).min(1),
      ac: z.number().min(0).max(30),
      maxHp: z.number().min(1),
      currentHp: z.number().min(0),
      abilities: z.object({
        strength: z.number().min(1).max(30),
        dexterity: z.number().min(1).max(30),
        constitution: z.number().min(1).max(30),
        intelligence: z.number().min(1).max(30),
        wisdom: z.number().min(1).max(30),
        charisma: z.number().min(1).max(30),
      }),
    })
  ).max(10).optional(),
});

export type CreatePartyInput = z.infer<typeof CreatePartySchema>;
```

## 6. Frontend Architecture

### Component Structure

```
client/src/
├── components/              # Reusable UI components
│   ├── ui/                 # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── layout/             # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── forms/              # Form components
│   │   ├── PartyForm.tsx
│   │   ├── CharacterForm.tsx
│   │   └── EncounterForm.tsx
│   └── combat/             # Combat-specific components
│       ├── InitiativeTracker.tsx
│       ├── ParticipantCard.tsx
│       ├── ConditionManager.tsx
│       └── CombatLog.tsx
├── pages/                  # Page components
│   ├── auth/
│   ├── dashboard/
│   ├── parties/
│   ├── encounters/
│   └── subscription/
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts
│   ├── useParties.ts
│   ├── useEncounter.ts
│   ├── useSSE.ts
│   └── useOffline.ts
├── services/               # API service layer
│   ├── api.ts              # Axios/fetch setup
│   ├── auth.service.ts
│   └── encounter.service.ts
├── stores/                 # Zustand stores
│   ├── authStore.ts
│   ├── combatStore.ts
│   └── uiStore.ts
├── lib/                    # Utilities
│   ├── utils.ts
│   ├── constants.ts
│   └── validators.ts
├── types/                  # TypeScript types
└── routes/                 # TanStack Router routes
```

### State Management Architecture

```typescript
// stores/combatStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';

interface CombatState {
  // State
  encounterId: string | null;
  round: number;
  turn: number;
  participants: Participant[];
  combatLog: CombatLogEntry[];
  isLairActionTriggered: boolean;
  
  // Actions
  startCombat: (encounterId: string) => void;
  updateParticipantHP: (id: string, hp: number, temp?: boolean) => void;
  addCondition: (participantId: string, condition: Condition) => void;
  removeCondition: (participantId: string, conditionId: string) => void;
  nextTurn: () => void;
  previousTurn: () => void;
  rollInitiative: () => void;
  triggerLairAction: () => void;
  
  // Computed selectors
  getCurrentParticipant: () => Participant | null;
  getActiveConditions: () => Map<string, Condition[]>;
  getInitiativeOrder: () => Participant[];
}

export const useCombatStore = create<CombatState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        encounterId: null,
        round: 1,
        turn: 0,
        participants: [],
        combatLog: [],
        isLairActionTriggered: false,

        // Actions implementation
        startCombat: (encounterId) =>
          set((state) => {
            state.encounterId = encounterId;
            state.round = 1;
            state.turn = 0;
            state.isLairActionTriggered = false;
            state.combatLog.push({
              id: crypto.randomUUID(),
              timestamp: new Date(),
              action: 'COMBAT_START',
              round: 1,
              details: { encounterId },
            });
          }),

        updateParticipantHP: (id, hp, temp = false) =>
          set((state) => {
            const participant = state.participants.find((p) => p.id === id);
            if (!participant) return;

            const oldHp = temp ? participant.tempHp : participant.currentHp;
            if (temp) {
              participant.tempHp = Math.max(0, hp);
            } else {
              participant.currentHp = Math.max(0, Math.min(hp, participant.maxHp));
            }

            state.combatLog.push({
              id: crypto.randomUUID(),
              timestamp: new Date(),
              action: temp ? 'TEMP_HP_CHANGE' : 'HP_CHANGE',
              actor: participant.name,
              details: {
                from: oldHp,
                to: hp,
                difference: hp - oldHp,
              },
              round: state.round,
              turn: state.turn,
            });
          }),

        // ... other actions

        // Computed selectors
        getCurrentParticipant: () => {
          const state = get();
          return state.participants[state.turn] || null;
        },

        getInitiativeOrder: () => {
          const state = get();
          return [...state.participants].sort((a, b) => {
            // Sort by initiative (descending)
            if (b.initiative !== a.initiative) {
              return b.initiative - a.initiative;
            }
            // Tiebreaker: dexterity
            return (b.dexterity || 10) - (a.dexterity || 10);
          });
        },
      }))
    ),
    { name: 'combat-store' }
  )
);
```

### API Service Layer

```typescript
// services/api.ts
import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add request ID for tracking
    config.headers['X-Request-ID'] = crypto.randomUUID();
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        await api.post('/auth/refresh');
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Type-safe API client
export class ApiClient {
  static async get<T>(url: string, params?: any): Promise<T> {
    const response = await api.get<SuccessResponse<T>>(url, { params });
    return response.data.data;
  }

  static async post<T>(url: string, data?: any): Promise<T> {
    const response = await api.post<SuccessResponse<T>>(url, data);
    return response.data.data;
  }

  static async put<T>(url: string, data?: any): Promise<T> {
    const response = await api.put<SuccessResponse<T>>(url, data);
    return response.data.data;
  }

  static async delete<T>(url: string): Promise<T> {
    const response = await api.delete<SuccessResponse<T>>(url);
    return response.data.data;
  }
}
```

## 7. Authentication & Security

### Session-Based Authentication with Lucia

```typescript
// server/src/lib/auth.ts
import { Lucia, TimeSpan } from 'lucia';
import { PrismaAdapter } from '@lucia-auth/adapter-prisma';
import { prisma } from './prisma';
import { webcrypto } from 'node:crypto';

// Polyfill for Node.js
globalThis.crypto = webcrypto as Crypto;

export const lucia = new Lucia(new PrismaAdapter(prisma.session, prisma.user), {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    },
    name: 'dnd-tracker-session',
  },
  sessionExpiresIn: new TimeSpan(7, 'd'), // 7 days
  getUserAttributes: (attributes) => {
    return {
      id: attributes.id,
      username: attributes.username,
      email: attributes.email,
      subscriptionTier: attributes.subscription?.tier || 'FREE',
      isAdmin: attributes.isAdmin,
    };
  },
});

// Middleware
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const sessionId = lucia.readSessionCookie(req.headers.cookie ?? '');
  
  if (!sessionId) {
    req.user = null;
    req.session = null;
    return next();
  }

  try {
    const { session, user } = await lucia.validateSession(sessionId);
    
    if (session && session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      res.setHeader('Set-Cookie', sessionCookie.serialize());
    }
    
    if (!session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      res.setHeader('Set-Cookie', sessionCookie.serialize());
    }
    
    req.user = user;
    req.session = session;
    next();
  } catch (error) {
    req.user = null;
    req.session = null;
    next();
  }
}

// Protect routes
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  }
  next();
}
```

### Password Security with Argon2

```typescript
// server/src/lib/password.ts
import { hash, verify } from 'argon2';

export class PasswordService {
  static async hash(password: string): Promise<string> {
    return hash(password, {
      memoryCost: 19456, // 19 MiB
      timeCost: 2,
      parallelism: 1,
    });
  }

  static async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await verify(hash, password);
    } catch {
      return false;
    }
  }

  static validate(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
```

### Account Lockout

To prevent brute-force attacks, an account lockout mechanism will be implemented.

```typescript
// server/src/services/auth.service.ts (Conceptual)

// In the login method:
const user = await prisma.user.findUnique({ where: { email } });

if (user?.lockedUntil && user.lockedUntil > new Date()) {
  throw new Error('Account is locked. Please try again later.');
}

const isValidPassword = await PasswordService.verify(user.passwordHash, password);

if (!isValidPassword) {
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: {
        increment: 1,
      },
      // Lock account for 15 minutes after 5 failed attempts
      lockedUntil: user.failedLoginAttempts + 1 >= 5 
        ? new Date(Date.now() + 15 * 60 * 1000) 
        : null,
    },
  });
  throw new Error('Invalid credentials');
}

// On successful login, reset failed attempts
await prisma.user.update({
  where: { id: user.id },
  data: {
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: new Date(),
  },
});
```

### Advanced Rate Limiting

**Note:** For production environments, Redis is a **mandatory dependency**. The application must be configured to fail on startup if a connection to Redis cannot be established. The in-memory fallback is suitable only for local development.

```typescript
// server/src/middleware/rateLimiter.ts
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import { redis } from '../lib/redis';
import { logger } from '../lib/logger';

// At application startup
if (process.env.NODE_ENV === 'production' && !redis) {
  logger.error('Redis connection is not available. Application cannot start in production without Redis for rate limiting.');
  process.exit(1);
}

interface RateLimiterConfig {
  points: number;
  duration: number;
  blockDuration?: number;
  keyPrefix: string;
}

class RateLimiterService {
  private limiters: Map<string, RateLimiterRedis | RateLimiterMemory>;

  constructor() {
    this.limiters = new Map();
    this.initializeLimiters();
  }

  private initializeLimiters() {
    // Auth endpoints - strict limits
    this.createLimiter('auth', {
      points: 5,
      duration: 60,
      blockDuration: 900, // 15 minutes
      keyPrefix: 'rl:auth',
    });

    // General API - tier-based
    this.createLimiter('api:free', {
      points: 60,
      duration: 60,
      keyPrefix: 'rl:api:free',
    });

    this.createLimiter('api:seasoned', {
      points: 150,
      duration: 60,
      keyPrefix: 'rl:api:seasoned',
    });

    this.createLimiter('api:expert', {
      points: 300,
      duration: 60,
      keyPrefix: 'rl:api:expert',
    });

    this.createLimiter('api:master', {
      points: 600,
      duration: 60,
      keyPrefix: 'rl:api:master',
    });

    this.createLimiter('api:guild', {
      points: 1200,
      duration: 60,
      keyPrefix: 'rl:api:guild',
    });
  }

  private createLimiter(name: string, config: RateLimiterConfig) {
    const limiter = redis
      ? new RateLimiterRedis({
          storeClient: redis,
          ...config,
        })
      : new RateLimiterMemory(config);

    this.limiters.set(name, limiter);
  }

  async consume(key: string, limiterName: string, points = 1) {
    const limiter = this.limiters.get(limiterName);
    if (!limiter) throw new Error(`Limiter ${limiterName} not found`);

    return limiter.consume(key, points);
  }

  middleware(limiterName: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Use IP for auth endpoints
        if (limiterName === 'auth') {
          const key = req.ip || 'unknown';
          await this.consume(key, limiterName);
          return next();
        }

        // Use user tier for API endpoints
        if (req.user) {
          const tier = req.user.subscriptionTier.toLowerCase();
          const tierLimiter = `api:${tier}`;
          await this.consume(req.user.id, tierLimiter);
          return next();
        }

        // Fallback to IP-based limiting for unauthenticated requests
        const key = req.ip || 'unknown';
        await this.consume(key, 'api:free');
        next();
      } catch (rejRes) {
        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests',
            retryAfter: Math.round(rejRes.msBeforeNext / 1000) || 60,
          },
        });
      }
    };
  }
}

export const rateLimiter = new RateLimiterService();
```

## 8. Real-time Features

### Server-Sent Events Implementation

```typescript
// server/src/controllers/sse.controller.ts
import { Request, Response } from 'express';
import { redis } from '../lib/redis';
import { EventEmitter } from 'events';

class SSEManager extends EventEmitter {
  private connections: Map<string, Set<Response>> = new Map();

  addConnection(encounterId: string, res: Response) {
    if (!this.connections.has(encounterId)) {
      this.connections.set(encounterId, new Set());
    }
    this.connections.get(encounterId)!.add(res);

    // Clean up on disconnect
    res.on('close', () => {
      this.removeConnection(encounterId, res);
    });
  }

  removeConnection(encounterId: string, res: Response) {
    const connections = this.connections.get(encounterId);
    if (connections) {
      connections.delete(res);
      if (connections.size === 0) {
        this.connections.delete(encounterId);
      }
    }
  }

  broadcast(encounterId: string, event: string, data: any) {
    const connections = this.connections.get(encounterId);
    if (!connections) return;

    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

    connections.forEach((res) => {
      res.write(message);
    });
  }
}

export const sseManager = new SSEManager();

export class SSEController {
  static async stream(req: Request, res: Response) {
    const { encounterId } = req.params;
    const userId = req.user!.id;

    // Verify access
    const encounter = await prisma.encounter.findFirst({
      where: { id: encounterId, userId },
    });

    if (!encounter) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Encounter not found' },
      });
    }

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
    });

    // Send initial connection event
    res.write(`event: connected\ndata: {"encounterId":"${encounterId}"}\n\n`);

    // Add to connections
    sseManager.addConnection(encounterId, res);

    // Set up Redis subscription for this encounter
    const subscriber = redis.duplicate();
    await subscriber.connect();

    const channel = `encounter:${encounterId}`;
    await subscriber.subscribe(channel, (message) => {
      res.write(`event: update\ndata: ${message}\n\n`);
    });

    // Heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      res.write(':heartbeat\n\n');
    }, 30000);

    // Cleanup on disconnect
    res.on('close', () => {
      clearInterval(heartbeat);
      subscriber.unsubscribe(channel);
      subscriber.disconnect();
    });
  }

  static async publishUpdate(
    encounterId: string,
    event: string,
    data: any
  ) {
    const channel = `encounter:${encounterId}`;
    await redis.publish(channel, JSON.stringify({ event, data }));
  }
}
```

### Client-Side SSE Hook

```typescript
// client/src/hooks/useSSE.ts
import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface SSEOptions {
  onMessage?: (event: MessageEvent) => void;
  onError?: (error: Event) => void;
  onOpen?: (event: Event) => void;
  events?: Record<string, (data: any) => void>;
}

export function useSSE(url: string, options: SSEOptions = {}) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (eventSourceRef.current) return;

    const eventSource = new EventSource(url, {
      withCredentials: true,
    });

    eventSource.onopen = (event) => {
      console.log('SSE connected:', url);
      reconnectAttemptsRef.current = 0;
      options.onOpen?.(event);
    };

    eventSource.onmessage = (event) => {
      options.onMessage?.(event);
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      options.onError?.(error);

      // Reconnect with exponential backoff
      eventSource.close();
      eventSourceRef.current = null;

      const backoff = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      reconnectAttemptsRef.current++;

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, backoff);
    };

    // Register custom event handlers
    if (options.events) {
      Object.entries(options.events).forEach(([event, handler]) => {
        eventSource.addEventListener(event, (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            handler(data);
          } catch (error) {
            console.error('Failed to parse SSE data:', error);
          }
        });
      });
    }

    eventSourceRef.current = eventSource;
  }, [url, options]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return {
    isConnected: eventSourceRef.current?.readyState === EventSource.OPEN,
    reconnect: connect,
    disconnect,
  };
}

// Usage in component
function EncounterView({ encounterId }: { encounterId: string }) {
  const { updateParticipantHP, addCondition } = useCombatStore();

  useSSE(`/api/v1/encounters/${encounterId}/stream`, {
    events: {
      'hp-update': (data) => {
        updateParticipantHP(data.participantId, data.hp);
      },
      'condition-add': (data) => {
        addCondition(data.participantId, data.condition);
      },
      'turn-change': (data) => {
        useCombatStore.setState({ turn: data.turn, round: data.round });
      },
    },
  });

  // Component render...
}
```

## 9. Subscription & Payment System

### Stripe Integration

```typescript
// server/src/services/subscription.service.ts
import Stripe from 'stripe';
import { prisma } from '../lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export class SubscriptionService {
  // Price IDs from Stripe Dashboard
  private static PRICE_IDS = {
    SEASONED: process.env.STRIPE_PRICE_SEASONED!,
    EXPERT: process.env.STRIPE_PRICE_EXPERT!,
    MASTER: process.env.STRIPE_PRICE_MASTER!,
    GUILD: process.env.STRIPE_PRICE_GUILD!,
  };

  static async createCheckoutSession(
    userId: string,
    tier: keyof typeof SubscriptionService.PRICE_IDS
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) throw new Error('User not found');

    // Create or get Stripe customer
    let customerId = user.subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId },
      });
      customerId = customer.id;

      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          stripeCustomerId: customerId,
          tier: 'FREE',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(),
        },
        update: {
          stripeCustomerId: customerId,
        },
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: this.PRICE_IDS[tier],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: `${process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/subscription/plans`,
      metadata: {
        userId,
        tier,
      },
    });

    return session;
  }

  static async handleWebhook(event: Stripe.Event) {
    // Ensure webhook idempotency
    const processedEvent = await prisma.processedEvent.findUnique({
      where: { eventId: event.id },
    });

    if (processedEvent) {
      logger.info(`Webhook event ${event.id} already processed.`);
      return;
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutComplete(event.data.object);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionCanceled(event.data.object);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
    }

    // Mark event as processed
    await prisma.processedEvent.create({
      data: {
        eventId: event.id,
        source: 'stripe',
      },
    });
  }

  private static async handleCheckoutComplete(
    session: Stripe.Checkout.Session
  ) {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    const userId = session.metadata?.userId;
    const tier = session.metadata?.tier;

    if (!userId || !tier) return;

    await prisma.subscription.update({
      where: { userId },
      data: {
        tier: tier as any,
        status: 'ACTIVE',
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    // Reset usage for new billing period
    await prisma.usage.update({
      where: { userId },
      data: {
        partiesCreated: 0,
        encountersCreated: 0,
        creaturesCreated: 0,
        currentPeriodStart: new Date(),
        lastResetDate: new Date(),
      },
    });
  }

  static async createPortalSession(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user?.subscription?.stripeCustomerId) {
      throw new Error('No subscription found');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.subscription.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL}/subscription`,
    });

    return session;
  }
}
```

### Feature Gating Middleware

```typescript
// server/src/middleware/subscription.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

interface TierLimits {
  parties: number;
  encounters: number;
  creatures: number;
  maxParticipants: number;
  features: string[];
}

const TIER_LIMITS: Record<string, TierLimits> = {
  FREE: {
    parties: 1,
    encounters: 3,
    creatures: 10,
    maxParticipants: 6,
    features: ['basic_combat'],
  },
  SEASONED: {
    parties: 3,
    encounters: 15,
    creatures: 50,
    maxParticipants: 10,
    features: ['basic_combat', 'cloud_sync', 'combat_log', 'export'],
  },
  EXPERT: {
    parties: 10,
    encounters: 50,
    creatures: 200,
    maxParticipants: 20,
    features: [
      'basic_combat',
      'cloud_sync',
      'combat_log',
      'export',
      'custom_themes',
      'collaboration',
    ],
  },
  MASTER: {
    parties: 25,
    encounters: 100,
    creatures: 500,
    maxParticipants: 30,
    features: [
      'basic_combat',
      'cloud_sync',
      'combat_log',
      'export',
      'custom_themes',
      'collaboration',
      'analytics',
      'api_access',
    ],
  },
  GUILD: {
    parties: Infinity,
    encounters: Infinity,
    creatures: Infinity,
    maxParticipants: 50,
    features: ['all'],
  },
};

export function requireFeature(feature: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    const tier = user?.subscription?.tier || 'FREE';
    const limits = TIER_LIMITS[tier];

    if (
      !limits.features.includes(feature) &&
      !limits.features.includes('all')
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FEATURE_UNAVAILABLE',
          message: `This feature requires a higher subscription tier`,
          details: { requiredFeature: feature, currentTier: tier },
        },
      });
    }

    next();
  };
}

export function checkUsageLimit(resource: 'parties' | 'encounters' | 'creatures') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;

    const [user, usage] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      }),
      prisma.usage.findUnique({ where: { userId } }),
    ]);

    const tier = user?.subscription?.tier || 'FREE';
    const limits = TIER_LIMITS[tier];
    const currentUsage = usage?.[`${resource}Created`] || 0;

    if (currentUsage >= limits[resource]) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'USAGE_LIMIT_EXCEEDED',
          message: `You've reached the limit for ${resource}`,
          details: {
            limit: limits[resource],
            current: currentUsage,
            tier,
          },
        },
      });
    }

    // Attach limits to request for reference
    req.tierLimits = limits;
    next();
  };
}
```

## 10. Performance & Scalability

### Multi-Layer Caching Strategy

```typescript
// server/src/lib/cache.ts
import { redis } from './redis';
import { LRUCache } from 'lru-cache';

export class CacheService {
  private memoryCache: LRUCache<string, any>;
  private readonly DEFAULT_TTL = 300; // 5 minutes

  constructor() {
    this.memoryCache = new LRUCache({
      max: 500,
      ttl: 1000 * 60 * 5, // 5 minutes
      updateAgeOnGet: true,
      updateAgeOnHas: true,
    });
  }

  // Get with cache-aside pattern
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    // Check memory cache first
    const memCached = this.memoryCache.get(key);
    if (memCached !== undefined) {
      return memCached as T;
    }

    // Check Redis cache
    if (redis) {
      const redisCached = await redis.get(key);
      if (redisCached) {
        const parsed = JSON.parse(redisCached);
        this.memoryCache.set(key, parsed);
        return parsed as T;
      }
    }

    // Fetch fresh data
    const data = await fetcher();

    // Cache in both layers
    await this.set(key, data, ttl);

    return data;
  }

  async set(key: string, value: any, ttl: number = this.DEFAULT_TTL) {
    // Set in memory cache
    this.memoryCache.set(key, value);

    // Set in Redis if available
    if (redis) {
      await redis.setex(key, ttl, JSON.stringify(value));
    }
  }

  async invalidate(pattern: string) {
    // Clear from memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear from Redis
    if (redis) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
  }

  // Cache decorators
  static cacheable(ttl: number = 300) {
    return function (
      target: any,
      propertyName: string,
      descriptor: PropertyDescriptor
    ) {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const cache = new CacheService();
        const key = `${target.constructor.name}:${propertyName}:${JSON.stringify(
          args
        )}`;

        return cache.get(key, () => originalMethod.apply(this, args), ttl);
      };

      return descriptor;
    };
  }
}

// Usage in repository
export class PartyRepository {
  @CacheService.cacheable(600) // Cache for 10 minutes
  async findByUserId(userId: string) {
    return prisma.party.findMany({
      where: { userId, isArchived: false },
      include: {
        characters: true,
        _count: {
          select: { characters: true },
        },
      },
    });
  }
}
```

### Database Query Optimization

```typescript
// server/src/repositories/encounter.repository.ts
export class EncounterRepository {
  // Optimized encounter query with selective loading
  async findDetailedById(id: string, userId: string) {
    return prisma.encounter.findFirst({
      where: { id, userId },
      include: {
        participants: {
          include: {
            character: {
              select: {
                id: true,
                name: true,
                playerName: true,
                ac: true,
                abilities: true,
              },
            },
            creature: {
              select: {
                id: true,
                name: true,
                ac: true,
                abilities: true,
                legendaryActions: true,
              },
            },
          },
          orderBy: { initiative: 'desc' },
        },
        lairActions: true,
        _count: {
          select: { combatLogs: true },
        },
      },
    });
  }

  // Cursor-based pagination for encounters
  async findPaginated(
    userId: string,
    cursor?: string,
    limit: number = 20
  ) {
    const encounters = await prisma.encounter.findMany({
      where: { userId },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { participants: true },
        },
      },
    });

    const hasMore = encounters.length > limit;
    const items = hasMore ? encounters.slice(0, -1) : encounters;

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
      hasMore,
    };
  }

  // Aggregation for dashboard stats
  async getUserStats(userId: string) {
    const [partyCount, encounterStats, recentActivity] = await Promise.all([
      prisma.party.count({
        where: { userId, isArchived: false },
      }),
      prisma.encounter.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      }),
      prisma.encounter.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          status: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      parties: partyCount,
      encounters: encounterStats,
      recentActivity,
    };
  }
}
```

### Performance Monitoring

```typescript
// server/src/lib/monitoring.ts
import { performance } from 'perf_hooks';
import { StatsD } from 'hot-shots';
import pino from 'pino';

const dogstatsd = new StatsD({
  host: process.env.STATSD_HOST || 'localhost',
  port: 8125,
  prefix: 'dnd_tracker.',
  errorHandler: (error) => {
    console.error('StatsD error:', error);
  },
});

export class PerformanceMonitor {
  private static timers = new Map<string, number>();

  static startTimer(label: string): string {
    const id = `${label}:${Date.now()}:${Math.random()}`;
    this.timers.set(id, performance.now());
    return id;
  }

  static endTimer(id: string, tags: Record<string, string> = {}) {
    const start = this.timers.get(id);
    if (!start) return;

    const duration = performance.now() - start;
    this.timers.delete(id);

    const [label] = id.split(':');
    
    dogstatsd.timing(`operation.duration`, duration, {
      operation: label,
      ...tags,
    });

    if (duration > 1000) {
      logger.warn({
        msg: 'Slow operation detected',
        operation: label,
        duration,
        tags,
      });
    }

    return duration;
  }

  static recordMetric(
    metric: string,
    value: number,
    tags: Record<string, string> = {}
  ) {
    dogstatsd.gauge(metric, value, tags);
  }

  static increment(
    metric: string,
    tags: Record<string, string> = {}
  ) {
    dogstatsd.increment(metric, tags);
  }

  // Express middleware
  static middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const start = performance.now();
      const timer = this.startTimer('http.request');

      // Monkey-patch res.end to capture response
      const originalEnd = res.end;
      res.end = function (...args: any[]) {
        const duration = performance.now() - start;
        
        PerformanceMonitor.endTimer(timer, {
          method: req.method,
          route: req.route?.path || 'unknown',
          status: res.statusCode.toString(),
        });

        // Log slow requests
        if (duration > 500) {
          req.log.warn({
            msg: 'Slow request',
            duration,
            method: req.method,
            url: req.url,
            route: req.route?.path,
          });
        }

        originalEnd.apply(res, args);
      };

      next();
    };
  }
}

// Usage in services
export class EncounterService {
  async startCombat(encounterId: string, userId: string) {
    const timer = PerformanceMonitor.startTimer('encounter.startCombat');
    
    try {
      // Business logic here
      const result = await this.encounterRepository.startCombat(encounterId, userId);
      
      PerformanceMonitor.increment('combat.started', {
        userId,
        tier: req.user.subscriptionTier,
      });
      
      return result;
    } finally {
      PerformanceMonitor.endTimer(timer);
    }
  }
}
```

## 11. Testing Strategy

### Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── services/
│   ├── repositories/
│   ├── utils/
│   └── middleware/
├── integration/             # Integration tests
│   ├── api/
│   ├── auth/
│   └── subscriptions/
├── e2e/                     # End-to-end tests
│   ├── auth.spec.ts
│   ├── combat.spec.ts
│   └── subscription.spec.ts
├── fixtures/                # Test data
├── mocks/                   # Mock implementations
└── setup/                   # Test configuration
```

### Unit Testing with Vitest

```typescript
// tests/unit/services/combat.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CombatService } from '@/services/combat.service';
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('CombatService', () => {
  let combatService: CombatService;
  let prismaMock: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prismaMock = mockDeep<PrismaClient>();
    combatService = new CombatService(prismaMock);
  });

  describe('updateParticipantHP', () => {
    it('should update participant HP correctly', async () => {
      const participantId = 'test-participant-id';
      const newHp = 25;
      const maxHp = 50;

      prismaMock.participant.findUnique.mockResolvedValue({
        id: participantId,
        currentHp: 30,
        maxHp,
        tempHp: 0,
      } as any);

      prismaMock.participant.update.mockResolvedValue({
        id: participantId,
        currentHp: newHp,
        maxHp,
      } as any);

      const result = await combatService.updateParticipantHP(
        participantId,
        newHp
      );

      expect(result.currentHp).toBe(newHp);
      expect(prismaMock.participant.update).toHaveBeenCalledWith({
        where: { id: participantId },
        data: { currentHp: newHp },
      });
    });

    it('should not allow HP to exceed max HP', async () => {
      const participantId = 'test-participant-id';
      const maxHp = 50;

      prismaMock.participant.findUnique.mockResolvedValue({
        id: participantId,
        currentHp: 30,
        maxHp,
      } as any);

      await combatService.updateParticipantHP(participantId, 100);

      expect(prismaMock.participant.update).toHaveBeenCalledWith({
        where: { id: participantId },
        data: { currentHp: maxHp },
      });
    });

    it('should not allow negative HP', async () => {
      const participantId = 'test-participant-id';

      prismaMock.participant.findUnique.mockResolvedValue({
        id: participantId,
        currentHp: 10,
        maxHp: 50,
      } as any);

      await combatService.updateParticipantHP(participantId, -5);

      expect(prismaMock.participant.update).toHaveBeenCalledWith({
        where: { id: participantId },
        data: { currentHp: 0 },
      });
    });
  });
});
```

### Integration Testing

```typescript
// tests/integration/api/encounters.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { lucia } from '@/lib/auth';
import { testHelpers } from '../helpers';

describe('Encounters API', () => {
  let authCookie: string;
  let testUser: any;
  let testParty: any;

  beforeAll(async () => {
    await testHelpers.cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Create test user and authenticate
    testUser = await testHelpers.createUser({
      email: 'test@example.com',
      username: 'testuser',
    });

    const session = await lucia.createSession(testUser.id, {});
    authCookie = lucia.createSessionCookie(session.id).serialize();

    // Create test party
    testParty = await testHelpers.createParty(testUser.id, {
      name: 'Test Party',
      characters: [
        {
          name: 'Fighter',
          ac: 18,
          maxHp: 50,
          currentHp: 50,
        },
      ],
    });
  });

  describe('POST /api/v1/encounters', () => {
    it('should create a new encounter', async () => {
      const response = await request(app)
        .post('/api/v1/encounters')
        .set('Cookie', authCookie)
        .send({
          name: 'Goblin Ambush',
          description: 'A group of goblins attacks!',
          participants: [
            {
              type: 'CHARACTER',
              characterId: testParty.characters[0].id,
            },
            {
              type: 'CREATURE',
              name: 'Goblin',
              ac: 15,
              maxHp: 7,
              currentHp: 7,
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: 'Goblin Ambush',
        status: 'PLANNING',
        participants: expect.arrayContaining([
          expect.objectContaining({ name: 'Fighter' }),
          expect.objectContaining({ name: 'Goblin' }),
        ]),
      });
    });

    it('should enforce participant limits based on tier', async () => {
      // Update user to free tier with limit of 6 participants
      await prisma.subscription.update({
        where: { userId: testUser.id },
        data: { tier: 'FREE' },
      });

      const participants = Array(7)
        .fill(null)
        .map((_, i) => ({
          type: 'CREATURE',
          name: `Goblin ${i + 1}`,
          ac: 15,
          maxHp: 7,
          currentHp: 7,
        }));

      const response = await request(app)
        .post('/api/v1/encounters')
        .set('Cookie', authCookie)
        .send({
          name: 'Large Battle',
          participants,
        });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('PARTICIPANT_LIMIT_EXCEEDED');
    });
  });

  describe('GET /api/v1/encounters/:id/stream', () => {
    it('should establish SSE connection', async (done) => {
      const encounter = await testHelpers.createEncounter(testUser.id, {
        name: 'SSE Test',
      });

      const eventSource = new EventSource(
        `http://localhost:3001/api/v1/encounters/${encounter.id}/stream`,
        {
          headers: {
            Cookie: authCookie,
          },
        }
      );

      eventSource.addEventListener('connected', (event) => {
        const data = JSON.parse(event.data);
        expect(data.encounterId).toBe(encounter.id);
        eventSource.close();
        done();
      });

      eventSource.onerror = (error) => {
        eventSource.close();
        done(error);
      };
    });
  });
});
```

### E2E Testing with Playwright

```typescript
// tests/e2e/combat.spec.ts
import { test, expect } from '@playwright/test';
import { testHelpers } from './helpers';

test.describe('Combat Tracker E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated user
    await testHelpers.authenticateUser(page, {
      email: 'e2e@example.com',
      username: 'e2euser',
    });
  });

  test('complete combat workflow', async ({ page }) => {
    // Create encounter
    await page.goto('/encounters/new');
    await page.fill('[data-testid="encounter-name"]', 'Dragon Fight');
    
    // Add party members
    await page.click('[data-testid="add-party"]');
    await page.click('[data-testid="party-member-1"]');
    await page.click('[data-testid="party-member-2"]');
    
    // Add creatures
    await page.click('[data-testid="add-creature"]');
    await page.fill('[data-testid="creature-search"]', 'Dragon');
    await page.click('[data-testid="creature-adult-red-dragon"]');
    
    // Save encounter
    await page.click('[data-testid="save-encounter"]');
    await expect(page).toHaveURL(/\/encounters\/[\w-]+$/);
    
    // Start combat
    await page.click('[data-testid="start-combat"]');
    await expect(page.locator('[data-testid="combat-status"]')).toContainText(
      'Combat Active'
    );
    
    // Roll initiative
    await page.click('[data-testid="roll-all-initiative"]');
    await page.waitForSelector('[data-testid="initiative-order"]');
    
    // Verify initiative order is displayed
    const initiativeOrder = page.locator('[data-testid="initiative-list"] li');
    await expect(initiativeOrder).toHaveCount(3);
    
    // Deal damage to first participant
    const firstParticipant = initiativeOrder.first();
    await firstParticipant.locator('[data-testid="damage-btn"]').click();
    
    const damageDialog = page.locator('[data-testid="damage-dialog"]');
    await damageDialog.locator('input').fill('25');
    await damageDialog.locator('button[type="submit"]').click();
    
    // Verify HP updated
    await expect(
      firstParticipant.locator('[data-testid="hp-display"]')
    ).toContainText(/\d+\/\d+/);
    
    // Add condition
    await firstParticipant.locator('[data-testid="add-condition"]').click();
    await page.selectOption('[data-testid="condition-select"]', 'frightened');
    await page.click('[data-testid="apply-condition"]');
    
    // Verify condition appears
    await expect(
      firstParticipant.locator('[data-testid="conditions"]')
    ).toContainText('Frightened');
    
    // Next turn
    await page.click('[data-testid="next-turn"]');
    await expect(page.locator('[data-testid="current-turn"]')).toContainText(
      'Turn 2'
    );
    
    // End combat
    await page.click('[data-testid="end-combat"]');
    await expect(page.locator('[data-testid="combat-status"]')).toContainText(
      'Combat Ended'
    );
  });

  test('handles offline mode gracefully', async ({ page, context }) => {
    // Navigate to encounter
    await page.goto('/encounters/test-encounter');
    
    // Go offline
    await context.setOffline(true);
    
    // Try to update HP
    await page.click('[data-testid="participant-1"] [data-testid="damage-btn"]');
    await page.fill('[data-testid="damage-input"]', '10');
    await page.click('[data-testid="apply-damage"]');
    
    // Should show offline indicator
    await expect(page.locator('[data-testid="offline-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="offline-banner"]')).toContainText(
      'Working offline'
    );
    
    // Changes should be queued
    await expect(
      page.locator('[data-testid="sync-status"]')
    ).toContainText('1 change pending');
    
    // Go back online
    await context.setOffline(false);
    
    // Should sync automatically
    await expect(page.locator('[data-testid="sync-status"]')).toContainText(
      'Synced',
      { timeout: 10000 }
    );
    
    // Offline banner should disappear
    await expect(
      page.locator('[data-testid="offline-banner"]')
    ).not.toBeVisible();
  });
});
```

## 12. Deployment & DevOps

### Database Seeding

To ensure the application is valuable upon first launch, a database seeding mechanism will be implemented to pre-populate essential data, such as system-wide creature templates.

- **Script Location:** `packages/server/prisma/seed.ts`
- **Execution:** The script will be executed via a dedicated npm script (e.g., `npm run db:seed`) and integrated into the CI/CD pipeline to run after migrations during deployment.
- **Logic:** The script will upsert a predefined list of creatures into the `Creature` table where the `userId` is `null`, marking them as system templates.

```typescript
// packages/server/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const creatureTemplates = [
  { name: 'Goblin', ac: 15, hp: 7, ... },
  { name: 'Orc', ac: 13, hp: 15, ... },
  // ... more creatures
];

async function main() {
  console.log(`Start seeding ...`);
  for (const creature of creatureTemplates) {
    await prisma.creature.upsert({
      where: { name: creature.name }, // Assuming name is unique for templates
      update: creature,
      create: { ...creature, isTemplate: true, userId: null },
    });
  }
  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## 13. Monitoring & Observability

### Comprehensive Monitoring Setup

```typescript
// server/src/lib/monitoring/index.ts
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { StatsD } from 'hot-shots';
import pino from 'pino';
import { performance } from 'perf_hooks';

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new ProfilingIntegration(),
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({
      app,
      router: true,
      methods: ['all'],
    }),
    new Sentry.Integrations.Prisma({ client: prisma }),
  ],
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: 0.1,
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    if (event.extra?.req?.headers?.authorization) {
      delete event.extra.req.headers.authorization;
    }
    return event;
  },
});

// StatsD client
export const metrics = new StatsD({
  host: process.env.STATSD_HOST || 'localhost',
  port: 8125,
  prefix: 'dnd_tracker.',
  globalTags: {
    env: process.env.NODE_ENV || 'development',
    service: 'api',
  },
});

// Structured logger
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      query: req.query,
      userId: req.user?.id,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
});

// Custom monitoring class
export class Monitor {
  static transaction(name: string, operation: string) {
    return Sentry.startTransaction({
      op: operation,
      name,
    });
  }

  static captureException(error: Error, context?: any) {
    logger.error({ err: error, context }, 'Exception captured');
    Sentry.captureException(error, { extra: context });
  }

  static captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
    logger[level]({ msg: message });
    Sentry.captureMessage(message, level);
  }

  static setUser(user: { id: string; email: string; username: string }) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  }

  static clearUser() {
    Sentry.setUser(null);
  }

  // Business metrics
  static recordSubscriptionChange(
    userId: string,
    fromTier: string,
    toTier: string
  ) {
    metrics.increment('subscription.change', {
      from: fromTier,
      to: toTier,
    });

    if (fromTier === 'FREE' && toTier !== 'FREE') {
      metrics.increment('subscription.conversion');
    } else if (fromTier !== 'FREE' && toTier === 'FREE') {
      metrics.increment('subscription.churn');
    }
  }

  static recordFeatureUsage(feature: string, userId: string, tier: string) {
    metrics.increment('feature.usage', {
      feature,
      tier,
    });
  }

  static recordApiLatency(
    endpoint: string,
    method: string,
    duration: number,
    status: number
  ) {
    metrics.timing('api.latency', duration, {
      endpoint,
      method,
      status: status.toString(),
    });

    if (duration > 1000) {
      this.captureMessage(
        `Slow API response: ${method} ${endpoint} took ${duration}ms`,
        'warning'
      );
    }
  }
}

// Express error handler with monitoring
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const errorId = crypto.randomUUID();

  // Log error
  logger.error({
    err,
    errorId,
    req: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: req.query,
      body: req.body,
    },
  });

  // Send to Sentry
  Sentry.withScope((scope) => {
    scope.setTag('errorId', errorId);
    scope.setContext('request', {
      method: req.method,
      url: req.url,
      userId: req.user?.id,
    });
    Sentry.captureException(err);
  });

  // Record metric
  metrics.increment('error.count', {
    type: err.constructor.name,
    endpoint: req.route?.path || 'unknown',
  });

  // Send response
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      id: errorId,
      code: err.code || 'INTERNAL_ERROR',
      message:
        process.env.NODE_ENV === 'production'
          ? 'An error occurred'
          : err.message,
    },
  });
}
```

### Health Check Endpoint

```typescript
// server/src/routes/health.ts
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { logger } from '../lib/monitoring';

const router = Router();

router.get('/health', async (req, res) => {
  const checks = {
    api: 'ok',
    database: 'unknown',
    redis: 'unknown',
    timestamp: new Date().toISOString(),
  };

  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch (error) {
    checks.database = 'error';
    logger.error({ err: error }, 'Database health check failed');
  }

  try {
    // Check Redis
    await redis.ping();
    checks.redis = 'ok';
  } catch (error) {
    checks.redis = 'error';
    logger.error({ err: error }, 'Redis health check failed');
  }

  const isHealthy = Object.values(checks).every((status) =>
    ['ok', 'unknown'].includes(status as string)
  );

  res.status(isHealthy ? 200 : 503).json(checks);
});

router.get('/health/detailed', requireAuth, requireAdmin, async (req, res) => {
  const [dbStats, redisInfo, processInfo] = await Promise.all([
    prisma.$metrics.json(),
    redis.info(),
    {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      versions: process.versions,
    },
  ]);

  res.json({
    database: dbStats,
    redis: redisInfo,
    process: processInfo,
    timestamp: new Date().toISOString(),
  });
});

export default router;
```

## 14. Progressive Web App Features

### Service Worker Implementation

```typescript
// client/src/sw.ts
/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import {
  NetworkFirst,
  StaleWhileRevalidate,
  CacheFirst,
} from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { Queue } from 'workbox-background-sync';

declare const self: ServiceWorkerGlobalScope;

// Precache all static assets
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Cache strategies
const apiCacheStrategy = new NetworkFirst({
  cacheName: 'api-cache',
  networkTimeoutSeconds: 5,
  plugins: [
    new ExpirationPlugin({
      maxEntries: 50,
      maxAgeSeconds: 5 * 60, // 5 minutes
      purgeOnQuotaError: true,
    }),
  ],
});

const staticResourceStrategy = new CacheFirst({
  cacheName: 'static-resources',
  plugins: [
    new ExpirationPlugin({
      maxEntries: 60,
      maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
    }),
  ],
});

// API caching with offline support
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/v1/'),
  apiCacheStrategy
);

// Static resources
registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image',
  staticResourceStrategy
);

// Offline fallback
const navigationRoute = new NavigationRoute(async (params) => {
  try {
    return await apiCacheStrategy.handle(params);
  } catch (error) {
    return caches.match('/offline.html') || Response.error();
  }
});

registerRoute(navigationRoute);

// Background sync for combat actions
const combatQueue = new Queue('combat-actions', {
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request);
      } catch (error) {
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

// Offline combat action handling
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/v1/combat/')) {
    const bgSyncLogic = async () => {
      try {
        const response = await fetch(event.request.clone());
        return response;
      } catch (error) {
        await combatQueue.pushRequest({ request: event.request });
        return new Response(
          JSON.stringify({
            success: true,
            offline: true,
            message: 'Action queued for sync',
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    };

    event.respondWith(bgSyncLogic());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});

// Periodic background sync for usage stats
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-usage') {
    event.waitUntil(syncUsageStats());
  }
});

async function syncUsageStats() {
  try {
    const cache = await caches.open('usage-stats');
    const requests = await cache.keys();
    
    for (const request of requests) {
      await fetch(request);
      await cache.delete(request);
    }
  } catch (error) {
    console.error('Failed to sync usage stats:', error);
  }
}
```

### PWA Manifest

```json
{
  "name": "D&D Encounter Tracker",
  "short_name": "D&D Tracker",
  "description": "Manage your D&D encounters with ease",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1e293b",
  "background_color": "#0f172a",
  "orientation": "any",
  "icons": [
    {
      "src": "/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshot-1.png",
      "sizes": "1280x720",
      "type": "image/png",
      "label": "Combat Tracker in action"
    },
    {
      "src": "/screenshot-2.png",
      "sizes": "1280x720",
      "type": "image/png",
      "label": "Party management"
    }
  ],
  "categories": ["games", "productivity"],
  "shortcuts": [
    {
      "name": "New Encounter",
      "url": "/encounters/new",
      "description": "Create a new encounter"
    },
    {
      "name": "Active Encounters",
      "url": "/encounters?status=active",
      "description": "View active encounters"
    }
  ]
}
```

## Key Technical Advantages

This modern Express/React architecture provides several advantages over a Next.js approach:

1. **Authentication Control**: Complete control over session management without framework limitations
2. **Debugging Clarity**: Explicit middleware chain makes authentication issues easier to trace
3. **Performance Optimization**: Multi-layer caching and database query optimization
4. **Real-time Flexibility**: SSE implementation that's lighter than WebSockets
5. **Progressive Enhancement**: Full PWA support with offline capabilities
6. **Testing Confidence**: Comprehensive testing at all levels
7. **Deployment Options**: Can deploy anywhere without vendor lock-in
8. **Security First**: Modern session management with Lucia Auth
9. **Monitoring Excellence**: Deep observability into application behavior
10. **Developer Experience**: Type safety throughout with modern tooling

This architecture is production-ready and provides a robust foundation for the D&D Encounter Tracker while avoiding the authentication complexities that plague many Next.js applications.
