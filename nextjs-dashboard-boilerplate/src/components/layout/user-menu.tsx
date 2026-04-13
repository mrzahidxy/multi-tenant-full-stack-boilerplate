'use client'

import { useMemo } from 'react'
import { LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/features/admin/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

type UserMenuProps = {
  name?: string | null
  email?: string | null
  role?: string | null
}

const formatRole = (role?: string | null) => {
  if (!role) return 'Organizer'
  return role
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const initialsFor = (name?: string | null) => {
  if (!name) return 'EN'
  const matches = name.trim().split(/\s+/)
  if (matches.length === 0) return 'EN'
  return matches
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2)
}

export function UserMenu({ name, email, role }: UserMenuProps) {
  const initials = useMemo(() => initialsFor(name), [name])
  const displayName = name ?? 'Avery Booker'
  const displayEmail = email ?? 'organizer@example.com'
  const displayRole = formatRole(role)

  const handleSignOut = () => {
    void signOut({ callbackUrl: '/login' })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-3 rounded-full px-2 py-1 hover:bg-primary-soft hover:text-primary"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary shadow-inner">
            {initials}
          </div>
          <div className="hidden text-left text-xs sm:block">
            <p className="text-sm font-semibold text-primary-foreground">{displayName}</p>
            <p className="text-[11px] uppercase tracking-wide text-primary-foreground/70">
              {displayRole}
            </p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2 text-xs text-muted-foreground">
          <p className="text-sm font-medium text-foreground">{displayName}</p>
          <p>{displayEmail}</p>
          <p className="uppercase tracking-wide">{displayRole}</p>
        </div>
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault()
            handleSignOut()
          }}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
