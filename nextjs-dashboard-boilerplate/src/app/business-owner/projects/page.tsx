'use client'

import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiClient } from '@/lib/api'

type Organizer = { id: string; name: string }
type Project = { id: string; name: string }
type Response<T> = { data: T }

function ProjectList({ organizerId, userId }: { organizerId: string; userId: string }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const path = `/api/projects/${organizerId}`
  const queryKey = ['projects', userId, organizerId]
  const projects = useQuery({
    queryKey,
    queryFn: async () => (await apiClient.get<Response<Project[]>>(path, { auth: true })).data,
  })
  const mutation = useMutation({
    mutationFn: async (action: { type: 'save'; name: string; id: string | null } | { type: 'delete'; id: string }) => {
      if (action.type === 'delete') {
        await apiClient.delete(`${path}/${action.id}`, { auth: true })
      } else if (action.id) {
        await apiClient.patch(`${path}/${action.id}`, { name: action.name }, { auth: true })
      } else {
        await apiClient.post(path, { name: action.name }, { auth: true })
      }
    },
    onSuccess: async (_, action) => {
      if (action.type === 'save' || action.id === editingId) {
        setName('')
        setEditingId(null)
      }
      await queryClient.invalidateQueries({ queryKey })
    },
  })

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (name.trim()) mutation.mutate({ type: 'save', name: name.trim(), id: editingId })
  }

  if (projects.isPending) return <p>Loading projects…</p>
  if (projects.isError) return <p role="alert">Could not load projects.</p>

  return (
    <div className="space-y-4">
      <form onSubmit={save} className="flex flex-wrap items-end gap-2">
        <label className="block max-w-sm space-y-1">
          <span>Project name</span>
          <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required disabled={mutation.isPending} />
        </label>
        <Button type="submit" disabled={mutation.isPending || !name.trim()}>
          {editingId ? 'Save changes' : 'Create project'}
        </Button>
        {editingId && (
          <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => {
            setEditingId(null)
            setName('')
            mutation.reset()
          }}>
            Cancel
          </Button>
        )}
      </form>
      {mutation.isError && <p role="alert">{mutation.error.message}</p>}
      {projects.data.length === 0 && <p>No projects yet.</p>}
      <ul className="divide-y">
        {projects.data.map((project) => (
          <li key={project.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <span>{project.name}</span>
            <div className="flex gap-2">
              <Button variant="outline" disabled={mutation.isPending} onClick={() => {
                setEditingId(project.id)
                setName(project.name)
                mutation.reset()
              }}>
                Edit
              </Button>
              <Button variant="destructive" disabled={mutation.isPending} onClick={() => {
                if (window.confirm(`Delete "${project.name}"?`)) mutation.mutate({ type: 'delete', id: project.id })
              }}>
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function OrganizerProjects({ userId }: { userId: string }) {
  const [selection, setSelection] = useState('')
  const organizers = useQuery({
    queryKey: ['project-organizers', userId],
    queryFn: async () =>
      (await apiClient.get<Response<Organizer[]>>('/api/projects/organizers', { auth: true })).data,
  })

  if (organizers.isPending) return <p>Loading organizers…</p>
  if (organizers.isError) return <p role="alert">Could not load your organizers.</p>

  const selected = organizers.data.find(({ id }) => id === selection) ?? organizers.data[0]
  if (!selected) return <p>You do not have an active organizer assignment.</p>

  return (
    <>
      <label className="flex w-fit items-center gap-2">
        Organizer
        <select
          value={selected.id}
          onChange={(event) => setSelection(event.target.value)}
          className="rounded-md border bg-background px-3 py-2"
        >
          {organizers.data.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
        </select>
      </label>
      <ProjectList key={selected.id} organizerId={selected.id} userId={userId} />
    </>
  )
}

export default function ProjectsPage() {
  const { data: session } = useSession()

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Projects</h1>
      {session?.user && (
        session.user.role === 'OWNER' || session.user.role === 'STAFF'
          ? <OrganizerProjects key={session.user.id} userId={session.user.id} />
          : <p>Projects are available to organizer owners and assigned staff.</p>
      )}
    </section>
  )
}
