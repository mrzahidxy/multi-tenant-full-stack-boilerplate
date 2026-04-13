import type { PaymentRecord } from '@/types/domain'

export type BookingStatus = 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED'

export type Booking = {
  id: number
  userId: string
  organizerId: string | null
  eventId: string | null
  propertyName: string
  eventName?: string
  checkIn: string
  checkOut: string
  totalPrice: string
  status: BookingStatus
  notes: string
  guestName?: string
  guestEmail?: string
  guestPhone?: string
  guestCount?: number
  bookingTime?: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    email: string
    name: string
  }
  payments: PaymentRecord[]
}

export type BookingInput = {
  eventId?: string
  propertyName?: string
  checkIn: string
  checkOut: string
  totalPrice?: number
  notes?: string
}

export type PublicOrganizerBookingInput = {
  eventId: string
  bookingDate: string
  bookingTime: string
  guestCount: number
  fullName?: string
  email?: string
  phone?: string
  notes?: string
}

export type BookingUpdate = Partial<BookingInput> & {
  status?: BookingStatus
}

export type ResourceFilters = {
  search?: string
  status?: string
  page?: number
  limit?: number
  pageSize?: number
  sortBy?: 'propertyName' | 'status' | 'totalPrice' | 'createdAt' | 'updatedAt'
  sortDirection?: 'asc' | 'desc'
  propertyName?: string
  eventName?: string
  checkInDate?: string
  checkOutDate?: string
  checkInFrom?: string
  checkInTo?: string
}

export type PaginatedResult<T> = {
  data: T[]
  meta: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
}
