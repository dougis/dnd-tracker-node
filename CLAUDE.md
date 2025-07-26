# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

**IMPORTANT**: This project has been completely reset to start clean. The codebase is currently empty and will be built from scratch using the latest technology stack and modern architecture patterns.

## Project Overview

This is a D&D Encounter Tracker - a Node.js/React full-stack web application for Dungeon Masters to manage combat encounters with initiative tracking, HP/AC management, character management, and lair actions support.

### Key Features

- Initiative tracking with dexterity tiebreakers
- HP/AC management with damage and healing tracking
- Character management (PCs and NPCs) with multiclass support
- Encounter building with participant organization
- Lair actions support (unique competitive advantage)
- Freemium subscription model with 5 pricing tiers

## Technology Stack

### Core Technologies (Latest Stable Versions)

**Backend:**
- Node.js v22.15.0 LTS (Codename: 'Jod')
- Express.js 4.x (Express 5 still in development)
- MongoDB 8.0.x with Prisma ORM 6.12.0
- Redis 8.0.x for caching and rate limiting
- TypeScript with ES modules

**Frontend:**
- React v19.1.0 with React Compiler
- Vite v7.0.6 (requires Node.js 20.19+)
- TanStack Router v1.129.8 for type-safe routing
- TanStack Query v5.83.0 for data management
- Zustand v5.0.6 for state management
- shadcn/ui components (React 19 optimized)

**Authentication & Security:**
- @oslojs/jwt 0.3.0 for JWT handling
- @oslojs/oauth2 0.5.0 for OAuth flows
- argon2 v0.43.1 for password hashing
- Session-based authentication with secure cookies

**Testing & Quality:**
- Vitest 3.2.4 for testing
- Playwright v1.54.1 for E2E testing
- Zod 3.x for runtime validation

**Infrastructure:**
- Docker Engine v28.2.1
- @sentry/node v9.42.0 for monitoring
- rate-limiter-flexible v7.1.1 for rate limiting
- hot-shots v11.1.0 for StatsD metrics

## Architecture Overview

### Project Structure (To Be Created)

```
dnd-tracker-node/
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
│   │   │   └── app.ts          # Express app setup
│   │   └── tests/              # Backend tests
│   │
│   ├── client/                 # React frontend
│   │   ├── src/
│   │   │   ├── components/     # React components
│   │   │   ├── pages/          # Page components
│   │   │   ├── hooks/          # Custom hooks
│   │   │   ├── services/       # API services
│   │   │   ├── stores/         # Zustand stores
│   │   │   └── lib/            # Utilities
│   │   └── public/             # Static assets
│   │
│   └── shared/                 # Shared types/utilities
│       └── src/
│           ├── types/          # Shared TypeScript types
│           ├── constants/      # Shared constants
│           └── schemas/        # Zod validation schemas
│
├── scripts/                    # Build/deployment scripts
└── docker-compose.yml          # Local development
```

### Monorepo Structure

- **npm workspaces** manage three packages: server, client, shared
- Shared package contains common types and Zod schemas
- TypeScript ES modules throughout with proper import/export

### Service Layer Pattern

- **Dependency injection** - Services receive PrismaClient in constructor
- **UserService** - User CRUD, profile management, statistics
- **AuthService** - Registration, login, session management, account lockout
- **EncounterService** - Combat encounter management with participants

### Authentication Architecture

- **Session-based auth** with secure HTTP-only cookies
- **Account lockout** after failed login attempts
- **Argon2** password hashing (not bcrypt)
- **Session validation middleware** for protected routes

### Database Layer

- **Prisma ORM** with MongoDB (not Mongoose)
- Models: User, UserStats, Session, Character, Encounter, Participant
- Proper relationships with include patterns for data fetching

### Rate Limiting System

- **Redis backend** for distributed rate limiting
- **Tier-based limits** - Different limits per user subscription tier
- **Route-specific limits** - Login, registration, and general API limits

## Testing Patterns

- **Avoid duplication** Use common helper libraries across the mono repo to avoid logic duplication
- **High level of coverage** The target for ALL changes is 80%+ coverage

### Vitest Configuration

- **Mock Prisma clients** with vi.fn() for database operations
- **Service dependency injection** enables easy mocking in tests
- **beforeEach/afterEach** with vi.clearAllMocks() and vi.resetAllMocks()
- **Coverage reporting** with @vitest/coverage-v8

### Mock Patterns

```typescript
// Service mocking pattern
const mockPrisma = {
  user: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  }
} as unknown as PrismaClient;

const userService = new UserService(mockPrisma);
```

### Frontend Testing

- **React Testing Library** with jsdom environment
- **User event testing** with @testing-library/user-event
- **Component integration tests** rather than unit tests

## Testing Best Practices

- Always reference existing test helper classes to prevent duplication
- Always use helper functions for setup and teardown to prevent duplication
- Keep complexity low (use Codacy to ensure)
- Keep duplication low
- Refactor as needed
- Do not rush

## Security Implementation

