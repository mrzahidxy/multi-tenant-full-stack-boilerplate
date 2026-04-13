"use client";

import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/features/admin/components/ui/card'
import { listAdminAuditLogs, type AdminAuditLog } from '@/features/admin/api/admin-client'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/features/admin/components/ui/select'
import { Input } from '@/components/ui/input'
import { formatDateTime } from '@/lib/format'
import { DataTable } from '@/components/data-table'

const LOG_SCOPE_VARIANTS = {
  Organizer: 'outline',
  System: 'default',
} as const

export function LogsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [scopeFilter, setScopeFilter] = useState<'All' | 'Organizer' | 'System'>('All')
  const {
    data: logs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: listAdminAuditLogs,
  })

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.details ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      const matchesScope = scopeFilter === 'All' || log.scope === scopeFilter
      return matchesSearch && matchesScope
    })
  }, [logs, searchQuery, scopeFilter])

  const columns: ColumnDef<AdminAuditLog>[] = [
    {
      accessorKey: 'timestamp',
      header: 'Timestamp',
      cell: ({ row }) => {
        try {
          return formatDateTime(row.original.timestamp)
        } catch {
          return row.original.timestamp || '—'
        }
      },
    },
    {
      accessorKey: 'actor',
      header: 'Actor',
    },
    {
      accessorKey: 'action',
      header: 'Action',
    },
    {
      accessorKey: 'target',
      header: 'Target',
    },
    {
      accessorKey: 'scope',
      header: 'Scope',
      cell: ({ row }) => (
        <Badge variant={LOG_SCOPE_VARIANTS[row.original.scope]}>
          {row.original.scope}
        </Badge>
      ),
    },
    {
      accessorKey: 'details',
      header: 'Details',
      cell: ({ row }) => row.original.details || '—',
    },
  ]

  const toolbar = (
    <div className="flex flex-1 items-center gap-4">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input
          placeholder="Search logs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select value={scopeFilter} onValueChange={(value: 'All' | 'Organizer' | 'System') => setScopeFilter(value)}>
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Scopes</SelectItem>
          <SelectItem value="Organizer">Organizer</SelectItem>
          <SelectItem value="System">System</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert className="mb-6" variant="destructive">
            <AlertTitle>Unable to load audit logs</AlertTitle>
            <AlertDescription>
              This page now reads from `/admin/audit-logs`. Check your admin session and API
              availability, then reload the page.
            </AlertDescription>
          </Alert>
        ) : null}

        <DataTable
          columns={columns}
          data={filteredLogs}
          isLoading={isLoading}
          emptyMessage={isLoading ? 'Loading audit logs...' : 'No audit logs found.'}
          toolbar={toolbar}
        />
      </CardContent>
    </Card>
  )
}
