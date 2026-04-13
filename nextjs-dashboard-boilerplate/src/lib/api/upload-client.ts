'use client'

import { apiClient } from '@/lib/api'
import { extractEntity, normalizeUploadRecord } from '@/lib/api/normalizers'

export async function uploadImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post<unknown>(
    '/api/uploads/image',
    formData,
    {
      auth: true,
    },
  )

  return extractEntity(response, ['upload', 'file'], normalizeUploadRecord)
}
