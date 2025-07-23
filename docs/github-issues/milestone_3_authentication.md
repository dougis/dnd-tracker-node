# Milestone 3: Authentication System (Week 2)

**Due Date**: End of Week 2  
**Goal**: Complete authentication system with JWT, user management, and security

## Overview

This milestone implements a production-ready authentication system with JWT tokens, refresh token rotation, user registration, password reset, and comprehensive security measures. The system will support the subscription tiers needed for the monetization model.

## Issues for Milestone 3

### Issue #31: Create Mongoose Schemas
**Labels**: `P1`, `M3-Auth`, `MVP`, `database`, `ai-ready`, `blocking`  
**Depends on**: #6  
**Description**: Implement all Mongoose schemas for the application data model

**Acceptance Criteria**:
```
- [ ] Create packages/server/src/models/User.ts:
  - [ ] Schema fields:
    - [ ] email: unique, required, lowercase, validated
    - [ ] username: unique, required, min 3 chars
    - [ ] passwordHash: required
    - [ ] isEmailVerified: boolean, default false
    - [ ] subscription object with tier, status, dates, Stripe IDs
    - [ ] usage object tracking resource counts
    - [ ] timestamps: true
  - [ ] Indexes: email, username, subscription.stripeCustomerId
  - [ ] Instance methods: comparePassword, generateAuthToken
  - [ ] Pre-save hook: hash password if modified
  - [ ] Virtual: subscription.isActive
- [ ] Create models/Party.ts:
  - [ ] userId: ObjectId ref to User
  - [ ] name: required, max 100 chars
  - [ ] characters: array with max 10, embedded schema
  - [ ] Character sub-schema: name, race, classes, abilities, hp, ac
  - [ ] isArchived: boolean
  - [ ] Compound index: userId + isArchived
- [ ] Create models/Encounter.ts:
  - [ ] participants array with type, references, combat stats
  - [ ] combatState object: round, turn, isActive
  - [ ] lairActions configuration
  - [ ] combatLog array for history (premium)
  - [ ] status enum: planning, active, paused, completed
  - [ ] Index: userId + status
- [ ] Create models/Creature.ts:
  - [ ] Full creature stats: ac, hp, abilities, speed
  - [ ] actions, legendaryActions, traits arrays
  - [ ] isTemplate: boolean
  - [ ] Text index on name and tags for search
  - [ ] Static method: getTemplates()
- [ ] Create models/Payment.ts:
  - [ ] Track Stripe transactions
  - [ ] userId, amount, currency, status
  - [ ] stripePaymentIntentId: unique
- [ ] Create tests for all schemas:
  - [ ] Validation testing
  - [ ] Index verification
  - [ ] Method testing
```

---

### Issue #32: Implement JWT Authentication Service
**Labels**: `P1`, `M3-Auth`, `MVP`, `api`, `security`, `ai-ready`  
**Depends on**: #31  
**Description**: Create JWT token generation and validation service with refresh token rotation

**Acceptance Criteria**:
```
- [ ] Create packages/server/src/services/auth.service.ts:
  - [ ] generateTokens(user: IUser):
    - [ ] Create access token (15 min expiry)
    - [ ] Create refresh token (7 days)
    - [ ] Include user id, email, tier, role in payload
    - [ ] Sign with different secrets
  - [ ] verifyAccessToken(token: string):
    - [ ] Verify signature
    - [ ] Check expiration
    - [ ] Return decoded payload
    - [ ] Handle errors gracefully
  - [ ] verifyRefreshToken(token: string):
    - [ ] Verify signature
    - [ ] Check if token is blacklisted
    - [ ] Return decoded payload
  - [ ] rotateRefreshToken(oldToken: string):
    - [ ] Verify old token
    - [ ] Blacklist old token
    - [ ] Generate new token pair
    - [ ] Store in Redis with TTL
  - [ ] revokeRefreshToken(token: string):
    - [ ] Add to Redis blacklist
    - [ ] Set expiry matching token expiry
- [ ] Create config/auth.config.ts:
  - [ ] ACCESS_TOKEN_SECRET from env
  - [ ] REFRESH_TOKEN_SECRET from env
  - [ ] ACCESS_TOKEN_EXPIRY = '15m'
  - [ ] REFRESH_TOKEN_EXPIRY = '7d'
- [ ] Create utils/jwt.utils.ts:
  - [ ] Helper functions for token operations
  - [ ] Error handling utilities
- [ ] Create comprehensive tests:
  - [ ] Token generation
  - [ ] Token verification
  - [ ] Token rotation
  - [ ] Expiry handling
  - [ ] Invalid token handling
- [ ] Add types in shared package:
  - [ ] Interface JWTPayload
  - [ ] Type TokenPair
```

---

