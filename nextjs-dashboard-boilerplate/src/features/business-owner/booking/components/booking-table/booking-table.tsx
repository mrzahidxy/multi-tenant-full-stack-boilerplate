'use client'

import { useMemo, useState } from 'react'

import { DataTable } from '@/components/data-table'
import type { PaginatedResult, Booking } from '@/types/booking'

import { BookingTableHeader } from './booking-table-header'
import { BookingModal } from './booking-modal'
import { createBookingColumns } from './columns'
import { useBookingTable } from './use-booking-table'

type BookingTableProps = {
  initialData?: PaginatedResult<Booking>
}

export function BookingTable({ initialData }: BookingTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const {
    sorting,
    setSorting,
    data,
    isFetching,
    page,
    pageSize,
    status,
    propertyName,
    checkInDate,
    checkOutDate,
    setPage,
    setPageSize,
    setStatus,
    setPropertyName,
    setCheckInDate,
    setCheckOutDate,
    reset,
    createBooking,
    isCreating,
    isDeleting,
    deleteBooking,
  } = useBookingTable({
    initialData,
    onCreateSuccess: () => setIsModalOpen(false),
  })

  const columns = useMemo(
    () =>
      createBookingColumns({
        onDelete: deleteBooking,
        isDeleting,
      }),
    [deleteBooking, isDeleting]
  )

  return (
    <section className="space-y-6">
      <BookingTableHeader
        status={status}
        propertyName={propertyName}
        checkInDate={checkInDate}
        checkOutDate={checkOutDate}
        onStatusChange={setStatus}
        onPropertyNameChange={setPropertyName}
        onCheckInDateChange={setCheckInDate}
        onCheckOutDateChange={setCheckOutDate}
        onReset={reset}
        onCreate={() => setIsModalOpen(true)}
      />

      <DataTable
        columns={columns}
        data={data.data}
        sorting={sorting}
        onSortingChange={setSorting}
        isLoading={isFetching}
        manualPagination
        pageCount={data.meta.totalPages}
        pagination={{
          pageIndex: Math.max(0, page - 1),
          pageSize,
          onPageChange: (pageIndex) => setPage(pageIndex + 1),
          onPageSizeChange: (size) => setPageSize(size),
          pageSizeOptions: [5, 10, 20, 50],
        }}
        emptyMessage="No bookings match your filters yet. Create one to get started."
      />

      <BookingModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="Create booking"
        onSubmit={(values) => createBooking(values)}
      />
    </section>
  )
}
