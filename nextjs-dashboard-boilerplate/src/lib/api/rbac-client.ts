'use client'

import { apiClient } from '@/lib/api'
import { normalizeRbacRoleDefinitions } from '@/lib/api/normalizers'

export async function getRbacDefinitions() {
  const response = await apiClient.get<unknown>(
    '/api/rbac/definitions',
    {
      auth: true,
      cache: 'no-store',
    },
  )

  return normalizeRbacRoleDefinitions(response)
}
