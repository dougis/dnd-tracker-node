# Milestone 1: Project Foundation (Week 1)

**Due Date**: End of Week 1  
**Goal**: Complete project setup, monorepo structure, and development environment

## Prerequisites & Setup

### Labels to Create First
```bash
# Priority labels
gh label create "P1" --color "FF0000" --description "Critical path"
gh label create "P2" --color "FFA500" --description "Important"
gh label create "P3" --color "FFFF00" --description "Nice to have"

# Milestone labels
gh label create "M1-Foundation" --color "0052CC"
gh label create "M2-Deployment" --color "0052CC"
gh label create "M3-Auth" --color "0052CC"
gh label create "M4-Party" --color "0052CC"
gh label create "M5-Encounter" --color "0052CC"
gh label create "M6-Combat" --color "0052CC"
gh label create "M7-Realtime" --color "0052CC"
gh label create "M8-Monetization" --color "0052CC"
gh label create "M9-Premium" --color "0052CC"
gh label create "M10-Mobile" --color "0052CC"
gh label create "M11-Testing" --color "0052CC"
gh label create "M12-Launch" --color "0052CC"

# Phase labels
gh label create "MVP" --color "00FF00" --description "Core functionality"
gh label create "Post-MVP" --color "800080" --description "Premium features"

# Type labels
gh label create "epic" --color "7057FF"
gh label create "ai-ready" --color "0E8A16"
gh label create "needs-review" --color "FBCA04"
gh label create "blocking" --color "B60205"
gh label create "security" --color "FF0000"
gh label create "database" --color "F9D0C4"
gh label create "api" --color "0075CA"
gh label create "frontend" --color "C5DEF5"
gh label create "testing" --color "BFD4F2"
gh label create "documentation" --color "D4C5F9"
gh label create "devops" --color "1D76DB"
```

### Create Milestones
```bash
gh milestone create "M1: Project Foundation" --due-on 2025-01-27
gh milestone create "M2: Initial Deployment" --due-on 2025-01-27
gh milestone create "M3: Authentication System" --due-on 2025-02-03
gh milestone create "M4: Party Management" --due-on 2025-02-07
gh milestone create "M5: Encounter System" --due-on 2025-02-07
gh milestone create "M6: Combat Tracker Core" --due-on 2025-02-10
gh milestone create "M7: Real-time Features" --due-on 2025-02-14
gh milestone create "M8: Monetization System" --due-on 2025-02-17
gh milestone create "M9: Premium Features" --due-on 2025-02-21
gh milestone create "M10: Mobile & PWA" --due-on 2025-02-24
gh milestone create "M11: Testing & Security" --due-on 2025-02-28
gh milestone create "M12: Production Launch" --due-on 2025-03-03
```

## Issues for Milestone 1

### Issue #1: Initialize Monorepo Structure
**Labels**: `P1`, `M1-Foundation`, `MVP`, `epic`, `ai-ready`, `blocking`  
**Description**: Create the base monorepo structure with npm workspaces for a full-stack TypeScript application

**Detailed Requirements**:
The D&D Encounter Tracker will be built as a monorepo containing three packages:
- `packages/server`: Node.js/Express backend with TypeScript
- `packages/client`: React 18 frontend with Vite and TypeScript  
- `packages/shared`: Shared TypeScript types and utilities

**Acceptance Criteria**:
```
- [ ] Create root package.json with workspaces configuration:
  - [ ] Set "workspaces": ["packages/*"]
  - [ ] Add scripts: "dev": "npm run dev --workspaces", "build": "npm run build --workspaces"
  - [ ] Add concurrently as devDependency for parallel execution
- [ ] Create packages/server directory structure:
  - [ ] src/config, controllers, services, repositories, models, middleware, routes, utils, validators, websocket
  - [ ] tests/ directory
  - [ ] package.json with "name": "@dnd-tracker/server"
- [ ] Create packages/client directory structure:
  - [ ] src/components, pages, hooks, services, store, types, utils
  - [ ] public/ directory
  - [ ] package.json with "name": "@dnd-tracker/client"
- [ ] Create packages/shared directory structure:
  - [ ] src/types, constants, validators
  - [ ] package.json with "name": "@dnd-tracker/shared"
- [ ] Add comprehensive .gitignore:
  - [ ] node_modules, dist, build, .env, .env.local, *.log, .DS_Store
- [ ] Add README.md with setup instructions
- [ ] Create root scripts for development:
  - [ ] "dev": runs all packages in dev mode
  - [ ] "build": builds all packages
  - [ ] "test": runs all tests
  - [ ] "lint": runs linting
```

