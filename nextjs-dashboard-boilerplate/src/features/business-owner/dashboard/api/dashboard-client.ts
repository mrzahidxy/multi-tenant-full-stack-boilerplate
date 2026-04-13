'use client'

import { apiClient } from '@/lib/api'

import { buildScopedAnalyticsQuery } from '../../analytics/api/analytics-client'
import type {
  AnalyticsOverviewResponse,
  AnalyticsQueryParams,
} from '../../analytics/types'

export type DashboardOverviewQuery = AnalyticsQueryParams
export type DashboardOverviewResponse = AnalyticsOverviewResponse

const DEFAULT_TOP_LIMIT = 6

export async function fetchDashboardOverview(
  query?: DashboardOverviewQuery,
  scope?: { businessId?: string | null; organizerId?: string | null },
) {
  return apiClient.get<DashboardOverviewResponse>('/api/analytics/overview', {
    auth: true,
    cache: 'no-store',
    query: buildScopedAnalyticsQuery(
      {
        ...query,
        topLimit: query?.topLimit ?? DEFAULT_TOP_LIMIT,
      },
      scope,
    ),
  })
}
