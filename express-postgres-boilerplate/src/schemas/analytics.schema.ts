import { BookingStatus, PaymentStatus, Role } from '@prisma/client';
import { z } from 'zod';

const ANALYTICS_MAX_RANGE_DAYS = 366;

export const analyticsGranularitySchema = z.enum(['day', 'week', 'month']);

export const analyticsQuerySchema = z
  .object({
    organizerId: z.string().uuid().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    granularity: analyticsGranularitySchema.optional().default('day'),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    topLimit: z.coerce.number().int().positive().max(20).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.dateFrom && data.dateTo && data.dateFrom.getTime() > data.dateTo.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dateTo'],
        message: 'dateTo must be greater than or equal to dateFrom',
      });
    }

    if (data.dateFrom && data.dateTo) {
      const durationMs = data.dateTo.getTime() - data.dateFrom.getTime();
      const durationDays = durationMs / (1000 * 60 * 60 * 24);

      if (durationDays > ANALYTICS_MAX_RANGE_DAYS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dateTo'],
          message: `Analytics range cannot exceed ${ANALYTICS_MAX_RANGE_DAYS} days`,
        });
      }
    }
  });

export const analyticsComparisonRequestSchema = z
  .object({
    organizerIds: z.array(z.string().uuid()).min(1).max(10),
    dateFrom: z.coerce.date(),
    dateTo: z.coerce.date(),
    granularity: analyticsGranularitySchema.optional().default('day'),
  })
  .superRefine((data, ctx) => {
    if (data.dateFrom.getTime() > data.dateTo.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dateTo'],
        message: 'dateTo must be greater than or equal to dateFrom',
      });
    }
  });

const analyticsScopeSchema = z.object({
  visibility: z.enum(['platform', 'organizer']),
  organizerIds: z.array(z.string().uuid()),
});

const analyticsDateRangeResponseSchema = z.object({
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
  granularity: analyticsGranularitySchema,
});

const paginatedMetaSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

const bookingStatusMetricSchema = z.object({
  status: z.nativeEnum(BookingStatus),
  count: z.number().int().nonnegative(),
  revenue: z.number().nonnegative(),
});

const paymentStatusMetricSchema = z.object({
  status: z.nativeEnum(PaymentStatus),
  count: z.number().int().nonnegative(),
  revenue: z.number().nonnegative(),
});

const roleMetricSchema = z.object({
  role: z.nativeEnum(Role),
  count: z.number().int().nonnegative(),
});

const trendPointSchema = z.object({
  period: z.string().datetime(),
  primaryValue: z.number().nonnegative(),
  secondaryValue: z.number().nonnegative().optional(),
});

const topEventMetricSchema = z.object({
  eventId: z.string().uuid(),
  eventName: z.string(),
  organizerId: z.string().uuid(),
  organizerName: z.string(),
  bookingCount: z.number().int().nonnegative(),
  revenue: z.number().nonnegative(),
});

const organizerEventMetricSchema = z.object({
  organizerId: z.string().uuid(),
  organizerName: z.string(),
  totalEvents: z.number().int().nonnegative(),
  publishedEvents: z.number().int().nonnegative(),
  unpublishedEvents: z.number().int().nonnegative(),
  averagePrice: z.number().nonnegative(),
});

const staffPerformanceMetricSchema = z.object({
  userId: z.number().int().positive(),
  email: z.string().email(),
  name: z.string().nullable(),
  assignedOrganizerCount: z.number().int().nonnegative(),
  latestAssignmentAt: z.string().datetime().nullable(),
  bookingCount: z.number().int().nonnegative(),
  revenue: z.number().nonnegative(),
});

export const analyticsOverviewResponseSchema = z.object({
  scope: analyticsScopeSchema,
  dateRange: analyticsDateRangeResponseSchema,
  bookingSummary: z.object({
    totalBookings: z.number().int().nonnegative(),
    totalRevenue: z.number().nonnegative(),
    averageOrderValue: z.number().nonnegative(),
    bookingsByStatus: z.array(bookingStatusMetricSchema),
  }),
  paymentSummary: z.object({
    totalPayments: z.number().int().nonnegative(),
    totalRevenue: z.number().nonnegative(),
    averageTransactionValue: z.number().nonnegative(),
    successRate: z.number().min(0).max(100),
    failureRate: z.number().min(0).max(100),
    revenueByStatus: z.array(paymentStatusMetricSchema),
  }),
  eventSummary: z.object({
    totalEvents: z.number().int().nonnegative(),
    publishedEvents: z.number().int().nonnegative(),
    unpublishedEvents: z.number().int().nonnegative(),
    averageEventPrice: z.number().nonnegative(),
  }),
  userSummary: z.object({
    totalScopedUsers: z.number().int().nonnegative(),
    registrationsInRange: z.number().int().nonnegative(),
    activeUsersByRole: z.array(roleMetricSchema),
  }),
  topEvents: z.array(topEventMetricSchema),
});

export const bookingAnalyticsResponseSchema = z.object({
  scope: analyticsScopeSchema,
  dateRange: analyticsDateRangeResponseSchema,
  summary: z.object({
    totalBookings: z.number().int().nonnegative(),
    totalRevenue: z.number().nonnegative(),
    averageOrderValue: z.number().nonnegative(),
    bookingsByStatus: z.array(bookingStatusMetricSchema),
  }),
  trends: z.array(trendPointSchema),
  topEvents: z.object({
    data: z.array(topEventMetricSchema),
    meta: paginatedMetaSchema,
  }),
});

export const paymentAnalyticsResponseSchema = z.object({
  scope: analyticsScopeSchema,
  dateRange: analyticsDateRangeResponseSchema,
  summary: z.object({
    totalPayments: z.number().int().nonnegative(),
    totalRevenue: z.number().nonnegative(),
    averageTransactionValue: z.number().nonnegative(),
    successRate: z.number().min(0).max(100),
    failureRate: z.number().min(0).max(100),
    revenueByStatus: z.array(paymentStatusMetricSchema),
  }),
  trends: z.array(trendPointSchema),
});

export const eventAnalyticsResponseSchema = z.object({
  scope: analyticsScopeSchema,
  dateRange: analyticsDateRangeResponseSchema,
  summary: z.object({
    totalEvents: z.number().int().nonnegative(),
    publishedEvents: z.number().int().nonnegative(),
    unpublishedEvents: z.number().int().nonnegative(),
    averageEventPrice: z.number().nonnegative(),
  }),
  eventsByOrganizer: z.array(organizerEventMetricSchema),
  popularEvents: z.object({
    data: z.array(topEventMetricSchema),
    meta: paginatedMetaSchema,
  }),
});

export const userAnalyticsResponseSchema = z.object({
  scope: analyticsScopeSchema,
  dateRange: analyticsDateRangeResponseSchema,
  summary: z.object({
    totalScopedUsers: z.number().int().nonnegative(),
    registrationsInRange: z.number().int().nonnegative(),
    activeUsersByRole: z.array(roleMetricSchema),
  }),
  registrationTrends: z.array(trendPointSchema),
  staffPerformance: z.object({
    data: z.array(staffPerformanceMetricSchema),
    meta: paginatedMetaSchema,
  }),
});

export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
export type AnalyticsComparisonRequest = z.infer<typeof analyticsComparisonRequestSchema>;