---

### Issue #2: Configure TypeScript for All Packages
**Labels**: `P1`, `M1-Foundation`, `MVP`, `ai-ready`, `blocking`  
**Depends on**: #1  
**Description**: Set up TypeScript configuration for the monorepo with proper path resolution and strict typing

**Acceptance Criteria**:
```
- [ ] Create root tsconfig.json:
  - [ ] "compilerOptions": { "strict": true, "esModuleInterop": true, "skipLibCheck": true }
  - [ ] "references": array pointing to each package
- [ ] Create packages/server/tsconfig.json:
  - [ ] "extends": "../../tsconfig.json"
  - [ ] "compilerOptions": { "target": "ES2022", "module": "commonjs", "outDir": "./dist" }
  - [ ] "include": ["src/**/*"], "exclude": ["node_modules", "dist"]
  - [ ] Path aliases: "@/*": ["src/*"]
- [ ] Create packages/client/tsconfig.json:
  - [ ] "extends": "../../tsconfig.json"  
  - [ ] "compilerOptions": { "target": "ES2020", "module": "ESNext", "jsx": "react-jsx" }
  - [ ] "include": ["src/**/*"], "exclude": ["node_modules", "dist"]
- [ ] Create packages/shared/tsconfig.json:
  - [ ] "extends": "../../tsconfig.json"
  - [ ] "compilerOptions": { "target": "ES2020", "module": "ESNext" }
  - [ ] "declaration": true for generating .d.ts files
- [ ] Configure path resolution:
  - [ ] Server can import from "@dnd-tracker/shared"
  - [ ] Client can import from "@dnd-tracker/shared"
- [ ] Add TypeScript as devDependency (^5.0.0)
- [ ] Add @types/node for server package
- [ ] Verify compilation: `npm run build` works for all packages
- [ ] Add ts-node-dev for server development
```

---

### Issue #3: Set Up Code Quality Tools
**Labels**: `P1`, `M1-Foundation`, `MVP`, `ai-ready`  
**Depends on**: #1  
**Description**: Configure ESLint, Prettier, and Husky for consistent code quality and automated checks

**Acceptance Criteria**:
```
- [ ] Install and configure ESLint:
  - [ ] Create root .eslintrc.js extending:
    - [ ] 'eslint:recommended'
    - [ ] 'plugin:@typescript-eslint/recommended'
    - [ ] 'plugin:react/recommended' (for client)
    - [ ] 'plugin:react-hooks/recommended' (for client)
  - [ ] Rules: no-console: warn, no-unused-vars: error, etc.
  - [ ] Add .eslintignore: dist/, build/, coverage/
- [ ] Configure Prettier:
  - [ ] Create .prettierrc: { "semi": true, "singleQuote": true, "tabWidth": 2 }
  - [ ] Add .prettierignore: dist/, build/, node_modules/
  - [ ] Ensure ESLint and Prettier work together (eslint-config-prettier)
- [ ] Set up Husky:
  - [ ] Install husky and run `npx husky install`
  - [ ] Add pre-commit hook: `npx husky add .husky/pre-commit "npm run lint-staged"`
  - [ ] Configure lint-staged in package.json:
    - [ ] "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
    - [ ] "*.{json,md}": ["prettier --write"]
- [ ] Add npm scripts:
  - [ ] "lint": "eslint . --ext .ts,.tsx"
  - [ ] "lint:fix": "eslint . --ext .ts,.tsx --fix"
  - [ ] "format": "prettier --write ."
  - [ ] "format:check": "prettier --check ."
- [ ] Test pre-commit hooks work:
  - [ ] Make a commit with linting errors - should fail
  - [ ] Make a commit with valid code - should pass
- [ ] Add VS Code settings.json for team:
  - [ ] Format on save, ESLint auto-fix on save
```

