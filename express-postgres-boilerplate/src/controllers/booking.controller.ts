import { Response } from 'express';

import { bookingService } from '../services/booking.service';
import type { AuthenticatedRequest } from '../types/http';
import type { CreatePublicBookingInput, ListBookingsQuery } from '../schemas/booking.schema';
import { successResponse } from '../utils/api-response';

const formatDate = (value: Date | string | null | undefined) =>
  value ? new Date(value).toISOString().split('T')[0] : null;

export const bookingController = {
  createPublicSubmission: async (req: AuthenticatedRequest, res: Response) => {
    const { organizerId } = req.params as { organizerId?: string };
    const booking = await bookingService.createPublicSubmission(
      req.body as CreatePublicBookingInput,
      req.user,
      organizerId
    );
    res.status(201).json(
      successResponse(
        {
          id: booking.id,
          fullName: booking.fullName,
          email: booking.email,
          phone: booking.phone,
          eventId: booking.eventId,
          eventName: booking.eventName,
          userId: booking.userId,
          bookingDate: formatDate(booking.bookingDate),
          bookingTime: booking.bookingTime,
          guestCount: booking.guestCount,
          notes: booking.notes,
          status: booking.status,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
        },
        { message: 'Booking submitted successfully' }
      )
    );
  },

  list: async (req: AuthenticatedRequest, res: Response) => {
    const query = req.query as ListBookingsQuery;
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const bookings = await bookingService.list(req.user!, page, limit, {
      status: query.status,
      search: query.search,
      eventName: query.eventName,
      checkInFrom: query.checkInFrom,
      checkInTo: query.checkInTo,
      checkOutFrom: query.checkOutFrom,
      checkOutTo: query.checkOutTo,
    });
    res
      .status(200)
      .json(successResponse(bookings.data, { meta: bookings.meta }));
  },

  getById: async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = Number(req.params.id);
    const booking = await bookingService.getById(bookingId, req.user!.id, req.user!.role);
    res.status(200).json(successResponse(booking));
  },

  create: async (req: AuthenticatedRequest, res: Response) => {
    const booking = await bookingService.create(req.body, req.user!);
    res.status(201).json(
      successResponse(
        {
          id: booking.id,
          eventId: booking.eventId,
          eventName: booking.eventName,
          checkIn: formatDate(booking.checkIn),
          checkOut: formatDate(booking.checkOut),
          totalPrice: booking.totalPrice,
          status: booking.status,
        },
        { message: 'Booking created successfully' }
      )
    );
  },

  update: async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = Number(req.params.id);
    const booking = await bookingService.update(bookingId, req.body, req.user!);
    res.status(200).json(
      successResponse(
        {
          id: booking.id,
          eventName: booking.eventName,
          checkIn: formatDate(booking.checkIn),
          checkOut: formatDate(booking.checkOut),
          totalPrice: booking.totalPrice,
          status: booking.status,
        },
        { message: 'Booking updated successfully' }
      )
    );
  },

  remove: async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = Number(req.params.id);
    await bookingService.remove(bookingId);
    res.status(204).send();
  },
};
