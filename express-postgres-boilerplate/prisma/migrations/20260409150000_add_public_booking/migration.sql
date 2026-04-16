ALTER TABLE "Booking"
ADD COLUMN "fullName" TEXT,
ADD COLUMN "email" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "bookingDate" DATE,
ADD COLUMN "bookingTime" TEXT,
ADD COLUMN "guestCount" INTEGER;

ALTER TABLE "Booking"
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "eventId" DROP NOT NULL,
ALTER COLUMN "eventName" DROP NOT NULL,
ALTER COLUMN "checkIn" DROP NOT NULL,
ALTER COLUMN "checkOut" DROP NOT NULL,
ALTER COLUMN "totalPrice" DROP NOT NULL;

CREATE INDEX "Booking_email_idx" ON "Booking"("email");
CREATE INDEX "Booking_bookingDate_idx" ON "Booking"("bookingDate");
