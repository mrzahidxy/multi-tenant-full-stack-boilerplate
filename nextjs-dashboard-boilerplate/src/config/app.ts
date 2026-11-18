import { env } from '@/config/env'

export const appConfig = {
  name: 'Workspace Dashboard',
  description:
    'Multi-tenant dashboard starter for managing projects and teams.',
  url: env.NEXT_PUBLIC_SITE_URL,
  apiBaseUrl: env.NEXT_PUBLIC_API_BASE_URL,
  auth: {
    signInPath: '/login',
    signUpPath: '/register',
    adminHome: '/admin/overview',
    appHome: '/business-owner/projects',
    userHome: '/user/bookings',
    noAccessPath: '/access-denied',
  },
} as const
