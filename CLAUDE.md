# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a D&D Encounter Tracker - a Node/React full-stack web application for Dungeon Masters to manage combat

### Key Features

- Initiative tracking with dexterity tiebreakers
- HP/AC management with damage and healing tracking
- Character management (PCs and NPCs) with multiclass support
- Encounter building with participant organization
- Lair actions support (unique competitive advantage)
- Freemium subscription model with 5 pricing tiers

## Technology Stack

## Development Commands

5. **Automated Code Review Process**

   - **Automatic Merging**: PRs are automatically merged when all checks pass
   - **Required Checks**: Build, tests, linting, TypeScript compilation,
     Codacy quality gates
   - **Manual Review Override**: Can be disabled for critical changes requiring
     human review
   - **Check Monitoring**: System waits for checks to complete before making
     merge decisions
   - **Failure Handling**: Failed checks must be addressed before re-attempting merge

6. **Merge and Cleanup**

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
- Follow Next.js 15 App Router patterns
- Implement proper error handling and loading states
- Follow shadcn/ui component patterns for consistency
- Use Mongoose for all database operations

### Quality Gates

- Each week has defined deliverables and acceptance criteria
- Test coverage requirements for all new features
- Mobile responsiveness validation
- Performance optimization checks
- Codacy scans should be performed on all code changes

## Current Status

- ✅ **Phase 1 Foundation Complete:** All project setup and foundational work finished
- 🚀 **Active Development:** Foundation layer fully implemented, moving to Phase 2
- 📋 **Total Progress:** 13 of 46 MVP issues completed (28% complete)
- 📊 **Phase 1 Achievement:** 100% of foundation infrastructure completed
- ✅ **Foundation Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, MongoDB, Jest testing, Vercel deployment

## Completed Work

### Phase 1: Project Foundation (100% Complete) ✅

**Status:** All foundation issues COMPLETED and MERGED
**Completion Date:** June 2025

### Foundation Infrastructure (13 Issues Completed)

#### **Week 1 - Core Project Setup:**

- ✅ **Issue #2:** Next.js 15 project with TypeScript setup
- ✅ **Issue #3:** Development environment (ESLint, Prettier, VS Code)
- ✅ **Issue #4:** Version control and branching strategy
- ✅ **Issue #8:** MongoDB Atlas cluster setup
- ✅ **Issue #45:** Jest testing framework with React Testing Library

#### **Week 2 - UI Foundation & Database:**

- ✅ **Issue #5:** Tailwind CSS installation and configuration
- ✅ **Issue #6:** shadcn/ui component library setup
- ✅ **Issue #7:** Design system foundations (colors, typography, themes)
- ✅ **Issue #9:** Mongoose ODM installation and configuration
- ✅ **Issue #46:** Automated deployment pipeline with Vercel

#### **Week 3 - Core Components:**

- ✅ **Issue #40:** Application layout and navigation system
- ✅ **Issue #43:** Form component library with validation
- ✅ **Issue #44:** Modal and dialog system

### Previous Service Layer Work

#### **Issue #17: User Service Layer Implementation** ✅

**Status:** COMPLETED and MERGED (December 2024)

### Achievements

- **Modular Architecture:** Split UserService into focused modules
- **Comprehensive Testing:** 32 tests with 88%+ coverage
- **Quality Compliance:** Resolved Codacy complexity warnings
- **Testing Framework:** Established robust testing patterns

### Technical Implementation

- Full CRUD operations for user management
- Authentication and password management workflows
- Comprehensive input validation with Zod schemas
- Centralized error handling with custom error classes
- MongoDB integration with proper error handling

## Development Progress Summary

### Completed Foundation Stack

- ✅ Next.js 15 with App Router and TypeScript
- ✅ Tailwind CSS with custom design system
- ✅ shadcn/ui component library
- ✅ MongoDB Atlas with Mongoose ODM
- ✅ Jest testing framework with React Testing Library
- ✅ ESLint, Prettier, and development tooling
- ✅ Vercel deployment with GitHub Actions CI/CD
- ✅ Application layout and navigation
- ✅ Form components and modal system
- ✅ User service layer with comprehensive testing

**Next Phase:** Continue with Phase 2 authentication and data layer issues

### Workflow Memories

- Always check the status of any opened PR and merge if all checks pass
- Always run `npm run lint:fix` before committing code
- Always run `npm run lint:fix` and `npm run test:ci` before pushing code to remote, if any test fails it must be fixed
- **Before pushing commits to remote the following commands must pass with no errors**
  - npm run lint:fix
  - npm run test:ci
  - npm run build
- if any errors exist in the commands above they must be fixed
