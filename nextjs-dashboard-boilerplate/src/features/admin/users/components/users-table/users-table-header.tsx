'use client'

import { Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type UsersTableHeaderProps = {
  searchQuery: string
  onSearchChange: (value: string) => void
}

export function UsersTableHeader({
  searchQuery,
  onSearchChange,
}: UsersTableHeaderProps) {
  return (
    <div className="flex flex-1 flex-wrap items-center gap-4">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by email or organizer..."
          className="pl-10"
        />
      </div>
      <Button variant="outline" className="h-8 px-3" disabled>
        Backend filters: search, role, page, limit
      </Button>
    </div>
  )
}
