# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a D&D Encounter Tracker - a Node/React full-stack web application for Dungeon Masters to manage combat encounters, character tracking, and party management.

### Key Features

- Initiative tracking with dexterity tiebreakers
- HP/AC management with damage and healing tracking
- Character management (PCs and NPCs) with multiclass support
- Encounter building with participant organization
- Lair actions support (unique competitive advantage)
- Freemium subscription model with 5 pricing tiers

## Technology Stack & Architecture

### Monorepo Structure
- **packages/server:** Express.js backend with TypeScript, Prisma, MongoDB
- **packages/client:** React frontend with Vite, TanStack Router, shadcn/ui
- **packages/shared:** Shared types and Zod schemas

### Backend Architecture (packages/server)
- **Framework:** Express.js 4.19.2 with TypeScript
- **Database:** MongoDB with Prisma ORM 5.9.1
- **Authentication:** Lucia auth v3.1.1 with Argon2 password hashing
- **Security:** Helmet, CORS, rate limiting, account lockout system
- **Testing:** Vitest with Supertest for API testing
- **Infrastructure:** Redis for sessions, Pino logging

### Frontend Architecture (packages/client)  
- **Framework:** React 18.2.0 with TypeScript
- **Build:** Vite 7.0.5
- **Routing:** TanStack Router v1.15.0 (type-safe)
- **State:** Zustand 4.4.7 + TanStack Query 5.17.0
- **UI:** Radix UI + shadcn/ui components + Tailwind CSS
- **Forms:** React Hook Form with validation
- **Testing:** Vitest + React Testing Library

## Development Commands

### Root Level (run from project root)
```bash
npm run build                 # Build all workspaces
npm run dev                   # Start development servers
npm run test:ci               # Run all tests with coverage
npm run lint:fix              # Fix linting across workspaces
npm run start:server          # Start server only
npm run start:client          # Start client only
```

### Server-Specific (from packages/server)
```bash
npm run db:generate           # Generate Prisma client
npm run db:push               # Push schema to database
npm run db:migrate            # Run database migrations
npm run db:seed               # Seed database with test data
npm test                      # Run server tests
npm run test:coverage         # Run tests with coverage report
```

### Client-Specific (from packages/client)
```bash
npm run dev                   # Start dev server with HMR
npm run build                 # Build for production
npm run preview               # Preview production build
npm test                      # Run component tests
```

### Critical Pre-Push Commands
Always run these before pushing code:
```bash
npm run lint:fix              # Must pass without errors
npm run test:ci               # Must pass without errors  
npm run build                 # Must pass without errors
```

## Database Schema & Models

### Core Models (Prisma + MongoDB)
- **User:** Authentication, security (lockout), subscriptions
- **Session:** Lucia-based session management
- **Party:** User-owned character groups
- **Character:** Full D&D stats with multiclass support
- **Encounter:** Combat management with status tracking
- **Participant:** Links characters/creatures to encounters
- **Creature:** Monster/NPC templates with stat blocks
- **Subscription/Usage/Payment:** Freemium model support

### Key Schema Features
- Account lockout system with failed login tracking
- Comprehensive D&D combat mechanics (initiative, HP, conditions)
- Lair actions support for encounters
- Subscription tiers: FREE, SEASONED, EXPERT, MASTER, GUILD
- Audit trail with CombatLog for encounter actions

## Authentication & Security Architecture

### Authentication System
- Lucia v3 with Prisma adapter for session management
- Argon2 password hashing with salt
- Session-based auth with secure cookies + Bearer token support
- Account lockout after failed attempts with time-based unlocking

### Security Middleware Stack
- `requireAuth` - Mandatory authentication for protected routes
- `optionalAuth` - Optional user context injection
- `requirePermission` - Permission-based access control
- `requireOwnership` - Resource ownership validation
- Multi-tier rate limiting with Redis backend

## Service Layer Patterns

### Service Architecture
Services handle all business logic and database operations:
- `UserService` - User management, authentication
- `AuthService` - Login, registration, session management  
- `PartyService` - Party CRUD operations
- `CharacterService` - Character management with validation
- `EncounterService` - Combat encounter management

