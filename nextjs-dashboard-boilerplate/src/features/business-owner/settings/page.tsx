'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { DashboardHeader } from '../dashboard/components/dashboard-header'
import { SectionCard } from '../dashboard/components/section-card'
import { SettingsItem } from '../dashboard/components/settings-item'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { getPaymentHistory } from '@/lib/api/payments-client'
import { paymentKeys } from '@/lib/api/payments-keys'
import { uploadImage } from '@/lib/api/upload-client'
import { uploadKeys } from '@/lib/api/upload-keys'
import { formatCurrency, formatDateTime } from '@/lib/format'
import {
  CreditCard,
  Database,
  Upload,
} from 'lucide-react'

export default function SettingsPage() {
  const [file, setFile] = useState<File | null>(null)
  const paymentHistoryQuery = useQuery({
    queryKey: paymentKeys.history(),
    queryFn: getPaymentHistory,
  })

  const uploadMutation = useMutation({
    mutationKey: uploadKeys.image(),
    mutationFn: (imageFile: File) => uploadImage(imageFile),
    onSuccess: () => {
      toast.success('Image uploaded')
      setFile(null)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Unable to upload image')
    },
  })

  const recentPayments = useMemo(
    () => (paymentHistoryQuery.data ?? []).slice(0, 5),
    [paymentHistoryQuery.data],
  )

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Settings"
        description="Only backend-supported settings are shown."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Storage Integration"
          subtitle="Supported endpoint: `/api/uploads/image`."
          icon={<Database className="h-5 w-5" />}
        >
          <div className="space-y-6">
            <SettingsItem
              label="Upload organizer image"
              description="Uses multipart field name `file`."
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
                <Button
                  onClick={() => {
                    if (!file) {
                      toast.error('Choose an image to upload')
                      return
                    }

                    uploadMutation.mutate(file)
                  }}
                  disabled={uploadMutation.isPending}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </SettingsItem>
            {uploadMutation.data ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Uploaded <span className="font-medium">{uploadMutation.data.fileName}</span> at{' '}
                {formatDateTime(uploadMutation.data.uploadedAt)}.
              </div>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard
          title="Payment Activity"
          subtitle="Supported endpoint: `/api/payments/history`."
          icon={<CreditCard className="h-5 w-5" />}
        >
          <div className="space-y-3">
            {paymentHistoryQuery.isLoading ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Loading payment history...
              </div>
            ) : recentPayments.length ? (
              recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(payment.amount)} {payment.currency}
                    </p>
                    <p className="text-xs text-slate-500">
                      Booking #{payment.bookingId} • {payment.method} • {payment.provider}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={payment.status === 'SUCCEEDED' ? 'success' : 'outline'}>
                      {payment.status}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {payment.createdAt ? formatDateTime(payment.createdAt) : 'Unknown date'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                No payments were returned by `/payments/history`.
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