### Issue #33: Create Authentication Middleware
**Labels**: `P1`, `M3-Auth`, `MVP`, `api`, `security`, `ai-ready`  
**Depends on**: #32  
**Description**: Build Express middleware for protecting routes and handling authentication

**Acceptance Criteria**:
```
- [ ] Create middleware/auth.middleware.ts:
  - [ ] authenticate():
    - [ ] Extract token from Authorization header
    - [ ] Verify token with auth service
    - [ ] Attach user to request object
    - [ ] Handle missing/invalid tokens
    - [ ] Return 401 for unauthorized
  - [ ] authorize(...roles: string[]):
    - [ ] Check if user has required role
    - [ ] Return 403 for forbidden
    - [ ] Allow multiple roles
  - [ ] refreshToken():
    - [ ] Extract refresh token from cookie
    - [ ] Verify and rotate token
    - [ ] Set new cookie
    - [ ] Return new access token
- [ ] Create middleware/rateLimiter.middleware.ts:
  - [ ] Use express-rate-limit
  - [ ] Auth endpoints: 5 requests per minute
  - [ ] API endpoints: 100 requests per minute
  - [ ] Different limits by tier
  - [ ] Store in Redis
- [ ] Augment Express Request type:
  - [ ] Add user property
  - [ ] Add userId helper
  - [ ] Type definitions in @types/express
- [ ] Create error handling:
  - [ ] Consistent error format
  - [ ] Proper status codes
  - [ ] Security headers
- [ ] Create tests:
  - [ ] Valid token scenarios
  - [ ] Invalid token scenarios
  - [ ] Role checking
  - [ ] Rate limiting
```

---

### Issue #34: Implement User Registration Endpoint
**Labels**: `P1`, `M3-Auth`, `MVP`, `api`, `ai-ready`  
**Depends on**: #31, #32  
**Description**: Create user registration endpoint with email verification

**Acceptance Criteria**:
```
- [ ] Create POST /api/v1/auth/register:
  - [ ] Request body: email, username, password
  - [ ] Joi validation schema:
    - [ ] Email: valid format
    - [ ] Username: 3-20 chars, alphanumeric
    - [ ] Password: min 8 chars, complexity rules
  - [ ] Check for existing email/username
  - [ ] Hash password with bcrypt (12 rounds)
  - [ ] Generate email verification token
  - [ ] Save user with unverified status
  - [ ] Send verification email (console.log for now)
  - [ ] Return success response (no tokens yet)
- [ ] Create controller structure:
  - [ ] controllers/auth.controller.ts
  - [ ] Proper error handling
  - [ ] Async/await pattern
- [ ] Create service layer:
  - [ ] services/user.service.ts
  - [ ] Business logic separation
  - [ ] Reusable methods
- [ ] Add integration tests:
  - [ ] Valid registration
  - [ ] Duplicate email/username
  - [ ] Invalid input
  - [ ] Password hashing verification
```

---

### Issue #35: Implement Login Endpoint
**Labels**: `P1`, `M3-Auth`, `MVP`, `api`, `ai-ready`  
**Depends on**: #32, #34  
**Description**: Create login endpoint with JWT token generation

**Acceptance Criteria**:
```
- [ ] Create POST /api/v1/auth/login:
  - [ ] Request body: email/username, password
  - [ ] Find user by email or username
  - [ ] Verify password with bcrypt
  - [ ] Check if email is verified
  - [ ] Generate access and refresh tokens
  - [ ] Set refresh token as httpOnly cookie
  - [ ] Update lastLoginAt timestamp
  - [ ] Return user data + access token
- [ ] Implement security measures:
  - [ ] Track failed login attempts
  - [ ] Temporary lockout after 5 failures
  - [ ] Log suspicious activity
- [ ] Handle edge cases:
  - [ ] Unverified email
  - [ ] Suspended account
  - [ ] Invalid credentials
- [ ] Create tests:
  - [ ] Successful login
  - [ ] Wrong password
  - [ ] Non-existent user
  - [ ] Account lockout
```

---

### Issue #36: Implement Token Refresh Endpoint
**Labels**: `P1`, `M3-Auth`, `MVP`, `api`, `ai-ready`  
**Depends on**: #32, #33  
**Description**: Create endpoint for refreshing access tokens

**Acceptance Criteria**:
```
- [ ] Create POST /api/v1/auth/refresh:
  - [ ] Extract refresh token from cookie
  - [ ] Verify refresh token
  - [ ] Check blacklist
  - [ ] Generate new token pair
  - [ ] Blacklist old refresh token
  - [ ] Set new refresh token cookie
  - [ ] Return new access token
- [ ] Handle errors:
  - [ ] Missing refresh token
  - [ ] Invalid/expired token
  - [ ] Blacklisted token
- [ ] Add security