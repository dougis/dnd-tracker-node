# Design Impacts & Initial Phase Considerations

**Version:** 1.0  
**Date:** July 23, 2025

This document identifies the technical and operational impacts of the proposed enhancements. It categorizes them based on their urgency and effect on the initial development phase to guide implementation priorities.

---

## 1. [Integrated] High-Impact Items Merged into Core Technical Design

**Status:** All items in this section have been integrated into `TECHNICAL_DESIGN.md` as of July 23, 2025.

These items were identified as critical for security, data integrity, or core business functionality and have been incorporated into the primary technical design to mitigate risk and prevent rework.

### 1.1. Stripe Webhook Idempotency

- **Impact:** **Critical.** Without this, the payment system is vulnerable to data corruption from duplicate webhook events, potentially leading to incorrect subscription statuses and billing errors.
- **Reasoning:** Implementing this later would require a complex data cleanup process for any affected users. It is a foundational aspect of a robust payment integration, not an enhancement.
- **Action:** The Stripe webhook handler (`/webhooks/stripe`) **must** be designed to be idempotent from the very beginning of its implementation in Phase 2. This involves logging processed event IDs and skipping duplicates.

### 1.2. Production-Critical Rate Limiting

- **Impact:** **Critical.** The current design's fallback to in-memory rate limiting is unsafe for a multi-instance production environment.
- **Reasoning:** This is a fundamental architectural decision for security and scalability. Relying on an in-memory fallback would render rate limits ineffective in a distributed environment, exposing the API to abuse.
- **Action:** The application's configuration must enforce that **Redis is a hard dependency in the production environment**. The server should fail to start if a Redis connection cannot be established, preventing an insecure deployment. This should be configured during the initial setup in Week 1.

### 1.3. Account Lockout Mechanism

- **Impact:** **High.** This feature requires changes to the core `User` data model.
- **Reasoning:** Adding schema fields (`failedLoginAttempts`, `lockedUntil`) to a live database is more complex and riskier than including them from the start. As authentication is a Day 3 task in the implementation plan, incorporating this change is minimally disruptive.
- **Action:** The `User` model in `prisma/schema.prisma` should be modified during the initial authentication system implementation (Week 1). The associated business logic for locking accounts should be built into the login controller at that time.

### 1.4. System Template Seeding and Management

- **Impact:** **High.** The application's value at launch is significantly diminished without a pre-populated creature library.
- **Reasoning:** This is an operational requirement for a successful launch. Building the mechanism for seeding data is a standard part of initial development.
- **Action:** A database seeding script should be created as part of the initial database layer setup (Week 1). This script will populate the `Creature` table with system-defined templates and should be integrated into the CI/CD pipeline for automated deployments.

---

## 2. Items to Consider for the Initial Phase (Medium Impact)

This item is not a technical prerequisite for launch but is critical for business continuity shortly after.

### 2.1. Usage Limit Reset Mechanism

- **Impact:** **Medium.** The application will function correctly for the first billing cycle without this. However, it will fail for all users at the start of their second cycle.
- **Reasoning:** While technically a new feature that can be added later, the business impact of not having it is severe. All subscribed users would find their accounts restricted incorrectly one month after launch, leading to a poor user experience and likely churn.
- **Action:** It is **strongly recommended** to implement the scheduled job for resetting usage limits during Phase 2, alongside the full subscription system build-out. If deferred, it must be treated as the highest priority follow-up task to be completed before the first wave of subscriptions renew.

---

## 3. Items Suitable for Follow-up (Low Impact)

This item is a valuable enhancement that can be implemented after the initial launch without requiring rework of existing components.

### 3.1. Real-time State Reconciliation on Reconnect

- **Impact:** **Low.** The core real-time functionality will work as designed. This change adds a layer of robustness.
- **Reasoning:** The initial SSE implementation is self-contained. Adding a client-side reconciliation logic on reconnect is an enhancement that does not alter the existing event-pushing mechanism. The initial API and SSE event structure can be designed to accommodate this later addition with minimal friction (e.g., by including timestamps).
- **Action:** This can be deferred to a post-launch optimization effort. The design for this is detailed in the follow-up technical design document.
