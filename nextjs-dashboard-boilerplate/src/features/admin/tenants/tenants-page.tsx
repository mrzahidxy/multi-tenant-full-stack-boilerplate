'use client'

import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Database, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { DataTable } from '@/components/data-table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { formatDate } from '@/lib/format'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/features/admin/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle } from '@/features/admin/components/ui/card'
import { ConfirmationDialog } from '@/features/admin/components/confirmation-dialog'
import {
  deleteAdminOrganizer,
  listAdminLicenses,
  updateAdminOrganizerStatus,
} from '@/features/admin/api/admin-client'
import { createOrganizer } from '@/features/business-owner/team/api/organizer-client'
import { TenantToolbar } from './components/tenant-toolbar'
import { useTenantDirectory } from './hooks/use-tenant-directory'
import type { Tenant } from './tenant-detail-drawer'

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function TenantsPage() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    ownerId: '',
  })
  const {
    data: licenses = [],
    isLoading,
    error: licensesError,
  } = useQuery({
    queryKey: ['admin-licenses'],
    queryFn: listAdminLicenses,
  })

  const statusMutation = useMutation({
    mutationFn: ({
      organizerId,
      status,
    }: {
      organizerId: string
      status: 'active' | 'suspended'
    }) => updateAdminOrganizerStatus(organizerId, status),
    onSuccess: (_, variables) => {
      toast.success(
        variables.status === 'suspended'
          ? 'Organizer suspended successfully'
          : 'Organizer reactivated successfully',
      )
      queryClient.invalidateQueries({ queryKey: ['admin-licenses'] })
    },
    onError: (mutationError: unknown) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to update organizer')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAdminOrganizer,
    onSuccess: () => {
      toast.success('Organizer deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-licenses'] })
    },
    onError: (mutationError: unknown) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to delete organizer')
    },
  })

  const createMutation = useMutation({
    mutationFn: ({ name, ownerId }: { name: string; ownerId: number }) =>
      createOrganizer({ name, ownerId }),
    onSuccess: () => {
      toast.success('Organizer created successfully')
      setCreateForm({ name: '', ownerId: '' })
      setIsCreateOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin-licenses'] })
    },
    onError: (mutationError: unknown) => {
      toast.error(
        mutationError instanceof Error ? mutationError.message : 'Failed to create organizer',
      )
    },
  })

  const tenants = useMemo<Tenant[]>(() => {
    return licenses.map((license) => ({
      id: license.organizerId,
      name: license.organizer,
      slug: slugify(license.organizer),
      ownerEmail: license.ownerEmail || '—',
      landingPageHref: `/organizers/${license.organizerId}`,
      license: license.plan || '—',
      createdDate: license.activationDate ? formatDate(license.activationDate) : '—',
      lastActive: license.renewalDate ? `Renews ${formatDate(license.renewalDate)}` : '—',
      status: license.status === 'Suspended' ? 'Suspended' : 'Active',
    }))
  }, [licenses])

  const {
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    confirmDialog,
    filteredTenants,
    requestAction,
    resetConfirmDialog,
  } = useTenantDirectory(tenants)

  const hasError = Boolean(licensesError)
  const isMutating = statusMutation.isPending || deleteMutation.isPending

  const columns: ColumnDef<Tenant>[] = [
    {
      accessorKey: 'name',
      header: 'Organizer',
      cell: ({ row }) => (
        <div className="flex flex-col">
          {row.original.landingPageHref ? (
            <Link
              href={row.original.landingPageHref}
              className="font-semibold text-slate-900 hover:text-teal-600"
            >
              {row.original.name}
            </Link>
          ) : (
            <span className="font-semibold text-slate-900">{row.original.name}</span>
          )}
          <span className="text-sm text-slate-500">/{row.original.slug}</span>
        </div>
      ),
    },
    {
      accessorKey: 'ownerEmail',
      header: 'Owner Email',
      cell: ({ row }) => (
        <span className="text-sm text-slate-600">{row.original.ownerEmail}</span>
      ),
    },
    {
      accessorKey: 'license',
      header: 'License',
      cell: ({ row }) => (
        <Badge variant={row.original.license === 'Premium' ? 'default' : 'outline'}>
          {row.original.license}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'Active' ? 'success' : 'outline'}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdDate',
      header: 'Created',
    },
    {
      accessorKey: 'lastActive',
      header: 'Last Active',
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(row.original.id)}
              >
                Copy organizer ID
              </DropdownMenuItem>
              {row.original.status === 'Active' ? (
                <DropdownMenuItem
                  disabled={isMutating}
                  onClick={() => requestAction(row.original.id, 'suspend')}
                >
                  Suspend
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  disabled={isMutating}
                  onClick={() => requestAction(row.original.id, 'reactivate')}
                >
                  Reactivate
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                disabled={isMutating}
                onClick={() => requestAction(row.original.id, 'delete')}
                className="text-rose-600 focus:text-rose-600"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1>Organizers</h1>
            <p className="text-muted-foreground">Manage organizer accounts, plans, and access</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Database className="mr-2 h-4 w-4" />
            Create Organizer
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Organizer Directory</CardTitle>
          </CardHeader>
          <CardContent>
            {hasError ? (
              <Alert className="mb-6" variant="destructive">
                <AlertTitle>Unable to load organizers</AlertTitle>
                <AlertDescription>
                  The tenant directory depends on `/admin/licenses` in the Express backend. Check
                  your admin session and API availability, then reload the page.
                </AlertDescription>
              </Alert>
            ) : null}

            <DataTable
              columns={columns}
              data={filteredTenants}
              isLoading={isLoading}
              emptyMessage={
                isLoading
                  ? 'Loading organizers...'
                  : 'No organizers were returned by the admin licenses API.'
              }
              toolbar={
                <TenantToolbar
                  searchQuery={searchQuery}
                  statusFilter={statusFilter}
                  onSearchChange={setSearchQuery}
                  onStatusChange={setStatusFilter}
                />
              }
            />

          </CardContent>
        </Card>
      </div>

      <ConfirmationDialog
        open={confirmDialog.isOpen}
        onClose={resetConfirmDialog}
        onConfirm={async () => {
          if (!confirmDialog.tenant) {
            resetConfirmDialog()
            return
          }

          try {
            if (confirmDialog.action === 'delete') {
              await deleteMutation.mutateAsync(confirmDialog.tenant.id)
            } else {
              await statusMutation.mutateAsync({
                organizerId: confirmDialog.tenant.id,
                status: confirmDialog.action === 'suspend' ? 'suspended' : 'active',
              })
            }

            resetConfirmDialog()
          } catch {
            // handled in mutation callbacks
          }
        }}
        title={
          confirmDialog.action === 'delete'
            ? 'Delete organizer'
            : confirmDialog.action === 'suspend'
            ? 'Suspend organizer'
            : 'Reactivate organizer'
        }
        description={
          confirmDialog.action === 'delete'
            ? `Are you sure you want to delete "${confirmDialog.tenant?.name}"? This action cannot be undone.`
            : confirmDialog.action === 'suspend'
            ? `Suspend "${confirmDialog.tenant?.name}"? They will temporarily lose access to organizer operations.`
            : `Reactivate "${confirmDialog.tenant?.name}"? They will regain access to organizer operations.`
        }
        actionLabel={confirmDialog.action === 'delete' ? 'Delete' : 'Confirm'}
        variant={confirmDialog.action === 'delete' ? 'destructive' : 'default'}
      />

      <Modal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Create organizer"
        description="Creates a new organizer using the backend `/organizers` endpoint."
      >
        <div className="space-y-4">
          <FormField label="Organizer name" htmlFor="create-organizer-name">
            <Input
              id="create-organizer-name"
              value={createForm.name}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </FormField>
          <FormField
            label="Owner user ID"
            htmlFor="create-organizer-owner-id"
            description="Required by the backend when an admin creates an organizer."
          >
            <Input
              id="create-organizer-owner-id"
              type="number"
              min="1"
              value={createForm.ownerId}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, ownerId: event.target.value }))
              }
            />
          </FormField>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const trimmedName = createForm.name.trim()
                const ownerId = Number(createForm.ownerId)

                if (!trimmedName) {
                  toast.error('Organizer name is required')
                  return
                }

                if (!Number.isInteger(ownerId) || ownerId <= 0) {
                  toast.error('Owner user ID must be a positive integer')
                  return
                }

                createMutation.mutate({ name: trimmedName, ownerId })
              }}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create organizer'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
