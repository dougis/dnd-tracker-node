# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

This is a D&D Encounter Tracker - a Node.js/React full-stack web application
for Dungeon Masters to manage combat encounters with initiative tracking,
HP/AC management, character management, and lair actions support.

### Key Features

- Initiative tracking with dexterity tiebreakers
- HP/AC management with damage and healing tracking
- Character management (PCs and NPCs) with multiclass support
- Encounter building with participant organization
- Lair actions support (unique competitive advantage)
- Freemium subscription model with 5 pricing tiers

## Technology Stack

## Architecture Overview

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

### Workflow Memories

- Always check the status of any opened PR and merge if all checks pass
- Always run `npm run lint:fix` before committing code
- Always run `npm run lint:fix` and `npm run test:ci` before pushing code to
  remote, if any test fails it must be fixed
- **Before pushing commits to remote the following commands must pass with no
  errors**
  - npm run lint:fix
  - npm run test:ci
  - npm run build
- if any errors exist in the commands above they must be fixed

This codebase follows modern full-stack patterns with proper separation of
concerns, comprehensive testing, and production-ready security implementations.
