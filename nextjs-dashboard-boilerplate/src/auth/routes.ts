import type { Route } from 'next'

import { appConfig } from '@/config/app'
import { isAdminRole } from '@/types/user'

export const authRoutes = appConfig.auth

export function getDefaultRedirectForRole(role?: string | null): Route {
  return (isAdminRole(role) ? authRoutes.adminHome : authRoutes.appHome) as Route
}
