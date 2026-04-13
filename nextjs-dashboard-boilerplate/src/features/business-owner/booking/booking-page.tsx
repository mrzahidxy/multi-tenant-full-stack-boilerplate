import type { Metadata } from 'next'

import { BookingTable } from './components/booking-table'

export const metadata: Metadata = {
  title: 'Bookings',
}

export default function BookingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Bookings</h1>
        <p className="text-muted-foreground">
          Manage attendee bookings, stay dates, and booking totals
        </p>
      </div>

      <BookingTable />
    </div>
  )
}

