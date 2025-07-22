# Technical Design Document V2: D&D Encounter Tracker
**Version:** 3.0  
**Date:** January 2025  
**Stack:** Next.js 14, tRPC, Prisma, MongoDB, Edge Runtime

## 1. Introduction

This document outlines the modern technical design for the D&D Encounter Tracker, a web application built with cutting-edge technologies for optimal performance, developer experience, and rapid iteration. The application leverages edge computing, type-safe APIs, and modern patterns for scalability.

## 2. Architecture Overview

### Core Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js 14    │    │  tRPC API       │    │    Database     │
│  (App Router)   │◄──►│ (Edge Runtime)  │◄──►│ MongoDB/Neon    │
│   Vercel Edge   │    │  Type-Safe      │    │  Edge-Ready     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                      │                       │
         └──────────────────────┴───────────────────────┘
                         Turborepo Monorepo
```

### Monorepo Structure (Turborepo)
```
dnd-tracker/
├── apps/
│   ├── web/                 # Next.js 14 app
│   ├── api/                 # Standalone API (if needed)
│   └── admin/               # Admin dashboard
├── packages/
│   ├── ui/                  # Shared UI components (Shadcn/UI)
│   ├── database/            # Prisma schemas & client
│   ├── api/                 # tRPC routers & procedures
│   ├── auth/                # Authentication logic
│   └── shared/              # Shared types & utilities
├── turbo.json               # Turborepo config
└── package.json             # Workspace config
```

## 3. Modern Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **UI Library**: Shadcn/UI + Radix UI primitives
- **Styling**: Tailwind CSS v4 + CSS Variables
- **State Management**: Zustand + TanStack Query v5
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion
- **Real-time**: PartyKit or Liveblocks

### Backend
- **API**: tRPC v11 for type-safe APIs
- **Runtime**: Edge Runtime (Vercel/Cloudflare)
- **Database**: Prisma ORM with MongoDB/Neon
- **Authentication**: Clerk or NextAuth v5
- **File Storage**: UploadThing or Vercel Blob
- **Queue/Jobs**: Inngest or Trigger.dev
- **Payments**: Stripe with pre-built checkout

### Infrastructure
- **Hosting**: Vercel (primary) / Cloudflare Pages
- **Database**: MongoDB Atlas / Neon (PostgreSQL)
- **Caching**: Upstash Redis (edge-compatible)
- **CDN**: Vercel Edge Network / Cloudflare
- **Monitoring**: Axiom + Sentry + PostHog
- **CI/CD**: GitHub Actions + Vercel
- **IaC**: Pulumi (TypeScript-based)

## 4. Database Design (Prisma Schema)

```prisma
// schema.prisma
datasource db {
  provider = "mongodb" // or "postgresql" for Neon
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

model User {
  id            String    @id @default(auto()) @map("_id") @db.ObjectId
  clerkId       String    @unique
  email         String    @unique
  username      String    @unique
  tier          Tier      @default(FREE)
  
  parties       Party[]
  encounters    Encounter[]
  creatures     Creature[]
  subscription  Subscription?
  usage         Usage?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([clerkId])
  @@index([email])
}

enum Tier {
  FREE
  SEASONED
  EXPERT
  MASTER
  GUILD
}

model Subscription {
  id             String    @id @default(auto()) @map("_id") @db.ObjectId
  userId         String    @unique @db.ObjectId
  user           User      @relation(fields: [userId], references: [id])
  
  stripeCustomerId    String?   @unique
  stripeSubscriptionId String?  @unique
  stripePriceId       String?
  
  status         SubscriptionStatus @default(TRIAL)
  currentPeriodEnd DateTime?
  cancelAtPeriodEnd Boolean @default(false)
  
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}

enum SubscriptionStatus {
  TRIAL
  ACTIVE
  PAST_DUE
  CANCELED
  PAUSED
}

model Party {
  id          String    @id @default(auto()) @map("_id") @db.ObjectId
  name        String
  description String?
  
  userId      String    @db.ObjectId
  user        User      @relation(fields: [userId], references: [id])
  
  characters  Character[]
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@index([userId])
}

model Character {
  id          String    @id @default(auto()) @map("_id") @db.ObjectId
  name        String
  race        String
  classes     Json      // Array of {className, level}
  
  ac          Int
  maxHp       Int
  currentHp   Int
  dexterity   Int
  
  partyId     String    @db.ObjectId
  party       Party     @relation(fields: [partyId], references: [id])
  
  participations EncounterParticipant[]
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Encounter {
  id          String    @id @default(auto()) @map("_id") @db.ObjectId
  name        String
  description String?
  status      EncounterStatus @default(PLANNING)
  
  userId      String    @db.ObjectId
  user        User      @relation(fields: [userId], references: [id])
  
  participants EncounterParticipant[]
  combatLog   CombatLogEntry[]
  
  currentTurn Int       @default(0)
  round       Int       @default(1)
  
  lairActions Json?     // Lair action configuration
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@index([userId, status])
}

enum EncounterStatus {
  PLANNING
  ACTIVE
  COMPLETED
  PAUSED
}

model EncounterParticipant {
  id          String    @id @default(auto()) @map("_id") @db.ObjectId
  
  encounterId String    @db.ObjectId
  encounter   Encounter @relation(fields: [encounterId], references: [id])
  
  // Either character or creature
  characterId String?   @db.ObjectId
  character   Character? @relation(fields: [characterId], references: [id])
  
  creatureId  String?   @db.ObjectId
  creature    Creature? @relation(fields: [creatureId], references: [id])
  
  // Combat stats (may override base values)
  name        String
  ac          Int
  maxHp       Int
  currentHp   Int
  dexterity   Int
  
  initiative  Int
  conditions  Json      // Array of conditions
  
  @@index([encounterId])
}

model Creature {
  id          String    @id @default(auto()) @map("_id") @db.ObjectId
  name        String
  type        CreatureType
  
  ac          Int
  hp          Int
  dexterity   Int
  
  challengeRating String?
  
  legendaryActions Json?  // {actions: [], perTurn: number}
  lairActions     Json?  // Lair action configuration
  
  isTemplate  Boolean   @default(false)
  userId      String?   @db.ObjectId  // null for global templates
  user        User?     @relation(fields: [userId], references: [id])
  
  participations EncounterParticipant[]
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@index([userId, isTemplate])
  @@index([type, challengeRating])
}

enum CreatureType {
  MONSTER
  NPC
}

model CombatLogEntry {
  id          String    @id @default(auto()) @map("_id") @db.ObjectId
  
  encounterId String    @db.ObjectId
  encounter   Encounter @relation(fields: [encounterId], references: [id])
  
  action      String
  description String
  metadata    Json?
  
  timestamp   DateTime  @default(now())
  
  @@index([encounterId, timestamp])
}

model Usage {
  id          String    @id @default(auto()) @map("_id") @db.ObjectId
  userId      String    @unique @db.ObjectId
  user        User      @relation(fields: [userId], references: [id])
  
  partiesCreated    Int @default(0)
  encountersCreated Int @default(0)
  creaturesCreated  Int @default(0)
  
  lastReset   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```
