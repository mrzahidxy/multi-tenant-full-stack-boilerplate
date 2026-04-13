import { BookingForm } from '../booking-form'
import { Modal } from '@/components/ui/modal'

type BookingModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  onSubmit: (values: unknown) => void
}

export function BookingModal({ open, onOpenChange, title, onSubmit }: BookingModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Capture booking details for an event attendee."
      className="max-w-2xl"
    >
      <BookingForm
        mode="create"
        onSubmit={onSubmit}
        className="border-0 bg-transparent p-0 shadow-none"
      />
    </Modal>
  )
}
