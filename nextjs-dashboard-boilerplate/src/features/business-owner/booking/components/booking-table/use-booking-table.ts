import { useMemo, useState } from 'react'
import type { SortingState } from '@tanstack/react-table'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useResourceFilters } from '@/hooks/use-booking-filters'
import {
  createBookingRequest,
  deleteBookingRequest,
  fetchBookings,
} from '../../api/booking-client'
import { resourceKeys } from '../../api/booking-keys'
import type { PaginatedResult, Booking, ResourceFilters } from '@/types/booking'

type UseBookingTableOptions = {
  initialData?: PaginatedResult<Booking>
  onCreateSuccess?: () => void
}

type BookingListKey = ReturnType<typeof resourceKeys.list>

type DeleteContext = {
  previous?: PaginatedResult<Booking>
  listKey: BookingListKey
}

export function useBookingTable({ initialData, onCreateSuccess }: UseBookingTableOptions) {
  const queryClient = useQueryClient()
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'updatedAt', desc: true },
  ])
  const {
    page,
    pageSize,
    search,
    status,
    propertyName,
    checkInDate,
    checkOutDate,
    setPage,
    setPageSize,
    setSearch,
    setStatus,
    setPropertyName,
    setCheckInDate,
    setCheckOutDate,
    reset,
  } = useResourceFilters()

  const currentSort = sorting[0]
  const sortBy = (currentSort?.id ?? 'updatedAt') as ResourceFilters['sortBy']
  const sortDirection: Required<ResourceFilters>['sortDirection'] =
    currentSort?.desc === false ? 'asc' : 'desc'

  const filters = useMemo<ResourceFilters>(
    () => ({
      page,
      pageSize,
      search,
      status: status === 'all' ? undefined : status,
      sortBy,
      sortDirection,
      propertyName: propertyName || undefined,
      checkInDate: checkInDate || undefined,
      checkOutDate: checkOutDate || undefined,
    }),
    [page, pageSize, search, status, sortBy, sortDirection, propertyName, checkInDate, checkOutDate]
  )

  const { data, isFetching } = useQuery<PaginatedResult<Booking>>({
    queryKey: resourceKeys.list(filters),
    queryFn: () => fetchBookings(filters),
    initialData,
    placeholderData: (previous) => previous ?? initialData,
  })

  const fallbackData = useMemo<PaginatedResult<Booking>>(
    () => ({
      data: [],
      meta: {
        page,
        limit: pageSize,
        totalItems: 0,
        totalPages: 0,
      },
    }),
    [page, pageSize]
  )

  const resolvedData = data ?? fallbackData

  const deleteMutation = useMutation<unknown, Error, number, DeleteContext>({
    mutationFn: deleteBookingRequest,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: resourceKeys.all })

      const listKey = resourceKeys.list(filters)
      const previous =
        queryClient.getQueryData<PaginatedResult<Booking>>(listKey)

      queryClient.setQueryData<PaginatedResult<Booking>>(
        listKey,
        (current) =>
          current
            ? {
              ...current,
              data: current.data.filter((item) => item.id !== id),
            }
            : current
      )

      return { previous, listKey }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous && context.listKey) {
        queryClient.setQueryData(context.listKey, context.previous)
      }
      toast.error('Unable to delete booking')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourceKeys.all })
      toast.success('Booking deleted')
    },
  })

  const createMutation = useMutation({
    mutationFn: (values: unknown) => createBookingRequest(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourceKeys.all })
      toast.success('Booking created')
      onCreateSuccess?.()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Create failed')
    },
  })

  return {
    sorting,
    setSorting,
    data: resolvedData,
    isFetching,
    page,
    pageSize,
    search,
    status,
    propertyName,
    checkInDate,
    checkOutDate,
    setPage,
    setPageSize,
    setSearch,
    setStatus,
    setPropertyName,
    setCheckInDate,
    setCheckOutDate,
    reset,
    createBooking: (values: unknown) => createMutation.mutate(values),
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    deleteBooking: (id: number) => deleteMutation.mutate(id),
  }
}