---

### Issue #4: Create Docker Development Environment
**Labels**: `P1`, `M1-Foundation`, `MVP`, `ai-ready`, `blocking`  
**Depends on**: #1  
**Description**: Set up Docker Compose for local development with all required services

**Acceptance Criteria**:
```
- [ ] Create backend Dockerfile.dev:
  - [ ] FROM node:20-alpine
  - [ ] WORKDIR /app
  - [ ] Install nodemon globally
  - [ ] Copy package files and install dependencies
  - [ ] Expose port 3001
  - [ ] CMD ["npm", "run", "dev"]
- [ ] Create docker-compose.yml:
  - [ ] MongoDB service:
    - [ ] image: mongo:7.0
    - [ ] ports: 27017:27017
    - [ ] environment: MONGO_INITDB_ROOT_USERNAME, MONGO_INITDB_ROOT_PASSWORD
    - [ ] volumes: mongodb_data:/data/db
  - [ ] Redis service:
    - [ ] image: redis:7-alpine
    - [ ] ports: 6379:6379
    - [ ] command: redis-server --requirepass <password>
  - [ ] Backend service:
    - [ ] build: context: ., dockerfile: Dockerfile.dev
    - [ ] ports: 3001:3001
    - [ ] volumes: ./packages/server:/app/packages/server (for hot reload)
    - [ ] depends_on: mongodb, redis
    - [ ] environment: link to .env file
  - [ ] Networks: create dnd-network for all services
- [ ] Create .env.example:
  - [ ] DATABASE_URL=mongodb://root:password@mongodb:27017/dnd-tracker?authSource=admin
  - [ ] REDIS_URL=redis://:password@redis:6379
  - [ ] JWT_SECRET=your-secret-key
  - [ ] PORT=3001
- [ ] Add docker scripts to package.json:
  - [ ] "docker:up": "docker-compose up -d"
  - [ ] "docker:down": "docker-compose down"
  - [ ] "docker:logs": "docker-compose logs -f"
  - [ ] "docker:clean": "docker-compose down -v"
- [ ] Create docker-compose.override.yml for local overrides
- [ ] Add .dockerignore: node_modules, dist, .git
- [ ] Test services start correctly and can communicate
```

---

### Issue #5: Initialize GitHub Repository and CI/CD
**Labels**: `P1`, `M1-Foundation`, `MVP`, `ai-ready`, `needs-review`  
**Depends on**: #1, #3  
**Description**: Set up GitHub repository with Actions CI/CD pipeline for automated testing and deployment

**Acceptance Criteria**:
```
- [ ] Create .github/workflows/ci.yml:
  - [ ] name: CI/CD Pipeline
  - [ ] Triggers: push (main, develop), pull_request (main)
  - [ ] Jobs:
    - [ ] lint: Run ESLint on all packages
    - [ ] test: Run tests (when available)
    - [ ] build: Build all packages
    - [ ] type-check: Run TypeScript compiler
  - [ ] Matrix strategy for Node versions: [18, 20]
  - [ ] Services: MongoDB and Redis for integration tests
  - [ ] Cache node_modules for performance
  - [ ] Upload test coverage reports
- [ ] Create .github/workflows/dependency-update.yml:
  - [ ] Use Dependabot for automated updates
  - [ ] Weekly schedule for non-critical updates
- [ ] Set up branch protection (needs-review):
  - [ ] Require PR reviews (1 reviewer)
  - [ ] Require status checks to pass
  - [ ] Require branches to be up to date
  - [ ] Include administrators in restrictions
- [ ] Create PR template (.github/pull_request_template.md):
  - [ ] Checklist: tests pass, documentation updated, etc.
  - [ ] Link to issue
  - [ ] Description of changes
- [ ] Create issue templates:
  - [ ] Bug report template
  - [ ] Feature request template
  - [ ] Epic template
- [ ] Add status badges to README:
  - [ ] Build status
  - [ ] Test coverage
  - [ ] License
```

