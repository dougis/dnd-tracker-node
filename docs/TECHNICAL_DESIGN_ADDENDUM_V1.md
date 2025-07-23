# Technical Design Addendum: V1 Enhancements

**Version:** 1.1  
**Date:** July 23, 2025  
**Context:** This document provides the technical design for enhancements and gap-fixes identified in the core Technical Design (Version 4.0). It includes items that can be implemented post-launch without significant rework.

---

## 1. Usage Limit Reset Mechanism

### 1.1. Objective

To automatically reset the usage counters for users on subscription plans at the beginning of each billing cycle, ensuring alignment with the freemium model.

### 1.2. Proposed Solution

A scheduled job will run within the Express server process to periodically check for subscriptions that have completed their billing cycle and require a usage reset.

### 1.3. Technology

-   **Scheduler:** `node-cron` library. A lightweight and reliable task scheduler for Node.js with no external dependencies.

### 1.4. Implementation Details

#### 1.4.1. Scheduled Job Logic

A new file, `server/src/jobs/usageReset.job.ts`, will be created.

```typescript
// server/src/jobs/usageReset.job.ts
import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export class UsageResetJob {
  // Schedule to run once every day at 00:05 UTC.
  public static start() {
    cron.schedule('5 0 * * *', this.run, {
      scheduled: true,
      timezone: 'UTC',
    });
    logger.info('Usage Reset Job scheduled to run daily at 00:05 UTC.');
  }

  private static async run() {
    logger.info('Running daily usage reset job...');
    try {
      const now = new Date();
      const subscriptionsToReset = await prisma.subscription.findMany({
        where: {
          status: 'ACTIVE',
          cancelAtPeriodEnd: false,
          currentPeriodEnd: {
            lte: now, // Find subscriptions whose billing period has ended.
          },
        },
      });

      if (subscriptionsToReset.length === 0) {
        logger.info('No subscriptions require usage reset today.');
        return;
      }

      for (const sub of subscriptionsToReset) {
        await prisma.usage.update({
          where: { userId: sub.userId },
          data: {
            partiesCreated: 0,
            encountersCreated: 0,
            creaturesCreated: 0,
            lastResetDate: now,
          },
        });
        logger.info(`Usage reset for user ${sub.userId}.`);
      }
      logger.info(`Successfully reset usage for ${subscriptionsToReset.length} users.`);
    } catch (error) {
      logger.error({
        msg: 'Error occurred during usage reset job.',
        error,
      });
    }
  }
}
```

#### 1.4.2. Integration

The job will be started from the main application entry point, `server/src/app.ts`.

```typescript
// In server/src/app.ts
import { UsageResetJob } from './jobs/usageReset.job';

// ... after server initialization
if (process.env.NODE_ENV === 'production') {
  UsageResetJob.start();
}
```

### 1.5. Schema and API Impact

-   **Schema:** No changes required. The existing `Usage` and `Subscription` models are sufficient.
-   **API:** No changes required. This is a purely internal, server-side process.

### 1.6. Testing Strategy

-   **Unit Tests:** Create tests for the `UsageResetJob.run` method to verify its logic using a mocked Prisma client. Test edge cases like no users needing a reset and error handling.
-   **Integration Tests:** In a test environment, manually set a subscription's `currentPeriodEnd` to a past date, trigger the job, and assert that the corresponding `Usage` record is reset in the database.

---

## 2. Real-time State Reconciliation on Reconnect

### 2.1. Objective

To ensure that a client's view of an encounter is always consistent and up-to-date, even if their real-time connection (SSE) is temporarily interrupted.

### 2.2. Proposed Solution

Implement a client-driven fetch-and-sync protocol that triggers upon SSE connection establishment. This involves adding a versioning system to encounters to facilitate state comparison.

### 2.3. Schema Impact

The `Encounter` model will be updated to include a version number.

```prisma
// In prisma/schema.prisma

model Encounter {
  // ... existing fields
  version       Int                 @default(1) // Add this line
  
  // ... existing fields
}
```

The `version` field will be atomically incremented within a transaction for every action that modifies the encounter state (e.g., updating HP, changing turns, applying conditions).

### 2.4. Server-Side Implementation

#### 2.4.1. Version Incrementation

All service methods that modify an encounter must now increment the `version` field.

```typescript
// Example in server/src/services/encounter.service.ts
async function updateParticipantHP(encounterId: string, participantId: string, newHp: number) {
  return prisma.$transaction(async (tx) => {
    // ... logic to update participant HP
    
    const updatedEncounter = await tx.encounter.update({
      where: { id: encounterId },
      data: {
        version: {
          increment: 1,
        },
      },
      select: { version: true },
    });

    return updatedEncounter.version;
  });
}
```

#### 2.4.2. API and SSE Payloads

-   The `GET /encounters/:id` endpoint response must include the `version` number of the encounter.
-   All SSE event data payloads related to an encounter must include the new `version` number after the update.

```json
// Example SSE event payload
{
  "event": "hp-update",
  "data": {
    "participantId": "...",
    "newHp": 50,
    "version": 12 // The new version after this update
  }
}
```

### 2.5. Client-Side Implementation

The `useSSE` hook will be enhanced to manage the reconciliation logic.

```typescript
// client/src/hooks/useSSE.ts (Conceptual Changes)
import { useEncounterStore } from '@/stores/encounterStore'; // Assuming a store for encounter state

export function useSSE(url: string, options: SSEOptions = {}) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const isReconciling = useRef(false);
  const eventBuffer = useRef<MessageEvent[]>([]);
  const { fetchEncounter, setEncounterState } = useEncounterStore();

  const connect = useCallback(() => {
    // ... existing connection logic

    eventSource.onopen = async (event) => {
      console.log('SSE connected:', url);
      isReconciling.current = true;
      eventBuffer.current = [];

      try {
        // 1. Fetch the full, current state of the encounter
        const encounterId = url.split('/').pop(); // Extract ID from URL
        const freshState = await fetchEncounter(encounterId);
        
        // 2. Update the store with the fresh state
        setEncounterState(freshState);
        const serverVersion = freshState.version;

        // 3. Process buffered events, discarding stale ones
        eventBuffer.current.forEach(e => {
          const eventData = JSON.parse(e.data);
          if (eventData.version > serverVersion) {
            options.onMessage?.(e); // Process only newer events
          }
        });
        
      } catch (error) {
        console.error('Failed to reconcile state on reconnect:', error);
      } finally {
        isReconciling.current = false;
        eventBuffer.current = [];
      }
    };

    eventSource.onmessage = (event) => {
      if (isReconciling.current) {
        // Buffer events while reconciliation is in progress
        eventBuffer.current.push(event);
      } else {
        // Process events normally
        options.onMessage?.(event);
      }
    };

    // ... rest of the hook
  }, [url, options, fetchEncounter, setEncounterState]);

  // ...
}
```

### 2.6. Testing Strategy

-   **E2E Tests (Playwright):**
    -   Create a test that establishes an SSE connection.
    -   Simulate a network disconnect by blocking the SSE endpoint URL.
    -   Perform an action via the API that would normally trigger an SSE event (e.g., deal damage).
    -   Unblock the SSE endpoint to allow reconnection.
    -   Assert that the client's UI correctly reflects the state change that occurred during the disconnect, verifying that the reconciliation logic worked.
-   **Unit Tests:** Test the client-side event buffering and version comparison logic in isolation.
