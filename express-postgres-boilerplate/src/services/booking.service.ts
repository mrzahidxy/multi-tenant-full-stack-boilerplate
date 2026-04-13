import { BookingStatus, Prisma, Role } from '@prisma/client';

import {
  CreateBookingInput,
  CreatePublicBookingInput,
  UpdateBookingInput,
  ListBookingsQuery,
} from '../schemas/booking.schema';
import { HttpError } from '../utils/http-error';
import { prisma } from '../utils/prisma';
import { AuthenticatedUser } from '../types/user';
import { cache } from '../utils/cache';
import { logger } from '../utils/logger';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const CACHE_TTL_SECONDS = 60;
const BOOKING_CACHE_TTL_SECONDS = 60 * 5;

const BOOKING_STATUS_VALUES = new Set(Object.values(BookingStatus));

const bookingListInclude = {
  user: {
    select: {
      id: true,
      email: true,
      name: true,
    },
  },
  event: {
    select: {
      id: true,
      name: true,
      isPublished: true,
      organizer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  payments: {
    select: {
      id: true,
      stripeSessionId: true,
      amount: true,
      currency: true,
      status: true,
      createdAt: true,
    },
  },
} as const;

const bookingDetailInclude = {
  payments: true,
  event: {
    select: {
      id: true,
      name: true,
      description: true,
      isPublished: true,
      organizer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} as const;

type BookingListItem = Prisma.BookingGetPayload<{ include: typeof bookingListInclude }>;
type BookingDetail = Prisma.BookingGetPayload<{ include: typeof bookingDetailInclude }>;
type EventPricingRow = {
  id: string;
  name: string;
  organizerId: string;
  price: Prisma.Decimal;
  isPublished: boolean;
};
type PublicBookingEvent = {
  id: string;
  name: string;
  organizerId: string;
  isPublished: boolean;
};
type PublicBookingSubmission = {
  id: number;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  eventId: string | null;
  eventName: string | null;
  userId: number | null;
  bookingDate: Date | null;
  bookingTime: string | null;
  guestCount: number | null;
  notes: string | null;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
};

type ListBookingsFilters = Partial<ListBookingsQuery> & {
  search?: string;
};

type BookingListScope = {
  where: Prisma.BookingWhereInput;
  cacheScope: string;
};

type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
};

const normalizePagination = (page: number, limit: number) => {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : DEFAULT_PAGE;
  const requestedLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : DEFAULT_LIMIT;
  const safeLimit = Math.min(requestedLimit, MAX_LIMIT);

  return { page: safePage, limit: safeLimit };
};

const parseDate = (value: unknown): Date | undefined => {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  return undefined;
};

const normalizeStatusFilter = (status: unknown): BookingStatus[] | undefined => {
  if (!status) {
    return undefined;
  }

  const statuses = Array.isArray(status) ? status : String(status).split(',');

  const normalized = statuses
    .map((value) => value?.toString().trim())
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toUpperCase())
    .filter((value): value is BookingStatus => BOOKING_STATUS_VALUES.has(value as BookingStatus));

  return normalized.length > 0 ? normalized : undefined;
};

const normalizeFilters = (filters?: Partial<ListBookingsQuery>): Partial<ListBookingsQuery> | undefined => {
  if (!filters) {
    return undefined;
  }

  const normalized: Partial<ListBookingsQuery> = {};

  const status = normalizeStatusFilter((filters as { status?: unknown }).status);
  if (status) {
    normalized.status = status;
  }

  if (typeof filters.eventName === 'string') {
    const trimmed = filters.eventName.trim();
    if (trimmed) {
      normalized.eventName = trimmed;
    }
  }

  const checkInFrom = parseDate((filters as { checkInFrom?: unknown }).checkInFrom);
  if (checkInFrom) {
    normalized.checkInFrom = checkInFrom;
  }

  const checkInTo = parseDate((filters as { checkInTo?: unknown }).checkInTo);
  if (checkInTo) {
    normalized.checkInTo = checkInTo;
  }

  const checkOutFrom = parseDate((filters as { checkOutFrom?: unknown }).checkOutFrom);
  if (checkOutFrom) {
    normalized.checkOutFrom = checkOutFrom;
  }

  const checkOutTo = parseDate((filters as { checkOutTo?: unknown }).checkOutTo);
  if (checkOutTo) {
    normalized.checkOutTo = checkOutTo;
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
};

const normalizeListFilters = (filters?: ListBookingsFilters): ListBookingsFilters | undefined => {
  if (!filters) {
    return undefined;
  }

  const normalized = normalizeFilters(filters);
  const search =
    typeof filters.search === 'string'
      ? filters.search.trim()
      : undefined;

  if (!normalized && !search) {
    return undefined;
  }

  return {
    ...(normalized ?? {}),
    ...(search ? { search } : {}),
  };
};

const resolveBookingListScope = async (actor: AuthenticatedUser): Promise<BookingListScope> => {
  if (actor.role === Role.ADMIN) {
    return {
      where: {},
      cacheScope: 'all',
    };
  }

  if (actor.role === Role.USER) {
    return {
      where: { userId: actor.id },
      cacheScope: `user:${actor.id}`,
    };
  }

  if (actor.role === Role.OWNER) {
    const ownedOrganizerId =
      actor.organizerId ??
      (
        await prisma.organizer.findUnique({
          where: { ownerId: actor.id },
          select: { id: true },
        })
      )?.id ??
      null;

    if (!ownedOrganizerId) {
      throw new HttpError(403, 'Owner bookings require an owned organizer');
    }

    return {
      where: { event: { organizerId: ownedOrganizerId } },
      cacheScope: `organizer:${ownedOrganizerId}`,
    };
  }

  if (actor.role === Role.STAFF) {
    const assignments = await prisma.organizerStaff.findMany({
      where: { userId: actor.id },
      select: { organizerId: true },
    });

    const organizerIds = assignments.map((assignment) => assignment.organizerId);

    if (organizerIds.length === 0) {
      throw new HttpError(403, 'Staff bookings require at least one organizer assignment');
    }

    const cacheScope = `organizers:${organizerIds.slice().sort().join(',')}`;

    return {
      where: { event: { organizerId: { in: organizerIds } } },
      cacheScope,
    };
  }

  return {
    where: { userId: actor.id },
    cacheScope: `user:${actor.id}`,
  };
};

const invalidateBookingCollections = async (userId: number) => {
  if (!cache.isConnectedToRedis()) {
    return;
  }

  await Promise.all([
    cache.delByPrefix(`bookings:${userId}`),
    cache.delByPrefix(`bookings:all`),
  ]);
};

export const bookingService = {
  createPublicSubmission: async (
    input: CreatePublicBookingInput,
    actor?: AuthenticatedUser | null,
    organizerId?: string
  ): Promise<PublicBookingSubmission> => {
    const bookingDate = new Date(`${input.bookingDate}T00:00:00.000Z`);

    if (Number.isNaN(bookingDate.getTime())) {
      throw new HttpError(400, 'Booking date must be a valid date');
    }

    const event = await prisma.event.findUnique({
      where: { id: input.eventId },
      select: {
        id: true,
        name: true,
        organizerId: true,
        isPublished: true,
      },
    });

    if (!event) {
      throw new HttpError(404, 'Event not found');
    }

    if (organizerId && event.organizerId !== organizerId) {
      throw new HttpError(404, 'Event not found for this organizer');
    }

    if (!event.isPublished) {
      throw new HttpError(400, 'This event is not available for public booking');
    }

    const hasGuestDetails =
      Boolean(input.fullName?.trim()) &&
      Boolean(input.email?.trim()) &&
      Boolean(input.phone?.trim());

    if (!actor && !hasGuestDetails) {
      throw new HttpError(400, 'Guest bookings require full name, email, and phone');
    }

    const fullName = input.fullName?.trim() || actor?.name?.trim() || actor?.email?.trim();
    const email = input.email?.trim() || actor?.email?.trim();
    const phone = input.phone?.trim() || null;

    if (!fullName || !email) {
      throw new HttpError(400, 'A full name and email address are required');
    }

    const booking = await prisma.booking.create({
      data: {
        bookingDate,
        bookingTime: input.bookingTime,
        email,
        eventId: event.id,
        eventName: event.name,
        fullName,
        guestCount: input.guestCount,
        notes: input.notes ?? null,
        phone,
        status: BookingStatus.PENDING,
        userId: actor?.id ?? null,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        eventId: true,
        eventName: true,
        userId: true,
        bookingDate: true,
        bookingTime: true,
        guestCount: true,
        notes: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: booking.id,
      fullName: booking.fullName ?? fullName,
      email: booking.email ?? email,
      phone: booking.phone ?? phone ?? '',
      eventId: booking.eventId,
      eventName: booking.eventName,
      userId: booking.userId,
      bookingDate: booking.bookingDate ?? bookingDate,
      bookingTime: booking.bookingTime ?? input.bookingTime,
      guestCount: booking.guestCount ?? input.guestCount,
      notes: booking.notes ?? null,
      status: booking.status,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  },

  list: async (
    actor: AuthenticatedUser,
    page: number = DEFAULT_PAGE,
    limit: number = DEFAULT_LIMIT,
    filters?: ListBookingsFilters
  ): Promise<PaginatedResponse<BookingListItem>> => {
    try {
      const { page: currentPage, limit: currentLimit } = normalizePagination(page, limit);
      const skip = (currentPage - 1) * currentLimit;
      const scope = await resolveBookingListScope(actor);
      const normalizedFilters = normalizeListFilters(filters);

      const filterString = normalizedFilters ? JSON.stringify(normalizedFilters) : '';
      const cacheKey = `bookings:${scope.cacheScope}:${currentPage}:${currentLimit}:${filterString}`;

      if (cache.isConnectedToRedis()) {
        const cached = await cache.get<PaginatedResponse<BookingListItem>>(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const whereClauses: Prisma.BookingWhereInput[] = [];

      if (Object.keys(scope.where).length > 0) {
        whereClauses.push(scope.where);
      }

      if (normalizedFilters) {
        if (normalizedFilters.status && normalizedFilters.status.length > 0) {
          whereClauses.push({ status: { in: normalizedFilters.status } });
        }

        if (normalizedFilters.eventName) {
          whereClauses.push({
            event: {
              name: { contains: normalizedFilters.eventName, mode: 'insensitive' },
            },
          });
        }

        if (normalizedFilters.checkInFrom || normalizedFilters.checkInTo) {
          whereClauses.push({
            checkIn: {
              ...(normalizedFilters.checkInFrom ? { gte: normalizedFilters.checkInFrom } : {}),
              ...(normalizedFilters.checkInTo ? { lte: normalizedFilters.checkInTo } : {}),
            },
          });
        }

        if (normalizedFilters.checkOutFrom || normalizedFilters.checkOutTo) {
          whereClauses.push({
            checkOut: {
              ...(normalizedFilters.checkOutFrom ? { gte: normalizedFilters.checkOutFrom } : {}),
              ...(normalizedFilters.checkOutTo ? { lte: normalizedFilters.checkOutTo } : {}),
            },
          });
        }
      }

      if (normalizedFilters?.search) {
        whereClauses.push({
          OR: [
            { fullName: { contains: normalizedFilters.search, mode: 'insensitive' } },
            { email: { contains: normalizedFilters.search, mode: 'insensitive' } },
            { phone: { contains: normalizedFilters.search, mode: 'insensitive' } },
            { eventName: { contains: normalizedFilters.search, mode: 'insensitive' } },
            {
              event: {
                name: { contains: normalizedFilters.search, mode: 'insensitive' },
              },
            },
          ],
        });
      }

      const where: Prisma.BookingWhereInput =
        whereClauses.length === 0 ? {} : whereClauses.length === 1 ? whereClauses[0] : { AND: whereClauses };

      const [bookings, totalItems] = await prisma.$transaction([
        prisma.booking.findMany({
          where,
          include: bookingListInclude,
          skip,
          take: currentLimit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.booking.count({ where }),
      ]);

      const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / currentLimit);

      const response: PaginatedResponse<BookingListItem> = {
        data: bookings,
        meta: {
          page: currentPage,
          limit: currentLimit,
          totalItems,
          totalPages,
        },
      };

      if (cache.isConnectedToRedis()) {
        await cache.set(cacheKey, response, CACHE_TTL_SECONDS);
      }

      return response;
    } catch (error) {
      logger.error({ err: error }, 'Failed to list bookings');
      throw error;
    }
  },

  getById: async (bookingId: number, userId?: number, role?: Role): Promise<BookingDetail> => {
    const cacheKey = `booking:${bookingId}`;

    if (cache.isConnectedToRedis()) {
      const cached = await cache.get<BookingDetail>(cacheKey);
      if (cached) {
        if (role !== Role.ADMIN && cached.userId !== userId) {
          throw new HttpError(403, 'Forbidden');
        }

        return cached;
      }
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: bookingDetailInclude,
    });

    if (!booking) {
      throw new HttpError(404, 'Booking not found');
    }

    if (role !== Role.ADMIN && booking.userId !== userId) {
      throw new HttpError(403, 'Forbidden');
    }

    if (cache.isConnectedToRedis()) {
      await cache.set(cacheKey, booking, BOOKING_CACHE_TTL_SECONDS);
    }

    return booking;
  },

  create: async (input: CreateBookingInput, user: AuthenticatedUser) => {
    // Validate date format and ensure checkOut is after checkIn
    const checkInDate = new Date(input.checkIn);
    const checkOutDate = new Date(input.checkOut);

    if (isNaN(checkInDate.getTime())) {
      throw new HttpError(400, 'Invalid check-in date format. Use YYYY-MM-DD.');
    }
    if (isNaN(checkOutDate.getTime())) {
      throw new HttpError(400, 'Invalid check-out date format. Use YYYY-MM-DD.');
    }
    if (checkOutDate <= checkInDate) {
      throw new HttpError(400, 'Check-out date must be after check-in date.');
    }

    const [event] = await prisma.$queryRaw<EventPricingRow[]>`
      SELECT
        id,
        name,
        "organizerId",
        price,
        "isPublished"
      FROM "Event"
      WHERE id = ${input.eventId}
      LIMIT 1
    `;

    if (!event) {
      throw new HttpError(404, 'Event not found');
    }

    if (user.role === Role.USER && !event.isPublished) {
      throw new HttpError(403, 'You are not allowed to book an unpublished event');
    }

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        eventId: event.id,
        eventName: event.name,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        totalPrice: event.price,
        status: BookingStatus.PENDING,
      },
    });

    if (cache.isConnectedToRedis()) {
      await invalidateBookingCollections(user.id);
    }

    return booking;
  },

  update: async (bookingId: number, input: UpdateBookingInput, user: AuthenticatedUser) => {
    const existing = await prisma.booking.findUnique({ where: { id: bookingId } });

    if (!existing) {
      throw new HttpError(404, 'Booking not found');
    }

    if (!existing.userId || !existing.checkIn || !existing.checkOut) {
      throw new HttpError(400, 'This booking cannot be updated through the authenticated booking flow');
    }

    if (user.role !== Role.ADMIN && existing.userId !== user.id) {
      throw new HttpError(403, 'Forbidden');
    }

    // Validate dates if provided
    let checkInDate: Date | undefined;
    let checkOutDate: Date | undefined;

    if (input.checkIn) {
      checkInDate = new Date(input.checkIn);
      if (isNaN(checkInDate.getTime())) {
        throw new HttpError(400, 'Invalid check-in date format. Use YYYY-MM-DD.');
      }
    }

    if (input.checkOut) {
      checkOutDate = new Date(input.checkOut);
      if (isNaN(checkOutDate.getTime())) {
        throw new HttpError(400, 'Invalid check-out date format. Use YYYY-MM-DD.');
      }
    }

    // Use existing dates if not provided
    const finalCheckIn = checkInDate || existing.checkIn;
    const finalCheckOut = checkOutDate || existing.checkOut;

    if (finalCheckOut <= finalCheckIn) {
      throw new HttpError(400, 'Check-out date must be after check-in date.');
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        checkIn: finalCheckIn,
        checkOut: finalCheckOut,
      },
    });

    if (cache.isConnectedToRedis()) {
      await Promise.all([
        cache.del(`booking:${bookingId}`),
        invalidateBookingCollections(existing.userId),
      ]);
    }

    return booking;
  },

  remove: async (bookingId: number) => {
    const existing = await prisma.booking.findUnique({ where: { id: bookingId } });

    if (!existing) {
      throw new HttpError(404, 'Booking not found');
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany({
        where: { bookingId },
      });

      return tx.booking.delete({
        where: { id: bookingId },
      });
    });

    if (cache.isConnectedToRedis()) {
      const cacheOperations = [cache.del(`booking:${bookingId}`)];

      if (result.userId) {
        cacheOperations.push(invalidateBookingCollections(result.userId));
        cacheOperations.push(cache.delByPrefix(`payments:${result.userId}`));
      }

      await Promise.all(cacheOperations);
    }

    return result;
  },
};