**Manual Review Steps**:
1. After PR is created, manually review the workflow file for security issues
2. Verify branch protection rules in GitHub settings:
   - Settings → Branches → Add rule
   - Branch name pattern: `main`
   - Enable "Require pull request reviews"
   - Enable "Require status checks"
3. Test the CI pipeline by creating a test PR
4. Verify Dependabot is enabled in Security settings

---

### Issue #6: Create Shared Types Package
**Labels**: `P1`, `M1-Foundation`, `MVP`, `ai-ready`, `blocking`  
**Depends on**: #2  
**Description**: Set up shared TypeScript types and constants used across all packages

**Acceptance Criteria**:
```
- [ ] Create packages/shared/src/types/user.ts:
  - [ ] Interface User with all fields from schema
  - [ ] Enum UserRole: 'user', 'admin'
  - [ ] Interface AuthTokenPayload
  - [ ] Type SubscriptionTier: 'free' | 'seasoned' | 'expert' | 'master' | 'guild'
  - [ ] Interface UserSubscription with Stripe fields
- [ ] Create packages/shared/src/types/party.ts:
  - [ ] Interface Party with id, name, description, characters, etc.
  - [ ] Interface Character with all D&D stats
  - [ ] Interface AbilityScores (STR, DEX, etc.)
  - [ ] Type CharacterClass with name and level
- [ ] Create packages/shared/src/types/encounter.ts:
  - [ ] Interface Encounter with participants, combat state
  - [ ] Interface CombatParticipant
  - [ ] Interface CombatState with round, turn, order
  - [ ] Interface Condition with name, duration
  - [ ] Type EncounterStatus: 'planning' | 'active' | 'paused' | 'completed'
- [ ] Create packages/shared/src/types/creature.ts:
  - [ ] Interface Creature with full stat block
  - [ ] Interface CreatureAction
  - [ ] Interface LegendaryAction
  - [ ] Type CreatureSize: 'tiny' | 'small' | 'medium' | etc.
  - [ ] Type ChallengeRating
- [ ] Create packages/shared/src/types/api.ts:
  - [ ] Generic ApiResponse<T> with success, data, error
  - [ ] Interface PaginatedResponse<T>
  - [ ] Interface ApiError with code, message
  - [ ] Type HttpMethod
- [ ] Create packages/shared/src/constants/index.ts:
  - [ ] SUBSCRIPTION_TIERS with limits for each tier
  - [ ] CONDITION_TYPES array
  - [ ] ABILITY_SCORES array
  - [ ] API_VERSION = 'v1'
- [ ] Create index.ts exporting all types
- [ ] Configure package.json:
  - [ ] "main": "./dist/index.js"
  - [ ] "types": "./dist/index.d.ts"
  - [ ] Build script generates declarations
```

---

### Issue #7: Create Base Express Server Setup
**Labels**: `P2`, `M1-Foundation`, `MVP`, `api`, `ai-ready`  
**Depends on**: #6  
**Description**: Initialize Express server with basic middleware and structure

**Acceptance Criteria**:
```
- [ ] Create packages/server/src/app.ts:
  - [ ] Initialize Express application
  - [ ] Configure middleware stack:
    - [ ] cors with proper origins
    - [ ] helmet for security headers
    - [ ] compression for responses
    - [ ] body-parser for JSON
    - [ ] morgan for logging
  - [ ] Set up error handling middleware
  - [ ] Health check endpoint: GET /health
  - [ ] API versioning: /api/v1
- [ ] Create server/src/server.ts:
  - [ ] Connect to MongoDB
  - [ ] Connect to Redis
  - [ ] Start Express server
  - [ ] Graceful shutdown handling
- [ ] Create config/index.ts:
  - [ ] Load environment variables
  - [ ] Export configuration object
  - [ ] Validate required configs
- [ ] Create middleware/errorHandler.ts:
  - [ ] Global error handling
  - [ ] Consistent error format
  - [ ] Different handling for dev/prod
- [ ] Create utils/logger.ts:
  - [ ] Winston logger setup
  - [ ] Different log levels
  - [ ] File and console transports
- [ ] Add start scripts:
  - [ ] "dev": with nodemon
  - [ ] "start": for production
  - [ ] "build": TypeScript compilation
```

