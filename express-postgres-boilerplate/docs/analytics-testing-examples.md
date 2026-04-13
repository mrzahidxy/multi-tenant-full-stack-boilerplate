# Analytics Testing Examples

The analytics module exposes `createAnalyticsService(...)` so you can unit test service logic without booting Express.

The project does not currently ship with a dedicated test runner configuration, so the examples below use `node:test` semantics and simple dependency injection. You can adapt the same patterns to Jest, Vitest, or your preferred runner.

## 1. Mocking Prisma and Cache

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

import { Role } from '@prisma/client';

import { createAnalyticsService } from '../src/services/analytics.service';

test('admin overview returns cached payload when Redis has a hit', async () => {
  const cachedOverview = {
    scope: { visibility: 'platform', organizerIds: [] },
    dateRange: {
      dateFrom: '2026-01-01T00:00:00.000Z',
      dateTo: '2026-01-31T23:59:59.999Z',
      granularity: 'day',
    },
    bookingSummary: {
      totalBookings: 4,
      totalRevenue: 240,
      averageOrderValue: 60,
      bookingsByStatus: [],
    },
    paymentSummary: {
      totalPayments: 4,
      totalRevenue: 240,
      averageTransactionValue: 60,
      successRate: 100,
      failureRate: 0,
      revenueByStatus: [],
    },
    eventSummary: {
      totalEvents: 2,
      publishedEvents: 2,
      unpublishedEvents: 0,
      averageEventPrice: 120,
    },
    userSummary: {
      totalScopedUsers: 3,
      registrationsInRange: 1,
      activeUsersByRole: [],
    },
    topEvents: [],
  };

  const analytics = createAnalyticsService({
    prisma: {
      organizer: {
        findUnique: async () => null,
      },
      organizerStaff: {
        findMany: async () => [],
      },
      $queryRaw: async () => {
        throw new Error('query should not execute on cache hit');
      },
    } as any,
    cache: {
      isConnectedToRedis: () => true,
      get: async () => cachedOverview,
      set: async () => undefined,
    } as any,
    logger: {
      error: () => undefined,
    } as any,
  });

  const result = await analytics.getOverview(
    {
      id: 1,
      email: 'admin@example.com',
      name: 'Admin',
      role: Role.ADMIN,
      roles: [Role.ADMIN],
      organizerId: null,
      permissions: ['ANALYTICS_READ'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {}
  );

  assert.deepEqual(result, cachedOverview);
});
```

## 2. Testing Organizer Isolation

This verifies that staff users can only access analytics for organizers they are assigned to.

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

import { Role } from '@prisma/client';

import { createAnalyticsService } from '../src/services/analytics.service';
import { HttpError } from '../src/utils/http-error';

test('staff cannot access analytics for an unassigned organizer', async () => {
  const analytics = createAnalyticsService({
    prisma: {
      organizer: {
        findUnique: async () => null,
      },
      organizerStaff: {
        findMany: async () => [{ organizerId: 'assigned-organizer-id' }],
      },
      $queryRaw: async () => [],
    } as any,
    cache: {
      isConnectedToRedis: () => false,
      get: async () => null,
      set: async () => undefined,
    } as any,
    logger: {
      error: () => undefined,
    } as any,
  });

  await assert.rejects(
    () =>
      analytics.getOverview(
        {
          id: 2,
          email: 'staff@example.com',
          name: 'Staff',
          role: Role.STAFF,
          roles: [Role.STAFF],
          organizerId: null,
          permissions: ['ANALYTICS_READ'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { organizerId: 'other-organizer-id' }
      ),
    (error: unknown) =>
      error instanceof HttpError &&
      error.statusCode === 403 &&
      error.message.includes('permission')
  );
});
```

## 3. Mocking Raw Prisma Aggregations

The service uses raw SQL for most analytics. A practical testing pattern is to return different row sets based on call order.

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

import { Role } from '@prisma/client';

import { createAnalyticsService } from '../src/services/analytics.service';

test('booking analytics maps aggregate rows into API payloads', async () => {
  const queryResults = [
    [
      {
        totalBookings: 3,
        pendingBookings: 1,
        confirmedBookings: 1,
        cancelledBookings: 0,
        completedBookings: 1,
        confirmedRevenue: 100,
        completedRevenue: 80,
        totalRevenue: 180,
        averageOrderValue: 90,
      },
    ],
    [
      { period: new Date('2026-03-01T00:00:00.000Z'), bookingCount: 2, revenue: 100 },
      { period: new Date('2026-03-02T00:00:00.000Z'), bookingCount: 1, revenue: 80 },
    ],
    [{ totalItems: 1 }],
    [
      {
        eventId: '5f0807a2-0ab2-470e-a2f5-c0a465f66588',
        eventName: 'Spring Launch',
        organizerId: '8e917d0b-bcc8-42c0-8c75-cf496bc15bcc',
        organizerName: 'Northwind',
        bookingCount: 3,
        revenue: 180,
      },
    ],
  ];

  const analytics = createAnalyticsService({
    prisma: {
      organizer: {
        findUnique: async () => ({ id: '8e917d0b-bcc8-42c0-8c75-cf496bc15bcc' }),
      },
      organizerStaff: {
        findMany: async () => [],
      },
      $queryRaw: async () => queryResults.shift() ?? [],
    } as any,
    cache: {
      isConnectedToRedis: () => false,
      get: async () => null,
      set: async () => undefined,
    } as any,
    logger: {
      error: () => undefined,
    } as any,
  });

  const result = await analytics.getBookingAnalytics(
    {
      id: 1,
      email: 'owner@example.com',
      name: 'Owner',
      role: Role.OWNER,
      roles: [Role.OWNER],
      organizerId: '8e917d0b-bcc8-42c0-8c75-cf496bc15bcc',
      permissions: ['ANALYTICS_READ'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      granularity: 'day',
      dateFrom: new Date('2026-03-01T00:00:00.000Z'),
      dateTo: new Date('2026-03-31T00:00:00.000Z'),
      page: 1,
      limit: 10,
    }
  );

  assert.equal(result.summary.totalBookings, 3);
  assert.equal(result.summary.totalRevenue, 180);
  assert.equal(result.trends.length, 2);
  assert.equal(result.topEvents.data[0]?.eventName, 'Spring Launch');
});
```

## 4. Suggested Coverage

- Booking analytics: empty dataset, mixed statuses, pagination on top events.
- Payment analytics: success/failure rate calculations and pending-only datasets.
- Event analytics: published/unpublished counts and average price calculations.
- User analytics: registration trends and staff performance pagination.
- Scope rules: admin platform view, admin organizer-scoped view, owner single-organizer view, and staff assignment checks.
- Cache behavior: Redis hit, Redis miss, and Redis unavailable fallbacks.
