'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { CalendarDays, ShieldCheck, UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'

import { DashboardHeader } from '../dashboard/components/dashboard-header'
import { SectionCard } from '../dashboard/components/section-card'
import { StatCard } from '../dashboard/components/stat-card'
import { organizerKeys } from './api/organizer-keys'
import {
  addOrganizerStaff,
  createOrganizerEvent,
  deleteOrganizerEvent,
  getOrganizer,
  listOrganizerEvents,
  listOrganizerStaff,
  removeOrganizerStaff,
  updateOrganizer,
} from './api/organizer-client'
import { userKeys } from '@/features/admin/users/api/user-keys'
import {
  listUsers,
  type AdminUser,
} from '@/features/admin/users/api/user-client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { getRbacDefinitions } from '@/lib/api/rbac-client'
import { rbacKeys } from '@/lib/api/rbac-keys'
import { formatCurrency, formatRelativeDate } from '@/lib/format'
import { resolveOrganizerScopeId } from '@/features/business-owner/analytics/utils'

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

export default function TeamPage() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const organizerId = resolveOrganizerScopeId(session?.user ?? null)
  const role = session?.user.role ?? 'USER'
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const canManageOrganizer = role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'OWNER'
  const canManageStaff = canManageOrganizer

  const [organizerName, setOrganizerName] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    price: '0',
    isPublished: 'true',
  })

  const organizerQuery = useQuery({
    queryKey: organizerId ? organizerKeys.detail(organizerId) : ['organizers', 'detail', 'unassigned'],
    queryFn: () => getOrganizer(organizerId as string),
    enabled: Boolean(organizerId),
  })

  const eventsQuery = useQuery({
    queryKey: organizerId ? organizerKeys.events(organizerId) : ['organizers', 'events', 'unassigned'],
    queryFn: () => listOrganizerEvents(organizerId as string),
    enabled: Boolean(organizerId),
  })

  const staffQuery = useQuery({
    queryKey: organizerId ? organizerKeys.staff(organizerId) : ['organizers', 'staff', 'unassigned'],
    queryFn: () => listOrganizerStaff(organizerId as string),
    enabled: Boolean(organizerId),
  })

  const usersQuery = useQuery({
    queryKey: userKeys.list({ limit: 50, page: 1 }),
    queryFn: () => listUsers({ limit: 50, page: 1 }),
    enabled: isAdmin,
  })

  const rolesQuery = useQuery({
    queryKey: rbacKeys.definitions(),
    queryFn: getRbacDefinitions,
  })

  const organizer = organizerQuery.data ?? null
  const events = eventsQuery.data ?? []
  const staff = staffQuery.data ?? []
  const users = usersQuery.data?.users ?? []

  useEffect(() => {
    if (organizer?.name) {
      setOrganizerName(organizer.name)
    }
  }, [organizer?.name])

  const selectableUsers = useMemo(() => {
    const existingStaff = new Set(staff.map((member) => member.id))

    return users.filter((user) => !existingStaff.has(user.id))
  }, [staff, users])

  const stats = useMemo(
    () => [
      {
        label: 'Organizer',
        value: organizer ? 1 : 0,
        helper: organizer?.status ?? 'Unassigned',
        icon: <ShieldCheck className="h-5 w-5" />,
      },
      {
        label: 'Events',
        value: events.length,
        helper: `${events.filter((event) => event.isPublished).length} published`,
        icon: <CalendarDays className="h-5 w-5" />,
      },
      {
        label: 'Staff',
        value: staff.length,
        helper: 'Assigned to this organizer',
        icon: <Users className="h-5 w-5" />,
      },
      {
        label: 'Roles',
        value: rolesQuery.data?.length ?? 0,
        helper: 'Live RBAC definitions',
      },
    ],
    [events, organizer, rolesQuery.data, staff.length],
  )

  const organizerMutation = useMutation({
    mutationFn: (name: string) => updateOrganizer(organizerId as string, { name }),
    onSuccess: (updatedOrganizer) => {
      toast.success('Organizer updated')
      setOrganizerName(updatedOrganizer.name)
      queryClient.invalidateQueries({ queryKey: organizerKeys.detail(organizerId as string) })
    },
    onError: (mutationError) => {
      toast.error(getErrorMessage(mutationError, 'Unable to update organizer'))
    },
  })

  const eventMutation = useMutation({
    mutationFn: () =>
      createOrganizerEvent(organizerId as string, {
        description: eventForm.description.trim() || undefined,
        isPublished: eventForm.isPublished === 'true',
        name: eventForm.name.trim(),
        price: Number(eventForm.price),
      }),
    onSuccess: () => {
      toast.success('Event created')
      setEventForm({
        name: '',
        description: '',
        price: '0',
        isPublished: 'true',
      })
      queryClient.invalidateQueries({ queryKey: organizerKeys.events(organizerId as string) })
    },
    onError: (mutationError) => {
      toast.error(getErrorMessage(mutationError, 'Unable to create event'))
    },
  })

  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) => deleteOrganizerEvent(organizerId as string, eventId),
    onSuccess: () => {
      toast.success('Event removed')
      queryClient.invalidateQueries({ queryKey: organizerKeys.events(organizerId as string) })
    },
    onError: (mutationError) => {
      toast.error(getErrorMessage(mutationError, 'Unable to delete event'))
    },
  })

  const addStaffMutation = useMutation({
    mutationFn: (userId: number) => addOrganizerStaff(organizerId as string, { userId }),
    onSuccess: () => {
      toast.success('Staff member added')
      setSelectedUserId('')
      queryClient.invalidateQueries({ queryKey: organizerKeys.staff(organizerId as string) })
    },
    onError: (mutationError) => {
      toast.error(getErrorMessage(mutationError, 'Unable to add staff member'))
    },
  })

  const removeStaffMutation = useMutation({
    mutationFn: (userId: string) => removeOrganizerStaff(organizerId as string, userId),
    onSuccess: () => {
      toast.success('Staff member removed')
      queryClient.invalidateQueries({ queryKey: organizerKeys.staff(organizerId as string) })
    },
    onError: (mutationError) => {
      toast.error(getErrorMessage(mutationError, 'Unable to remove staff member'))
    },
  })

  const handleOrganizerSubmit = () => {
    if (!organizerId || !organizerName.trim()) {
      toast.error('Organizer name is required')
      return
    }

    organizerMutation.mutate(organizerName.trim())
  }

  const handleCreateEvent = () => {
    if (!organizerId) {
      toast.error('Your account is not linked to an organizer')
      return
    }

    if (!eventForm.name.trim()) {
      toast.error('Event name is required')
      return
    }

    if (!Number.isFinite(Number(eventForm.price))) {
      toast.error('Price must be a valid number')
      return
    }

    eventMutation.mutate()
  }

  const handleAddStaff = () => {
    if (!selectedUserId) {
      toast.error('Select a user to add')
      return
    }

    const userId = Number(selectedUserId)

    if (!Number.isInteger(userId) || userId <= 0) {
      toast.error('User ID must be a positive integer')
      return
    }

    addStaffMutation.mutate(userId)
  }

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Organizer Team"
        description="Manage organizer profile, events, staff, and role definitions from the backend API"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {!organizerId ? (
        <SectionCard title="Organizer Access">
          <p className="text-sm text-slate-600">
            This account is not linked to an organizer. Owner and staff workflows stay blocked
            until the backend user record includes a `businessId` organizer UUID.
          </p>
        </SectionCard>
      ) : (
        <>
          <SectionCard
            title="Organizer Profile"
            subtitle="Live organizer metadata from the backend"
          >
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
              <FormField
                label="Organizer name"
                htmlFor="organizer-name"
                description={`Organizer ID: ${organizerId}`}
              >
                <Input
                  id="organizer-name"
                  value={organizerName || organizer?.name || ''}
                  onChange={(event) => setOrganizerName(event.target.value)}
                  disabled={!canManageOrganizer || organizerMutation.isPending}
                />
              </FormField>
              <div className="flex items-end">
                <Button
                  onClick={handleOrganizerSubmit}
                  disabled={!canManageOrganizer || organizerMutation.isPending}
                >
                  {organizerMutation.isPending ? 'Saving...' : 'Save organizer'}
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <Badge variant={organizer?.status === 'ACTIVE' ? 'success' : 'outline'}>
                {organizer?.status ?? 'Unknown'}
              </Badge>
              <span>
                Updated{' '}
                {organizer?.updatedAt ? formatRelativeDate(organizer.updatedAt) : 'unknown'}
              </span>
            </div>
          </SectionCard>

          <SectionCard
            title="Organizer Events"
            subtitle="Read and create organizer events"
            actions={
              canManageOrganizer ? (
                <Button onClick={handleCreateEvent} disabled={eventMutation.isPending}>
                  {eventMutation.isPending ? 'Creating...' : 'Create event'}
                </Button>
              ) : null
            }
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <FormField label="Event name" htmlFor="event-name">
                <Input
                  id="event-name"
                  value={eventForm.name}
                  onChange={(event) =>
                    setEventForm((current) => ({ ...current, name: event.target.value }))
                  }
                  disabled={!canManageOrganizer}
                />
              </FormField>
              <FormField label="Price" htmlFor="event-price">
                <Input
                  id="event-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={eventForm.price}
                  onChange={(event) =>
                    setEventForm((current) => ({ ...current, price: event.target.value }))
                  }
                  disabled={!canManageOrganizer}
                />
              </FormField>
              <FormField label="Publish status" htmlFor="event-published">
                <Select
                  id="event-published"
                  value={eventForm.isPublished}
                  onChange={(event) =>
                    setEventForm((current) => ({
                      ...current,
                      isPublished: event.target.value,
                    }))
                  }
                  disabled={!canManageOrganizer}
                >
                  <option value="true">Published</option>
                  <option value="false">Draft</option>
                </Select>
              </FormField>
              <FormField label="Description" htmlFor="event-description">
                <Input
                  id="event-description"
                  value={eventForm.description}
                  onChange={(event) =>
                    setEventForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  disabled={!canManageOrganizer}
                />
              </FormField>
            </div>

            <div className="space-y-4">
              {eventsQuery.isLoading ? (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  <Spinner size="sm" />
                  Loading organizer events...
                </div>
              ) : events.length ? (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{event.name}</p>
                        <Badge variant={event.isPublished ? 'success' : 'outline'}>
                          {event.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        {event.description || 'No description'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatCurrency(event.price)} • Updated{' '}
                        {event.updatedAt ? formatRelativeDate(event.updatedAt) : 'unknown'}
                      </p>
                    </div>
                    {canManageOrganizer ? (
                      <Button
                        variant="outline"
                        onClick={() => deleteEventMutation.mutate(event.id)}
                        disabled={deleteEventMutation.isPending}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-500">
                  No organizer events were returned by the backend.
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Organizer Staff"
            subtitle="Assign and remove staff members for this organizer"
            actions={
              canManageStaff ? (
                <div className="flex items-end gap-3">
                  <div className="min-w-[220px]">
                    {isAdmin ? (
                      <Select
                        value={selectedUserId}
                        onChange={(event) => setSelectedUserId(event.target.value)}
                        disabled={addStaffMutation.isPending}
                      >
                        <option value="">Select a user</option>
                        {selectableUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name ?? user.email} ({user.role})
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Input
                        value={selectedUserId}
                        onChange={(event) => setSelectedUserId(event.target.value)}
                        placeholder="Enter user ID"
                        inputMode="numeric"
                        disabled={addStaffMutation.isPending}
                      />
                    )}
                  </div>
                  <Button onClick={handleAddStaff} disabled={addStaffMutation.isPending}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add staff
                  </Button>
                </div>
              ) : null
            }
          >
            <div className="space-y-4">
              {staffQuery.isLoading ? (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  <Spinner size="sm" />
                  Loading organizer staff...
                </div>
              ) : staff.length ? (
                staff.map((member, index) => (
                  <div
                    key={`${member.id || 'missing-id'}-${member.email || 'missing-email'}-${index}`}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {member.name ?? 'Unnamed staff member'}
                        </p>
                        <Badge variant="outline">{member.role}</Badge>
                        <Badge variant={member.status === 'ACTIVE' ? 'success' : 'outline'}>
                          {member.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">{member.email}</p>
                    </div>
                    {canManageOrganizer ? (
                      <Button
                        variant="outline"
                        onClick={() => removeStaffMutation.mutate(member.id)}
                        disabled={removeStaffMutation.isPending}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-500">
                  No staff members are assigned to this organizer yet.
                </div>
              )}
            </div>
          </SectionCard>
        </>
      )}

      {isAdmin ? (
        <SectionCard
          title="Visible Users"
          subtitle="Admin-backed user directory used for staff assignment"
        >
          <div className="space-y-4">
            {usersQuery.isLoading ? (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                <Spinner size="sm" />
                Loading users...
              </div>
            ) : users.length ? (
              users.slice(0, 12).map((member: AdminUser, index) => (
                <div
                  key={`${member.id || 'missing-id'}-${member.email || 'missing-email'}-${index}`}
                  className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {member.name ?? 'Unnamed user'}
                    </p>
                    <p className="text-xs text-slate-500">{member.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{member.role}</Badge>
                    <Badge variant={member.status === 'ACTIVE' ? 'success' : 'outline'}>
                      {member.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-500">
                No users were returned by the backend.
              </div>
            )}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="Permission Levels" subtitle="Definitions returned by `/rbac/definitions`">
        <div className="space-y-4">
          {(rolesQuery.data ?? []).map((level) => (
            <div
              key={level.role}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">{level.role}</p>
                <Badge variant="outline">{level.permissions.length} permissions</Badge>
              </div>
              <p className="mt-1 text-xs text-slate-500">{level.description}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