- **Helmet.js** for security headers
- **CORS** configuration for cross-origin requests  
- **Input validation** with express-validator on all routes
- **Rate limiting** prevents brute force attacks
- **Secure session cookies** with httpOnly, secure, sameSite
- **Account lockout** mechanism in AuthService

## Development Workflow

### Automated Code Review Process

- **Automatic Merging**: PRs are automatically merged when all checks pass
- **Required Checks**: Build, tests, linting, TypeScript compilation,
  Codacy quality gates
- **Manual Review Override**: Can be disabled for critical changes requiring
  human review
- **Check Monitoring**: System waits for checks to complete before making
  merge decisions
- **Failure Handling**: Failed checks must be addressed before re-attempting
  merge

### Merge and Cleanup

```bash
# After successful merge (automatic or manual), clean up locally
git checkout main
git pull origin main
git branch -d feature/issue-{number}-{description}
git remote prune origin
```

### Commit Message Standards

Follow **Conventional Commits** for consistent commit history:

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

#### Examples

```bash
feat(character): add multiclass support to character creation
fix(combat): resolve initiative tiebreaker calculation
docs: update API documentation for encounter endpoints
test(character): add comprehensive validation tests
```

### Branch Protection Rules

**Main Branch Protection** (configured via GitHub settings):

- ✅ Dismiss stale reviews when new commits are pushed
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Restrict pushes that create files larger than 100MB
- ✅ Do not allow force pushes
- ✅ Do not allow deletions

#### Required Status Checks

- ✅ Build successfully completes (`npm run build`)
- ✅ All tests pass (`npm test`)
- ✅ Linting passes (`npm run lint`)
- ✅ TypeScript compilation succeeds (`npm run typecheck`)
- ✅ Codacy quality gate passes

### Pull Request Guidelines

- **Summary** - Clear description of changes
- **Related Issue** - Link to GitHub issue
- **Type of Change** - Bug fix, feature, breaking change, etc.
- **Testing** - How changes were tested
- **Checklist** - Quality assurance items

## Development Notes

### Code Conventions

- Follow global coding conventions
- Use TypeScript strictly with proper type definitions
- **Express.js patterns** (not Next.js) - RESTful API architecture
- Implement proper error handling and loading states
- Follow shadcn/ui component patterns for consistency
- **Use Prisma** for all database operations (not Mongoose)

### Quality Gates

- Each week has defined deliverables and acceptance criteria
- Test coverage requirements for all new features
- Mobile responsiveness validation
- Performance optimization checks
- Codacy scans should be performed on all code changes

## Important Implementation Notes

- **ES modules** - Use import/export, not require()
- **TypeScript strict mode** - Proper typing required
- **Zod validation** - Used in shared package for runtime validation
- **Error handling** - Custom error classes with proper HTTP status codes
- **Environment variables** - Managed through .env files
- **Session management** - 30-day expiration with sliding window

## Production Features

- **Tier-based subscription model** with 5 pricing tiers
- **Production-ready rate limiting** with Redis backend
- **Account security** with lockout mechanisms
- **Comprehensive logging** and error tracking
- **Secure deployment** configuration ready

## Development Commands (To Be Implemented)

Once the project is set up, the following commands will be available:

### Core Development Commands
- `npm run dev` - Start development servers (both client and server)
- `npm run build` - Build all packages for production
- `npm run test` - Run all tests
- `npm run test:ci` - Run tests in CI mode
- `npm run lint` - Run linting
- `npm run lint:fix` - Run linting with auto-fix
- `npm run typecheck` - TypeScript type checking

### Database Commands
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data

### Package-Specific Commands
- `npm run dev:server` - Start server in development mode
- `npm run dev:client` - Start client in development mode
- `npm run test:server` - Run server tests only
- `npm run test:client` - Run client tests only

## Development Workflow Requirements

### Before ANY commit:
1. Run `npm run lint:fix` - Fix all linting issues
2. Run `npm run typecheck` - Ensure TypeScript compiles
3. Run `npm run test` - All tests must pass
4. Run `npm run build` - Production build must succeed

### Pull Request Process:
- Enable auto-merge on PRs
- All checks must pass before merge
- Link GitHub issues in PR description
- Follow conventional commit messages

### Quality Gates:
- 80%+ test coverage for all new code
- Zero TypeScript errors
- All ESLint rules pass
- All tests pass in CI
- Successful production build

## Architecture Principles

### Why Express/React over Next.js:
- **Explicit Control**: Full control over authentication and session management
- **Debugging Clarity**: Clear separation between frontend and backend
- **Performance**: Multi-layer caching and optimized queries
- **Security**: Session-based auth without framework constraints
- **Flexibility**: Backend can work with any frontend framework

### Key Design Patterns:
- **Service Layer Pattern** with dependency injection
- **Repository Pattern** for data access
- **Multi-layer caching** (Memory + Redis)
- **Session-based authentication** with secure cookies
- **Feature gating** based on subscription tiers
- **Real-time updates** via Server-Sent Events
- **Offline-first PWA** capabilities

This codebase will follow modern full-stack patterns with proper separation of concerns, comprehensive testing, and production-ready security implementations.