---

### Issue #8: Create Base React Application
**Labels**: `P2`, `M1-Foundation`, `MVP`, `frontend`, `ai-ready`  
**Depends on**: #6  
**Description**: Initialize React application with Vite and basic structure

**Acceptance Criteria**:
```
- [ ] Initialize Vite project:
  - [ ] Use React TypeScript template
  - [ ] Configure for monorepo
  - [ ] Set up path aliases
- [ ] Install core dependencies:
  - [ ] react-router-dom v6
  - [ ] axios for API calls
  - [ ] zustand for state
  - [ ] react-query for server state
- [ ] Create folder structure:
  - [ ] components/common/
  - [ ] components/layout/
  - [ ] pages/
  - [ ] hooks/
  - [ ] services/
  - [ ] store/
  - [ ] utils/
- [ ] Set up routing:
  - [ ] Create AppRouter component
  - [ ] Add route constants
  - [ ] Create layout wrapper
- [ ] Create base components:
  - [ ] Layout with header/footer
  - [ ] Loading spinner
  - [ ] Error boundary
  - [ ] 404 page
- [ ] Configure development:
  - [ ] Proxy API requests
  - [ ] Environment variables
  - [ ] Hot module replacement
```

---

### Issue #9: Create Development Database Scripts
**Labels**: `P3`, `M1-Foundation`, `MVP`, `database`, `ai-ready`  
**Depends on**: #4  
**Description**: Create database initialization and migration scripts

**Acceptance Criteria**:
```
- [ ] Create database connection module:
  - [ ] MongoDB connection with retry logic
  - [ ] Connection pooling configuration
  - [ ] Error handling
- [ ] Create migration system:
  - [ ] migrations/ directory
  - [ ] Migration runner script
  - [ ] Track applied migrations
- [ ] Create seed scripts:
  - [ ] Basic user accounts
  - [ ] Sample creatures (SRD content)
  - [ ] Test data generator
- [ ] Add database scripts:
  - [ ] "db:seed": populate dev data
  - [ ] "db:reset": clean and reseed
  - [ ] "db:migrate": run migrations
```

---

### Issue #10: Create API Documentation Structure
**Labels**: `P3`, `M1-Foundation`, `MVP`, `documentation`, `ai-ready`  
**Depends on**: #7  
**Description**: Set up OpenAPI/Swagger documentation

**Acceptance Criteria**:
```
- [ ] Install swagger dependencies:
  - [ ] swagger-ui-express
  - [ ] swagger-jsdoc
- [ ] Create swagger config:
  - [ ] API title and version
  - [ ] Server URLs
  - [ ] Security schemes
- [ ] Set up swagger route:
  - [ ] /api/v1/docs
  - [ ] Interactive UI
- [ ] Create documentation template:
  - [ ] Example endpoint docs
  - [ ] Schema definitions
  - [ ] Authentication docs
- [ ] Add JSDoc example:
  - [ ] Show proper format
  - [ ] Parameter documentation
  - [ ] Response examples
```

---

## Week 1 Success Criteria

By the end of Week 1, you should have:

1. **Complete Development Environment**:
   - Monorepo structure with TypeScript configured
   - Docker Compose with MongoDB and Redis running
   - Code quality tools (ESLint, Prettier, Husky) working
   - CI/CD pipeline operational

2. **Foundation Infrastructure**:
   - Express server with basic middleware
   - React application with routing
   - Shared types package with core interfaces
   - Development database scripts

3. **Quality Gates**:
   - All packages building successfully
   - Linting and formatting enforced
   - Pre-commit hooks functioning
   - CI pipeline passing

4. **Documentation Started**:
   - API documentation structure
   - Development setup instructions
   - Project README

**Next Step**: Move to Milestone 2 for early deployment infrastructure while continuing with authentication development.