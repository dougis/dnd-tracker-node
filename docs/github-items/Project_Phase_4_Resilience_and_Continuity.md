# GitHub Project: Phase 4 - Resilience & Continuity

**Objective:** Implement enhancements to improve system resilience, data consistency, and business continuity.

---

## Milestone 4.1: Core System Resilience

### Issue: Implement Real-time State Reconciliation on Reconnect

- **Title:** `feat: Implement real-time state reconciliation on reconnect`
- **Labels:** `priority: high`, `type: feature`, `effort: ai`, `component: frontend`, `component: backend`
- **Details:**
  - Add a `version` field to the `Encounter` model in `prisma/schema.prisma` to track state changes.
  - Update all backend services that modify an encounter to atomically increment the `version` number.
  - Ensure all encounter-related API and SSE payloads include the `version` number.
  - Enhance the client-side `useSSE` hook to fetch the full encounter state upon reconnecting, compare versions, and process a buffer of any events that occurred during the disconnect.
- **Acceptance Criteria:**
  - [ ] The `Encounter` model has a `version` field that increments with every state change.
  - [ ] The `GET /api/v1/encounters/:id` endpoint returns the current `version`.
  - [ ] All SSE events for an encounter include the new `version`.
  - [ ] If the client disconnects and misses an update, upon reconnection it fetches the latest state and updates its view correctly.

### Issue: Implement Usage Limit Reset Mechanism

- **Title:** `feat: Implement usage limit reset mechanism`
- **Labels:** `priority: critical`, `type: feature`, `effort: ai`, `component: backend`, `component: payments`
- **Details:**
  - Create a scheduled job using `node-cron` that runs once daily at a set time (e.g., 00:05 UTC).
  - The job must query for all active subscriptions where the `currentPeriodEnd` date has passed.
  - For each of these subscriptions, the job will reset the `partiesCreated`, `encountersCreated`, and `creaturesCreated` counters in the corresponding `Usage` table to 0.
  - The job should be configured to start only when the application is running in a `production` environment.
- **Acceptance Criteria:**
  - [ ] The scheduled job is created and runs once per day.
  - [ ] A user's usage counters are successfully reset to 0 the day after their subscription billing period ends.
  - [ ] The job includes robust logging for success and failure cases.
