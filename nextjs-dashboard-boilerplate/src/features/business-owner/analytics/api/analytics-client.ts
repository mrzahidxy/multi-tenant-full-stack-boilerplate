'use client'

import { apiClient } from '@/lib/api'

import {
  buildAnalyticsQuery,
  resolveOrganizerScopeId,
} from '../utils'
import type {
  AnalyticsBookingsResponse,
  AnalyticsEventsResponse,
  AnalyticsOverviewResponse,
  AnalyticsPaymentsResponse,
  AnalyticsQueryParams,
  AnalyticsUsersResponse,
} from '../types'

export type AnalyticsQuery = AnalyticsQueryParams

export function buildScopedAnalyticsQuery(
  query?: AnalyticsQuery,
  scope?: { businessId?: string | null; organizerId?: string | null },
) {
  return buildAnalyticsQuery({
    ...query,
    organizerId: query?.organizerId ?? resolveOrganizerScopeId(scope ?? null),
  })
}

export async function fetchAnalyticsOverview(query?: AnalyticsQuery) {
  return apiClient.get<AnalyticsOverviewResponse>('/api/analytics/overview', {
    auth: true,
    cache: 'no-store',
    query: buildAnalyticsQuery(query ?? {}),
  })
}

export async function fetchAnalyticsBookings(query?: AnalyticsQuery) {
  return apiClient.get<AnalyticsBookingsResponse>('/api/analytics/bookings', {
    auth: true,
    cache: 'no-store',
    query: buildAnalyticsQuery(query ?? {}),
  })
}

export async function fetchAnalyticsPayments(query?: AnalyticsQuery) {
  return apiClient.get<AnalyticsPaymentsResponse>('/api/analytics/payments', {
    auth: true,
    cache: 'no-store',
    query: buildAnalyticsQuery(query ?? {}),
  })
}

export async function fetchAnalyticsEvents(query?: AnalyticsQuery) {
  return apiClient.get<AnalyticsEventsResponse>('/api/analytics/events', {
    auth: true,
    cache: 'no-store',
    query: buildAnalyticsQuery(query ?? {}),
  })
}

export async function fetchAnalyticsUsers(query?: AnalyticsQuery) {
  return apiClient.get<AnalyticsUsersResponse>('/api/analytics/users', {
    auth: true,
    cache: 'no-store',
    query: buildAnalyticsQuery(query ?? {}),
  })
}
