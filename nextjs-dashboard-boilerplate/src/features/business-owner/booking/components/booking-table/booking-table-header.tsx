import type { ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { BookingStatus } from '@/types/booking'

type BookingTableHeaderProps = {
  status: BookingStatus | 'all'
  propertyName: string
  checkInDate: string
  checkOutDate: string
  onStatusChange: (value: BookingStatus | 'all') => void
  onPropertyNameChange: (value: string) => void
  onCheckInDateChange: (value: string) => void
  onCheckOutDateChange: (value: string) => void
  onReset: () => void
  onCreate: () => void
}

export function BookingTableHeader({
  status,
  propertyName,
  checkInDate,
  checkOutDate,
  onStatusChange,
  onPropertyNameChange,
  onCheckInDateChange,
  onCheckOutDateChange,
  onReset,
  onCreate,
}: BookingTableHeaderProps) {
  return (
    <header className="grid grid-cols-12 gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="col-span-10 flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-600">
            Event name
          </label>
          <Input
            placeholder="Search by event name..."
            value={propertyName}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onPropertyNameChange(event.target.value)
            }
            className="w-60"
          />
        </div>
        <Select
          value={status}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            onStatusChange(event.target.value as BookingStatus | 'all')
          }
          className="w-48"
        >
          <option value="all">All statuses</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PENDING">Pending</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="COMPLETED">Completed</option>
        </Select>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Check-in:</label>
          <Input
            type="date"
            value={checkInDate}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onCheckInDateChange(event.target.value)
            }
            className="w-32"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Check-out:</label>
          <Input
            type="date"
            value={checkOutDate}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onCheckOutDateChange(event.target.value)
            }
            className="w-32"
          />
        </div>
        <Button variant="outline" onClick={onReset}>
          Reset
        </Button>
      </div>
      <div className="col-span-2 flex justify-end">
        <Button onClick={onCreate}>New booking</Button>
      </div>
    </header>
  )
}
