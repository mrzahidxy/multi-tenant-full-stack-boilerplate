"use client";

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/features/admin/components/ui/card'
import { listAdminLicenses, type AdminLicense } from '@/features/admin/api/admin-client'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function LicensesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const {
    data: licenses = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin-licenses'],
    queryFn: listAdminLicenses,
  })

  function formatActivationDate(value: string) {
    if (!value) {
      return '—'
    }

    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(value))
    } catch {
      return value
    }
  }

  function getStatusVariant(status: AdminLicense['status']) {
    if (status === 'Active') {
      return 'success'
    }

    if (status === 'Pending') {
      return 'warning'
    }

    return 'destructive'
  }

  const filteredLicenses = useMemo(() => {
    return licenses.filter((license) => {
      const term = searchQuery.toLowerCase()
      return (
        license.key.toLowerCase().includes(term) ||
        license.domain.toLowerCase().includes(term) ||
        license.organizer.toLowerCase().includes(term) ||
        license.paymentId.toLowerCase().includes(term)
      )
    })
  }, [licenses, searchQuery])

  return (
    <div className="space-y-6">
      <div>
        <h1>Plan Management</h1>
        <p className="text-muted-foreground">View organizer plans, activations, and payment references</p>
      </div>

      <Card>
        <CardHeader className="py-6">
          <CardTitle>Active Plans</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Unable to load plans</AlertTitle>
              <AlertDescription>
                This view now reads from `/admin/licenses`. Check your admin session and API
                availability, then reload the page.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by key, domain, organizer, or payment ID..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-9"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>License Key</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Organizer</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Activation Date</TableHead>
                <TableHead>Payment ID</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Loading plans...
                  </TableCell>
                </TableRow>
              ) : (
                filteredLicenses.map((license) => (
                  <TableRow key={license.id || `${license.key}-${license.organizerId}`}>
                    <TableCell className="font-mono text-sm">{license.key || '—'}</TableCell>
                    <TableCell>{license.domain || '—'}</TableCell>
                    <TableCell>{license.organizer}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{license.plan || '—'}</Badge>
                    </TableCell>
                    <TableCell>{formatActivationDate(license.activationDate)}</TableCell>
                    <TableCell className="font-mono text-sm">{license.paymentId || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(license.status)}>{license.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {!isLoading && filteredLicenses.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              No plans found matching your criteria
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
