# GitHub Project: Phase 1 - MVP Beta Launch

**Objective:** Deliver a functional beta version to 50-100 early adopters for feedback collection.

---

## Milestone 1.1: Secure Foundation & Core Setup (Week 1)

### Issue: Initialize Monorepo and Project Structure
-   **Title:** `chore: Initialize monorepo and project structure`
-   **Labels:** `priority: critical`, `type: chore`, `effort: ai`, `component: devops`
-   **Details:**
    -   Generate the complete monorepo structure with `packages/server`, `packages/client`, and `packages/shared` directories.
    -   Create all necessary configuration files (`tsconfig.json`, `.eslintrc.json`, `prettier.config.js`, `vite.config.ts`, `docker-compose.yml`).
    -   Initialize `package.json` files in all packages with the exact dependencies specified in the implementation plan.
-   **Acceptance Criteria:**
    -   [ ] The repository contains the correct folder structure.
    -   [ ] All specified configuration files are present and correctly formatted.
    -   [ ] `npm install` runs successfully in the root and all sub-packages.

### Issue: Set Up Secure Prisma Schema and Database Seeding
-   **Title:** `feat: Set up secure Prisma schema and database seeding`
-   **Labels:** `priority: critical`, `type: feature`, `effort: ai`, `component: database`
-   **Details:**
    -   Implement the full Prisma schema in `prisma/schema.prisma` as per Technical Design v4.1.
    -   This must include the `User` model with `failedLoginAttempts` and `lockedUntil`, and the `ProcessedEvent` model for Stripe idempotency.
    -   Create a `prisma/seed.ts` script to populate the database with at least 5 system-defined creature templates.
-   **Acceptance Criteria:**
    -   [ ] `npx prisma migrate dev` runs successfully.
    -   [ ] The database schema matches the technical design.
    -   [ ] `npm run db:seed` executes and populates the `Creature` table with at least 5 records where `userId` is null.

### Issue: Configure Production Environment and Dependencies
-   **Title:** `chore: Configure production environment and dependencies`
-   **Labels:** `priority: critical`, `type: chore`, `effort: human`, `component: devops`
-   **Details:**
    -   Set up MongoDB Atlas and Redis Cloud accounts.
    -   Configure environment variables (`.env`) for production, including database connection strings and secrets.
    -   Implement a startup check in `server/src/app.ts` that causes the application to exit if `NODE_ENV` is `production` and a Redis connection cannot be established.
-   **Acceptance Criteria:**
    -   [ ] The application connects successfully to MongoDB Atlas and Redis Cloud using production environment variables.
    -   [ ] The server process exits with a non-zero code if it fails to connect to Redis in a production environment.

### Issue: Implement Hardened Authentication System
-   **Title:** `feat: Implement hardened authentication system with account lockout`
-   **Labels:** `priority: critical`, `type: feature`, `effort: ai`, `component: auth`, `component: backend`
-   **Details:**
    -   Implement user registration and login using Lucia Auth.
    -   Hash passwords using Argon2.
    -   Implement account lockout logic: after 5 failed login attempts, the user's account is locked for 15 minutes by setting the `lockedUntil` field.
    -   On successful login, `failedLoginAttempts` should be reset to 0 and `lockedUntil` to null.
-   **Acceptance Criteria:**
    -   [ ] Users can register and log in successfully.
    -   [ ] A user account becomes locked for 15 minutes after 5 consecutive failed login attempts.
    -   [ ] A locked-out user cannot log in until the lockout period expires.
    -   [ ] A successful login resets the lockout status.

### Issue: Implement Production-Ready Rate Limiting
-   **Title:** `feat: Implement production-ready rate limiting`
-   **Labels:** `priority: high`, `type: feature`, `effort: ai`, `component: security`, `component: backend`
-   **Details:**
    -   Configure the `rate-limiter-flexible` library to use Redis in the production environment.
    -   Implement tier-based rate limits for authenticated API requests.
    -   Implement stricter, IP-based rate limits for unauthenticated endpoints like `/login` and `/register`.
-   **Acceptance Criteria:**
    -   [ ] Unauthenticated requests to `/login` are limited to 5 requests per minute per IP.
    -   [ ] Authenticated requests for a free-tier user are limited according to the plan.
    -   [ ] The system correctly uses Redis for tracking limits in a production environment.

### Issue: Build Frontend Foundation and Authentication UI
-   **Title:** `feat: Build frontend foundation and authentication UI`
-   **Labels:** `priority: high`, `type: feature`, `effort: ai`, `component: frontend`
-   **Details:**
    -   Set up the React/Vite project with TanStack Router.
    -   Create the main application layout, including protected routes that require authentication.
    -   Build the login and registration forms using `shadcn/ui` and `react-hook-form`.
-   **Acceptance Criteria:**
    -   [ ] The application has a defined routing structure.
    -   [ ] Users can access the login and registration pages.
    -   [ ] Users are redirected from protected pages if they are not authenticated.
    -   [ ] The login form correctly displays an error message for a locked-out account.

---

## Milestone 1.2: Core MVP Features (Week 2)

### Issue: Implement Party and Character Management API
-   **Title:** `feat: Implement Party and Character Management API`
-   **Labels:** `priority: critical`, `type: feature`, `effort: ai`, `component: backend`
-   **Details:**
    -   Create all necessary API endpoints for CRUD (Create, Read, Update, Delete) operations on Parties.
    -   Implement logic to manage Characters as sub-documents within a Party.
