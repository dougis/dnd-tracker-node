# Latest Stable Versions for D&D Encounter Tracker Stack

Based on comprehensive research of official sources and package registries, here are the **production-ready stable versions** for all technologies in your D&D Encounter Tracker application as of July 2025.

## Backend technology versions

### Core Runtime & Framework

- **Node.js LTS**: v22.15.0 (Codename: 'Jod') - Active LTS until October 2025
- **Express.js**: 4.x (latest stable) - Express 5 still in development
- **MongoDB**: 8.0.x - Latest major release with 32% performance improvements
- **Prisma ORM**: 6.12.0 - Both `prisma` and `@prisma/client` packages
- **Redis**: 8.0.x - Current stable production version

### Authentication & Security

- **@oslojs/jwt**: 0.3.0
- **@oslojs/oauth2**: 0.5.0
- **@oslojs/password**: Not available as separate package (check @oslojs/crypto)

### Libraries & Tools

- **Zod**: 3.x (latest stable) - Zod 4.0 in development
- **Pino**: 9.7.0 - High-performance JSON logging
- **Vitest**: 3.2.4 - Next-gen testing with Vite integration
- **Stripe API**: 18.3.0 - Official Node.js SDK

## Frontend technology versions

### Build Tools & Framework

- **Vite**: v7.0.6 - Requires Node.js 20.19+, dropped Node.js 18 support
- **React**: v19.1.0 - Latest stable with React Compiler and Server Components

### Routing & Data Management

- **TanStack Router**: v1.129.8 - Fully type-safe routing
- **TanStack Query**: v5.83.0 - Enhanced TypeScript support
- **Zustand**: v5.0.6 - Lightweight state management

### UI & Forms

- **shadcn/ui**: Latest components - Copy-paste system, React 19 optimized
- **React Hook Form**: v7.61.1 - Still relevant despite React 19 form features

### Testing & PWA

- **Workbox**: v7.3.0 - For PWA functionality
- **Playwright**: v1.54.1 - Requires Node.js 20+, recommends Node.js 22+

## Infrastructure technology versions

### Core Infrastructure

- **Docker Engine**: v28.2.1 - Latest stable with CDI support
- **hot-shots**: v11.1.0 - StatsD client with DogStatsD support

### Monitoring & Security

- **@sentry/node**: v9.42.0 - Very recent release with OpenTelemetry
- **rate-limiter-flexible**: v7.1.1 - Multiple storage backend support
- **argon2**: v0.43.1 - Latest with security updates

### Utilities

- **node-cron**: v4.2.1 - **Breaking changes**: Month indexing now 1-12, requires Node.js v18+

## Critical compatibility notes for production

1. **Node.js Requirements**: Most modern packages require Node.js 18+, with Vite 7 requiring 20.19+. Use **Node.js v22.15.0 LTS** for maximum compatibility.

2. **React 19 Ecosystem**: All listed frontend libraries are compatible with React 19.1.0, which includes significant improvements like the React Compiler.

3. **Breaking Changes to Watch**:
   - **node-cron v4.x**: Month indexing changed from 0-11 to 1-12
   - **Vite 7**: Dropped Node.js 18 support
   - **Oslo**: Original package deprecated in favor of @oslojs scoped packages

4. **Installation Notes**:
   - **argon2** may require build tools if prebuilt binaries aren't available
   - Pin exact versions in package.json for production stability

This technology stack represents a modern, production-ready foundation for your D&D Encounter Tracker launching in July 2025, with all packages actively maintained and optimized for current best practices.
