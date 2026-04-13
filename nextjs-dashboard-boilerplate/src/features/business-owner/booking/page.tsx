'use client'

import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/format'
import { createCheckoutSession } from '@/lib/api/payments-client'
import { getBookingById } from './api/booking-client'
import { resourceKeys } from './api/booking-keys'
import { BookingForm } from './components/booking-form'

export default function BookingDetailPage() {
  const params = useParams()
  const bookingId = params.bookingId as string
  const hasShownError = useRef(false)

  const {
    data: booking,
    isLoading,
    error,
  } = useQuery({
    queryKey: resourceKeys.detail(bookingId),
    queryFn: () => getBookingById(bookingId),
    enabled: !!bookingId,
  })

  const checkoutMutation = useMutation({
    mutationFn: (id: number) =>
      createCheckoutSession({
        bookingId: id,
        cancelUrl: `${window.location.origin}/payments/cancel`,
        successUrl: `${window.location.origin}/payments/success`,
      }),
    onSuccess: (response) => {
      if (response.url) {
        window.location.assign(response.url)
        return
      }

      toast.success('Checkout session created')
    },
    onError: (mutationError) => {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : 'Unable to create checkout session',
      )
    },
  })

  useEffect(() => {
    if (
      !isLoading &&
      (error || !booking) &&
      !hasShownError.current
    ) {
      toast.error('Failed to load booking data')
      hasShownError.current = true
    }
  }, [isLoading, error, booking])

  useEffect(() => {
    if (!isLoading && booking) {
      hasShownError.current = false
    }
  }, [isLoading, booking])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2
          className="h-6 w-6 animate-spin text-slate-500"
          aria-label="Loading..."
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border p-6 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              {booking?.eventName ?? booking?.propertyName ?? 'Booking'}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {booking ? (
                <>
                  Status:{' '}
                  <span className="font-medium text-slate-200">
                    {booking.status}
                  </span>{' '}
                  - Last updated {formatDate(booking.updatedAt)}
                </>
              ) : (
                'Booking details unavailable.'
              )}
            </p>
          </div>
          {booking ? (
            <Button
              onClick={() => checkoutMutation.mutate(booking.id)}
              disabled={checkoutMutation.isPending}
            >
              {checkoutMutation.isPending ? 'Creating checkout...' : 'Start checkout'}
            </Button>
          ) : null}
        </div>
      </div>

      <BookingForm
        mode="edit"
        defaultValues={
          booking
            ? {
                checkIn: booking.checkIn,
                checkOut: booking.checkOut,
              }
            : undefined
        }
        bookingId={booking?.id?.toString() ?? bookingId}
      />
    </div>
  )
}