-   **Acceptance Criteria:**
    -   [ ] Endpoints for `GET`, `POST`, `PUT`, `DELETE` on `/api/v1/parties` are functional.
    -   [ ] Endpoints for adding, updating, and removing characters within a party are functional.
    -   [ ] All endpoints are protected and require authentication.

### Issue: Build Frontend for Party and Character Management
-   **Title:** `feat: Build frontend for Party and Character Management`
-   **Labels:** `priority: critical`, `type: feature`, `effort: ai`, `component: frontend`
-   **Details:**
    -   Develop the UI for listing, creating, and editing parties.
    -   Create a character management interface within the party view.
    -   Use Zustand for local state and React Query to synchronize with the server.
-   **Acceptance Criteria:**
    -   [ ] A user can create a new party and add characters to it.
    -   [ ] A user can view a list of their parties.
    -   [ ] A user can edit the details of a party and its characters.

### Issue: Implement Combat System MVP Backend
-   **Title:** `feat: Implement Combat System MVP Backend`
-   **Labels:** `priority: critical`, `type: feature`, `effort: ai`, `component: backend`
-   **Details:**
    -   Create API endpoints for CRUD operations on Encounters.
    -   Implement business logic for managing encounter participants, calculating initiative (including Dexterity tie-breaking), and tracking combat state (HP, turn, round).
    -   Set up the initial Server-Sent Events (SSE) infrastructure for broadcasting real-time updates.
-   **Acceptance Criteria:**
    -   [ ] Endpoints for managing encounters and their participants are functional.
    -   [ ] The system can correctly calculate initiative order.
    -   [ ] An SSE endpoint (`/api/v1/encounters/:id/stream`) is available for clients to connect to.

### Issue: Build Frontend for Combat System MVP
-   **Title:** `feat: Build Frontend for Combat System MVP`
-   **Labels:** `priority: critical`, `type: feature`, `effort: ai`, `component: frontend`
-   **Details:**
    -   Develop the UI for building an encounter by adding creatures and characters.
    -   Create the main combat tracker interface, including an initiative list, HP tracking inputs, and turn management controls.
    -   Implement basic condition tracking and a simple combat log.
-   **Acceptance Criteria:**
    -   [ ] A user can create an encounter and add participants.
    -   [ ] The combat tracker UI displays the correct initiative order.
    -   [ ] A user can apply damage/healing to a participant, and the change is reflected.
    -   [ ] The UI correctly indicates the current turn and round.

---

## Milestone 1.3: Beta Launch Preparation (Week 3)

### Issue: Implement Free Tier Subscription Logic
-   **Title:** `feat: Implement Free Tier Subscription Logic`
-   **Labels:** `priority: high`, `type: feature`, `effort: ai`, `component: backend`, `component: payments`
-   **Details:**
    -   Implement the feature-gating middleware to enforce the limits of the "Free Adventurer" tier.
    -   This includes limiting the number of parties (1), encounters (3), creatures (10), and participants per encounter (6).
    -   Track resource creation in the `Usage` table.
-   **Acceptance Criteria:**
    -   [ ] A free user is blocked from creating a second party.
    -   [ ] A free user is blocked from adding a seventh participant to an encounter.
    -   [ ] API requests that violate these limits receive a `403 Forbidden` response.

### Issue: Build Frontend Usage and Upgrade Prompts
-   **Title:** `feat: Build Frontend Usage and Upgrade Prompts`
-   **Labels:** `priority: high`, `type: feature`, `effort: ai`, `component: frontend`
-   **Details:**
    -   Create a simple dashboard widget that shows a user their current usage against their limits.
    -   When a user is blocked by a feature gate, display a clear message and a prompt to upgrade (the prompt can link to a placeholder page for now).
-   **Acceptance Criteria:**
    -   [ ] The UI displays the user's current party and encounter count.
    -   [ ] When a user tries to perform an action that exceeds their limit, a modal or toast notification appears with an upgrade prompt.

### Issue: Finalize Beta Deployment and Monitoring Setup
-   **Title:** `chore: Finalize Beta Deployment and Monitoring Setup`
-   **Labels:** `priority: critical`, `type: chore`, `effort: ai`, `component: devops`
-   **Details:**
    -   Create final Docker configurations for the beta environment.
    -   Set up a staging environment and a beta production environment.
    -   Integrate Sentry for basic error tracking and set up initial performance monitoring and user analytics.
-   **Acceptance Criteria:**
    -   [ ] The application can be successfully deployed to the staging environment using Docker.
    -   [ ] Errors from the deployed application appear in Sentry.

### Issue: Conduct Pre-Launch Polish and Bug Bash
-   **Title:** `chore: Conduct Pre-Launch Polish and Bug Bash`
-   **Labels:** `priority: high`, `type: bug`, `effort: human`
-   **Details:**
    -   Perform a full review of the application, focusing on mobile responsiveness, loading states, and error handling.
    -   Conduct cross-browser testing (Chrome, Firefox, Safari).
    -   Identify and resolve any critical bugs before the beta launch.
-   **Acceptance Criteria:**
    -   [ ] At least 10 bugs or UI inconsistencies are identified and fixed.
    -   [ ] The application is functional and visually polished on major browsers and mobile devices.