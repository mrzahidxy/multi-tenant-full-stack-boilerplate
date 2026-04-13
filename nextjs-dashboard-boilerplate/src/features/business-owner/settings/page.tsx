'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  ActivityList,
  type Activity as AuditEntry,
} from '../dashboard/components/activity-list'
import { DashboardHeader } from '../dashboard/components/dashboard-header'
import { ProgressBar } from '../dashboard/components/progress-bar'
import { SectionCard } from '../dashboard/components/section-card'
import { SettingsItem, SettingsList } from '../dashboard/components/settings-item'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { getPaymentHistory } from '@/lib/api/payments-client'
import { paymentKeys } from '@/lib/api/payments-keys'
import { uploadImage } from '@/lib/api/upload-client'
import { uploadKeys } from '@/lib/api/upload-keys'
import { formatCurrency, formatDateTime } from '@/lib/format'
import {
  AlertCircle,
  BarChart3,
  Copy,
  CreditCard,
  Database,
  Download,
  Mail,
  ShieldCheck,
  Upload,
} from 'lucide-react'

const auditLog: AuditEntry[] = [
  {
    id: '1',
    title: 'Settings updated',
    description: 'Avery Booker - 2 hours ago',
  },
  {
    id: '2',
    title: 'Staff member invited',
    description: 'Avery Booker - 1 day ago',
  },
  {
    id: '3',
    title: 'Backup created',
    description: 'System - 1 day ago',
  },
  {
    id: '4',
    title: 'Webhook secret rotated',
    description: 'Avery Booker - 3 days ago',
  },
]

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
        description="Organizer configuration and operational integrations"
      />

      <SectionCard
        title="Plan Information"
        subtitle="Manage access plan details and activation metadata."
        icon={<ShieldCheck className="h-5 w-5" />}
      >
        <div className="space-y-4 rounded-2xl border border-teal-100 bg-teal-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-teal-800">Active plan</p>
              <p className="text-xs text-teal-700">Event platform plan - Self-hosted</p>
            </div>
            <Badge variant="success">Activated</Badge>
          </div>
          <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Plan key
              </p>
              <p className="text-sm font-mono tracking-wide text-slate-700">
                EVT-OPS-3XXQ-XXXX-XXXX
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Storage Integration"
        subtitle="Control where event assets are stored and track usage."
        icon={<Database className="h-5 w-5" />}
      >
        <div className="space-y-6">
          <SettingsList>
            <SettingsItem
              label="Storage provider"
              description="Location for event images, exports, and backups."
            >
              <Select defaultValue="local">
                <option value="local">Local storage (default)</option>
                <option value="s3">Amazon S3</option>
                <option value="gcs">Google Cloud Storage</option>
              </Select>
            </SettingsItem>
            <SettingsItem
              label="Storage usage"
              description="Event banners, uploads, and exports"
            >
              <ProgressBar value={127} max={5120} helper="127 MB / 5 GB" />
            </SettingsItem>
            <SettingsItem
              label="Upload organizer image"
              description="Uses `/uploads/image` with multipart field name `file`."
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
          </SettingsList>
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
        subtitle="Recent payment history returned by the backend."
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

      <SectionCard
        title="Email Settings"
        subtitle="Send booking notifications and organizer communications."
        icon={<Mail className="h-5 w-5" />}
      >
        <SettingsList>
          <SettingsItem
            label="Email notifications"
            description="Receive updates about bookings, payouts, and staff activity."
          >
            <Switch defaultChecked aria-label="Toggle email notifications" />
          </SettingsItem>
          <SettingsItem
            label="SMTP server (optional)"
            description="Configure custom SMTP for attendee emails and staff invitations."
          >
            <Input placeholder="smtp.example.com" />
          </SettingsItem>
        </SettingsList>
      </SectionCard>

      <SectionCard
        title="Analytics Configuration"
        subtitle="Fine-tune event reporting and retention policies."
        icon={<BarChart3 className="h-5 w-5" />}
      >
        <SettingsList>
          <SettingsItem
            label="Privacy-first analytics"
            description="Anonymous attendee and organizer reporting."
          >
            <Switch defaultChecked aria-label="Toggle privacy analytics" />
          </SettingsItem>
          <SettingsItem
            label="Checkout attribution"
            description="Track which event pages lead to completed bookings."
          >
            <Switch defaultChecked aria-label="Toggle checkout attribution" />
          </SettingsItem>
          <SettingsItem label="Data retention" description="How long analytics data is stored.">
            <Select defaultValue="90">
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="180">180 days</option>
              <option value="365">1 year</option>
            </Select>
          </SettingsItem>
        </SettingsList>
      </SectionCard>

      <SectionCard
        title="Backup & Export"
        subtitle="Keep your organizer workspace safe with scheduled backups."
        icon={<Download className="h-5 w-5" />}
      >
        <SettingsList>
          <SettingsItem
            label="Automatic backups"
            description="Daily snapshots of bookings, users, and payment records."
          >
            <Switch defaultChecked aria-label="Toggle automatic backups" />
          </SettingsItem>
          <SettingsItem label="Last backup" description="Today at 3:00 AM - 2.4 MB">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download backup
              </Button>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Restore
              </Button>
            </div>
          </SettingsItem>
          <SettingsItem
            label="Storage costs"
            description="Adjust plan for more retention or media storage."
          >
            <p className="text-sm font-semibold text-slate-700">
              {formatCurrency(12)} / month for 10 GB
            </p>
          </SettingsItem>
        </SettingsList>
      </SectionCard>

      <SectionCard
        title="Audit Log"
        subtitle="Track security-sensitive actions across the organizer workspace."
        icon={<AlertCircle className="h-5 w-5" />}
      >
        <ActivityList
          items={auditLog}
          footer={
            <Button variant="outline" className="w-full sm:w-auto">
              View full log
            </Button>
          }
        />
      </SectionCard>
    </div>
  )
}
