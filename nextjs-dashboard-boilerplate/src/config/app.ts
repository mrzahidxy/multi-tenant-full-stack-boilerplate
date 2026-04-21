import { env } from '@/config/env'

export const appConfig = {
  name: 'Event Booking Dashboard',
  description:
    'Production-ready Next.js starter template for event organizers, bookings, payments, and internal operations.',
  url: env.NEXT_PUBLIC_SITE_URL,
  apiBaseUrl: env.NEXT_PUBLIC_API_BASE_URL,
  auth: {
    signInPath: '/login',
    signUpPath: '/register',
    adminHome: '/admin/overview',
    appHome: '/business-owner/dashboard',
    userHome: '/user/bookings',
    noAccessPath: '/access-denied',
  },
} as const