### Service Patterns
- Dependency injection with Prisma client
- Comprehensive error handling and validation
- Clean separation from HTTP route handlers
- Extensive unit testing with mocking (target 80%+ coverage)

## Testing Framework & Patterns

### Server Testing (Vitest)
- Supertest for HTTP endpoint testing
- Prisma mocking with `vi.mock()`
- Test database isolation with transaction rollbacks
- Service layer unit tests with comprehensive coverage

### Client Testing
- React Testing Library for component testing
- jsdom environment for DOM simulation
- User event simulation for interactions
- Mock service workers for API mocking

### Test Organization
```
__tests__/                    # Test files mirror src structure
  services/                   # Service layer unit tests
  routes/                     # HTTP route integration tests
  components/                 # React component tests
```

## Route Organization & Patterns

### Route Structure
- Modular route files by feature: `auth/`, `party/`, `character/`, `encounters/`
- Consistent error handling with shared utilities
- Express-validator for request validation
- Standardized response formats with success/error patterns

### Route Handler Patterns
```typescript
// Standard pattern for route handlers
router.post('/', 
  [validation middleware],
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (handleValidationErrors(req, res)) return;
    
    try {
      const result = await service.operation(data);
      sendSuccessResponse(res, result, 'Success message');
    } catch (error) {
      sendErrorResponse(res, error, 'Default error message');
    }
  })
);
```

## Code Quality Standards

### TypeScript Configuration
- Strict type checking enabled
- Advanced TypeScript options for safety
- Avoid `any` types - use proper typing
- Project references for efficient compilation

### Linting & Formatting
- ESLint with TypeScript rules + React plugins
- Prettier for consistent code formatting
- Codacy integration for code quality analysis
- Maximum cyclomatic complexity of 8

### Quality Gates
- All tests must pass before merge
- ESLint must pass without warnings
- TypeScript compilation must succeed
- Codacy quality checks must pass
- Test coverage requirements (80%+ for new code)

## Common Development Patterns

### Error Handling
- Use custom error classes for specific error types
- Centralized error handling in route middleware
- Proper HTTP status codes for different error scenarios
- Consistent error response format across API

### Data Validation
- Zod schemas in shared package for runtime validation
- Express-validator for HTTP request validation
- Prisma schema validation at database level
- Client-side validation with React Hook Form

### State Management
- Zustand for client-side application state
- TanStack Query for server state caching
- Session-based authentication state
- Optimistic updates for better UX

## Build & Deployment

### Build Process
- TypeScript compilation with declaration files
- Vite bundling for client with React optimizations
- Node 18+ requirement across packages
- Coverage reporting integration

### Environment Configuration
- `.env.local` for local development
- Separate environment configs for test/prod
- Required environment variables documented in `.env.example`

## Development Workflow

### Branch Strategy
Follow conventional branch naming:
```bash
feature/issue-{number}-{short-description}
fix/issue-{number}-{short-description}
```

### Commit Message Standards
Follow Conventional Commits:
```bash
feat(character): add multiclass support to character creation
fix(combat): resolve initiative tiebreaker calculation
refactor(service): reduce complexity in validation methods
test(party): add comprehensive CRUD operation tests
```

### Pull Request Requirements
- Link to GitHub issue in PR description
- All status checks must pass before merge
- Auto-merge enabled when all checks pass
- Required checks: build, tests, linting, TypeScript, Codacy

## Troubleshooting Common Issues

### Database Connection
- Ensure `DATABASE_URL` starts with `mongo://` or `mongodb://`
- Run `npm run db:generate` after schema changes
- Use `npm run db:push` for development schema updates

### Test Failures
- Check for proper test isolation and cleanup
- Ensure mocks are properly configured
- Use `npm run test:coverage` to identify uncovered code paths

### TypeScript Errors
- Avoid `any` types - use proper type definitions
- Run `npm run typecheck` to verify compilation
- Check for missing type imports and declarations