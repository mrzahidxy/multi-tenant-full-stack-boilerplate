import type { Metadata } from 'next'

import { SettingsPage } from '@/features/business-owner'

export const metadata: Metadata = {
  title: 'Settings',
}

export default function BusinessOwnerSettingsPage() {
  return <SettingsPage />
}
