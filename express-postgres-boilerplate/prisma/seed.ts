import 'dotenv/config';

import { BookingStatus, PaymentStatus, PrismaClient, Role } from '@prisma/client';

import { resolvePermissions } from '../src/config/rbac';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

const primaryOwnerEmail = process.env.SEED_OWNER_EMAIL?.trim() || 'owner@example.com';
const primaryOwnerPassword = process.env.SEED_OWNER_PASSWORD || 'changeMeOwner1!';

type SeedUser = {
  email: string;
  name: string;
  role: Role;
  password: string;
};

type SeedEvent = {
  name: string;
  description: string;
  price: number;
  isPublished: boolean;
};

type SeedOrganizer = {
  name: string;
  ownerEmail: string;
  isSuspended?: boolean;
  events: SeedEvent[];
};

type SeedBooking = {
  key: string;
  userEmail: string;
  organizerName: string;
  eventName: string;
  createdAt?: string;
  updatedAt?: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: BookingStatus;
  notes: string;
};

type SeedPayment = {
  bookingKey: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt?: string;
  updatedAt?: string;
  stripeSessionId: string;
  stripePaymentIntentId?: string;
};

const seedReferenceDate = new Date('2026-04-15T12:00:00.000Z');

const isoDaysAgo = (daysAgo: number, hour = 12) => {
  const date = new Date(seedReferenceDate);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString();
};

type SeedGuestBooking = {
  fullName: string;
  email: string;
  phone: string;
  bookingDate: string;
  bookingTime: string;
  guestCount: number;
  status: BookingStatus;
  notes: string;
};

const usersToSeed: SeedUser[] = [
  {
    email: 'admin@example.com',
    name: 'Admin User',
    role: Role.ADMIN,
    password: 'changeMeAdmin1!',
  },
  {
    email: 'admin.audit@example.com',
    name: 'Admin Auditor',
    role: Role.ADMIN,
    password: 'changeMeAdmin2!',
  },
  {
    email: primaryOwnerEmail,
    name: 'Organizer Owner',
    role: Role.OWNER,
    password: primaryOwnerPassword,
  },
  {
    email: 'owner2@example.com',
    name: 'Second Organizer Owner',
    role: Role.OWNER,
    password: 'changeMeOwner2!',
  },
  {
    email: 'owner3@example.com',
    name: 'Suspended Organizer Owner',
    role: Role.OWNER,
    password: 'changeMeOwner3!',
  },
  {
    email: 'owner4@example.com',
    name: 'Independent Organizer Owner',
    role: Role.OWNER,
    password: 'changeMeOwner4!',
  },
  {
    email: 'owner-no-organizer@example.com',
    name: 'Owner Without Organizer',
    role: Role.OWNER,
    password: 'changeMeOwner5!',
  },
  {
    email: 'user1@example.com',
    name: 'Avery Johnson',
    role: Role.USER,
    password: 'changeMeUser1!',
  },
  {
    email: 'user2@example.com',
    name: 'Blake Carter',
    role: Role.USER,
    password: 'changeMeUser2!',
  },
  {
    email: 'user3@example.com',
    name: 'Casey Morgan',
    role: Role.USER,
    password: 'changeMeUser3!',
  },
  {
    email: 'user4@example.com',
    name: 'Devon Lee',
    role: Role.USER,
    password: 'changeMeUser4!',
  },
  {
    email: 'user5@example.com',
    name: 'Emerson Patel',
    role: Role.USER,
    password: 'changeMeUser5!',
  },
  {
    email: 'user6@example.com',
    name: 'Finley Carter',
    role: Role.USER,
    password: 'changeMeUser6!',
  },
  {
    email: 'user7@example.com',
    name: 'Harper Quinn',
    role: Role.USER,
    password: 'changeMeUser7!',
  },
  {
    email: 'staff1@example.com',
    name: 'Jordan Reyes',
    role: Role.STAFF,
    password: 'changeMeStaff1!',
  },
  {
    email: 'staff2@example.com',
    name: 'Taylor Brooks',
    role: Role.STAFF,
    password: 'changeMeStaff2!',
  },
  {
    email: 'staff3@example.com',
    name: 'Morgan Tate',
    role: Role.STAFF,
    password: 'changeMeStaff3!',
  },
];

const organizerSeeds: SeedOrganizer[] = [
  {
    name: 'Northwind Live',
    ownerEmail: primaryOwnerEmail,
    events: [
      {
        name: 'Founders Summit 2026',
        description: 'Annual summit for founders, operators, and startup teams.',
        price: 199,
        isPublished: true,
      },
      {
        name: 'Growth Marketing Intensive',
        description: 'Hands-on growth workshop with practical campaign reviews.',
        price: 149,
        isPublished: true,
      },
      {
        name: 'Private Leadership Retreat',
        description: 'Invite-only strategy retreat for selected leadership teams.',
        price: 299,
        isPublished: false,
      },
    ],
  },
  {
    name: 'Blue Harbor Events',
    ownerEmail: 'owner2@example.com',
    isSuspended: true,
    events: [
      {
        name: 'Product Launch Expo',
        description: 'Launch-focused expo for product, sales, and partnerships teams.',
        price: 179,
        isPublished: true,
      },
      {
        name: 'Community Meetup Night',
        description: 'Open networking and community-building event.',
        price: 49,
        isPublished: true,
      },
      {
        name: 'Internal Planning Workshop',
        description: 'Private internal planning session for organizer staff.',
        price: 129,
        isPublished: false,
      },
      {
        name: 'Creator Economy Forum',
        description: 'Panel-driven forum for creators, agencies, and brand partnerships.',
        price: 159,
        isPublished: true,
      },
      {
        name: 'Revenue Operations Roundtable',
        description: 'Private roundtable for revenue, sales ops, and lifecycle teams.',
        price: 189,
        isPublished: false,
      },
    ],
  },
  {
    name: 'Maple Street Gatherings',
    ownerEmail: 'owner3@example.com',
    events: [
      {
        name: 'Neighborhood Brunch Social',
        description: 'Casual brunch event for local community members.',
        price: 35,
        isPublished: true,
      },
      {
        name: 'Autumn Makers Market',
        description: 'Seasonal market featuring local makers and food vendors.',
        price: 25,
        isPublished: true,
      },
    ],
  },
  {
    name: 'Quiet Harbor Labs',
    ownerEmail: 'owner4@example.com',
    events: [
      {
        name: 'Beta Product Showcase',
        description: 'Public showcase event used for isolated owner test flows.',
        price: 89,
        isPublished: true,
      },
      {
        name: 'Owner Strategy Sprint',
        description: 'Unpublished planning event for permission and owner-only tests.',
        price: 129,
        isPublished: false,
      },
    ],
  },
];

const bookingSeeds: SeedBooking[] = [
  {
    key: 'booking-user1-summit-confirmed',
    userEmail: 'user1@example.com',
    organizerName: 'Northwind Live',
    eventName: 'Founders Summit 2026',
    createdAt: isoDaysAgo(1, 10),
    updatedAt: isoDaysAgo(1, 14),
    checkIn: '2026-04-12T09:00:00.000Z',
    checkOut: '2026-04-13T18:00:00.000Z',
    totalPrice: 199,
    status: BookingStatus.CONFIRMED,
    notes: 'Confirmed booking for a published flagship event',
  },
  {
    key: 'booking-user1-growth-pending',
    userEmail: 'user1@example.com',
    organizerName: 'Northwind Live',
    eventName: 'Growth Marketing Intensive',
    createdAt: isoDaysAgo(0, 8),
    updatedAt: isoDaysAgo(0, 11),
    checkIn: '2026-05-03T10:00:00.000Z',
    checkOut: '2026-05-03T17:00:00.000Z',
    totalPrice: 149,
    status: BookingStatus.PENDING,
    notes: 'Pending booking used for checkout and payment testing',
  },
  {
    key: 'booking-user2-summit-completed',
    userEmail: 'user2@example.com',
    organizerName: 'Northwind Live',
    eventName: 'Founders Summit 2026',
    createdAt: isoDaysAgo(6, 9),
    updatedAt: isoDaysAgo(5, 16),
    checkIn: '2026-03-01T09:00:00.000Z',
    checkOut: '2026-03-02T18:00:00.000Z',
    totalPrice: 249,
    status: BookingStatus.COMPLETED,
    notes: 'Completed booking with successful payment history',
  },
  {
    key: 'booking-user2-expo-cancelled',
    userEmail: 'user2@example.com',
    organizerName: 'Blue Harbor Events',
    eventName: 'Product Launch Expo',
    createdAt: isoDaysAgo(12, 13),
    updatedAt: isoDaysAgo(11, 10),
    checkIn: '2026-06-15T08:30:00.000Z',
    checkOut: '2026-06-15T18:00:00.000Z',
    totalPrice: 179,
    status: BookingStatus.CANCELLED,
    notes: 'Cancelled booking for testing status filters',
  },
  {
    key: 'booking-user3-expo-confirmed',
    userEmail: 'user3@example.com',
    organizerName: 'Blue Harbor Events',
    eventName: 'Product Launch Expo',
    createdAt: isoDaysAgo(2, 12),
    updatedAt: isoDaysAgo(1, 9),
    checkIn: '2026-07-21T08:30:00.000Z',
    checkOut: '2026-07-21T18:00:00.000Z',
    totalPrice: 299,
    status: BookingStatus.CONFIRMED,
    notes: 'High-value confirmed booking for cross-organizer reporting',
  },
  {
    key: 'booking-user3-meetup-pending',
    userEmail: 'user3@example.com',
    organizerName: 'Blue Harbor Events',
    eventName: 'Community Meetup Night',
    createdAt: isoDaysAgo(4, 10),
    updatedAt: isoDaysAgo(3, 15),
    checkIn: '2026-08-10T16:00:00.000Z',
    checkOut: '2026-08-10T21:00:00.000Z',
    totalPrice: 49,
    status: BookingStatus.PENDING,
    notes: 'Low-cost pending booking for pagination and payment tests',
  },
  {
    key: 'booking-user4-growth-completed',
    userEmail: 'user4@example.com',
    organizerName: 'Northwind Live',
    eventName: 'Growth Marketing Intensive',
    createdAt: isoDaysAgo(9, 11),
    updatedAt: isoDaysAgo(8, 17),
    checkIn: '2026-02-14T10:00:00.000Z',
    checkOut: '2026-02-14T17:00:00.000Z',
    totalPrice: 149,
    status: BookingStatus.COMPLETED,
    notes: 'Completed single-day workshop booking for historical analytics',
  },
  {
    key: 'booking-user4-meetup-confirmed',
    userEmail: 'user4@example.com',
    organizerName: 'Blue Harbor Events',
    eventName: 'Community Meetup Night',
    createdAt: isoDaysAgo(15, 14),
    updatedAt: isoDaysAgo(14, 10),
    checkIn: '2026-09-18T16:00:00.000Z',
    checkOut: '2026-09-18T21:00:00.000Z',
    totalPrice: 49,
    status: BookingStatus.CONFIRMED,
    notes: 'Confirmed evening community event booking',
  },
  {
    key: 'booking-user5-summit-pending',
    userEmail: 'user5@example.com',
    organizerName: 'Northwind Live',
    eventName: 'Founders Summit 2026',
    createdAt: isoDaysAgo(3, 9),
    updatedAt: isoDaysAgo(2, 15),
    checkIn: '2026-10-07T09:00:00.000Z',
    checkOut: '2026-10-08T18:00:00.000Z',
    totalPrice: 199,
    status: BookingStatus.PENDING,
    notes: 'Pending flagship event booking awaiting payment completion',
  },
  {
    key: 'booking-user5-expo-completed',
    userEmail: 'user5@example.com',
    organizerName: 'Blue Harbor Events',
    eventName: 'Product Launch Expo',
    createdAt: isoDaysAgo(24, 12),
    updatedAt: isoDaysAgo(22, 10),
    checkIn: '2026-01-21T08:30:00.000Z',
    checkOut: '2026-01-21T18:00:00.000Z',
    totalPrice: 179,
    status: BookingStatus.COMPLETED,
    notes: 'Completed product launch booking used for revenue reporting',
  },
  {
    key: 'booking-user1-maple-brunch-cancelled',
    userEmail: 'user1@example.com',
    organizerName: 'Maple Street Gatherings',
    eventName: 'Neighborhood Brunch Social',
    createdAt: isoDaysAgo(20, 9),
    updatedAt: isoDaysAgo(19, 11),
    checkIn: '2026-11-22T10:00:00.000Z',
    checkOut: '2026-11-22T14:00:00.000Z',
    totalPrice: 35,
    status: BookingStatus.CANCELLED,
    notes: 'Cancelled community booking for owner-side cancellation review',
  },
  {
    key: 'booking-user2-retreat-confirmed',
    userEmail: 'user2@example.com',
    organizerName: 'Northwind Live',
    eventName: 'Private Leadership Retreat',
    createdAt: isoDaysAgo(7, 13),
    updatedAt: isoDaysAgo(6, 10),
    checkIn: '2026-12-11T09:00:00.000Z',
    checkOut: '2026-12-12T18:00:00.000Z',
    totalPrice: 299,
    status: BookingStatus.CONFIRMED,
    notes: 'Booking linked to an unpublished event for admin/owner visibility tests',
  },
  {
    key: 'booking-user3-maple-market-completed',
    userEmail: 'user3@example.com',
    organizerName: 'Maple Street Gatherings',
    eventName: 'Autumn Makers Market',
    createdAt: isoDaysAgo(17, 10),
    updatedAt: isoDaysAgo(16, 16),
    checkIn: '2026-10-03T09:30:00.000Z',
    checkOut: '2026-10-03T17:30:00.000Z',
    totalPrice: 25,
    status: BookingStatus.COMPLETED,
    notes: 'Low-price completed booking for tenant-level analytics edge cases',
  },
  {
    key: 'booking-user7-quiet-showcase-pending',
    userEmail: 'user7@example.com',
    organizerName: 'Quiet Harbor Labs',
    eventName: 'Beta Product Showcase',
    createdAt: isoDaysAgo(5, 12),
    updatedAt: isoDaysAgo(4, 13),
    checkIn: '2026-09-07T12:00:00.000Z',
    checkOut: '2026-09-07T18:00:00.000Z',
    totalPrice: 89,
    status: BookingStatus.PENDING,
    notes: 'Pending booking intentionally left without payment for manual flow tests',
  },
];

const paymentSeeds: SeedPayment[] = [
  {
    bookingKey: 'booking-user1-summit-confirmed',
    amount: 199,
    currency: 'usd',
    status: PaymentStatus.SUCCEEDED,
    createdAt: isoDaysAgo(1, 11),
    updatedAt: isoDaysAgo(1, 14),
    stripeSessionId: 'seed_session_user1_summit_confirmed',
    stripePaymentIntentId: 'seed_pi_user1_summit_confirmed',
  },
  {
    bookingKey: 'booking-user1-growth-pending',
    amount: 149,
    currency: 'usd',
    status: PaymentStatus.PENDING,
    createdAt: isoDaysAgo(0, 8),
    updatedAt: isoDaysAgo(0, 11),
    stripeSessionId: 'seed_session_user1_growth_pending',
  },
  {
    bookingKey: 'booking-user2-summit-completed',
    amount: 249,
    currency: 'usd',
    status: PaymentStatus.SUCCEEDED,
    createdAt: isoDaysAgo(6, 10),
    updatedAt: isoDaysAgo(5, 16),
    stripeSessionId: 'seed_session_user2_summit_completed',
    stripePaymentIntentId: 'seed_pi_user2_summit_completed',
  },
  {
    bookingKey: 'booking-user2-expo-cancelled',
    amount: 179,
    currency: 'usd',
    status: PaymentStatus.FAILED,
    createdAt: isoDaysAgo(12, 13),
    updatedAt: isoDaysAgo(11, 10),
    stripeSessionId: 'seed_session_user2_expo_cancelled',
    stripePaymentIntentId: 'seed_pi_user2_expo_cancelled',
  },
  {
    bookingKey: 'booking-user3-expo-confirmed',
    amount: 299,
    currency: 'usd',
    status: PaymentStatus.SUCCEEDED,
    createdAt: isoDaysAgo(2, 12),
    updatedAt: isoDaysAgo(1, 9),
    stripeSessionId: 'seed_session_user3_expo_confirmed',
    stripePaymentIntentId: 'seed_pi_user3_expo_confirmed',
  },
  {
    bookingKey: 'booking-user3-meetup-pending',
    amount: 49,
    currency: 'usd',
    status: PaymentStatus.PENDING,
    createdAt: isoDaysAgo(4, 10),
    updatedAt: isoDaysAgo(3, 15),
    stripeSessionId: 'seed_session_user3_meetup_pending',
  },
  {
    bookingKey: 'booking-user4-growth-completed',
    amount: 149,
    currency: 'usd',
    status: PaymentStatus.SUCCEEDED,
    createdAt: isoDaysAgo(9, 11),
    updatedAt: isoDaysAgo(8, 17),
    stripeSessionId: 'seed_session_user4_growth_completed',
    stripePaymentIntentId: 'seed_pi_user4_growth_completed',
  },
  {
    bookingKey: 'booking-user4-meetup-confirmed',
    amount: 49,
    currency: 'usd',
    status: PaymentStatus.SUCCEEDED,
    createdAt: isoDaysAgo(15, 14),
    updatedAt: isoDaysAgo(14, 10),
    stripeSessionId: 'seed_session_user4_meetup_confirmed',
    stripePaymentIntentId: 'seed_pi_user4_meetup_confirmed',
  },
  {
    bookingKey: 'booking-user5-summit-pending',
    amount: 199,
    currency: 'usd',
    status: PaymentStatus.PENDING,
    createdAt: isoDaysAgo(3, 9),
    updatedAt: isoDaysAgo(2, 15),
    stripeSessionId: 'seed_session_user5_summit_pending',
  },
  {
    bookingKey: 'booking-user5-expo-completed',
    amount: 179,
    currency: 'usd',
    status: PaymentStatus.SUCCEEDED,
    createdAt: isoDaysAgo(24, 12),
    updatedAt: isoDaysAgo(22, 10),
    stripeSessionId: 'seed_session_user5_expo_completed',
    stripePaymentIntentId: 'seed_pi_user5_expo_completed',
  },
  {
    bookingKey: 'booking-user1-maple-brunch-cancelled',
    amount: 35,
    currency: 'usd',
    status: PaymentStatus.FAILED,
    createdAt: isoDaysAgo(20, 9),
    updatedAt: isoDaysAgo(19, 11),
    stripeSessionId: 'seed_session_user1_maple_brunch_cancelled',
    stripePaymentIntentId: 'seed_pi_user1_maple_brunch_cancelled',
  },
  {
    bookingKey: 'booking-user2-retreat-confirmed',
    amount: 299,
    currency: 'usd',
    status: PaymentStatus.SUCCEEDED,
    createdAt: isoDaysAgo(7, 13),
    updatedAt: isoDaysAgo(6, 10),
    stripeSessionId: 'seed_session_user2_retreat_confirmed',
    stripePaymentIntentId: 'seed_pi_user2_retreat_confirmed',
  },
  {
    bookingKey: 'booking-user3-maple-market-completed',
    amount: 25,
    currency: 'usd',
    status: PaymentStatus.SUCCEEDED,
    createdAt: isoDaysAgo(17, 10),
    updatedAt: isoDaysAgo(16, 16),
    stripeSessionId: 'seed_session_user3_maple_market_completed',
    stripePaymentIntentId: 'seed_pi_user3_maple_market_completed',
  },
];

const guestBookingSeeds: SeedGuestBooking[] = [
  {
    fullName: 'Mia Turner',
    email: 'mia.turner@example.com',
    phone: '+1 555 310 8842',
    bookingDate: '2026-11-05',
    bookingTime: '18:30',
    guestCount: 2,
    status: BookingStatus.PENDING,
    notes: '[seed-guest-booking-1] Guest reservation from landing page form',
  },
  {
    fullName: 'Noah Kim',
    email: 'noah.kim@example.com',
    phone: '+1 555 991 4431',
    bookingDate: '2026-11-09',
    bookingTime: '20:00',
    guestCount: 6,
    status: BookingStatus.CONFIRMED,
    notes: '[seed-guest-booking-2] Large-party guest reservation for admin review',
  },
  {
    fullName: 'Olivia Cruz',
    email: 'olivia.cruz@example.com',
    phone: '+1 555 224 0090',
    bookingDate: '2026-11-17',
    bookingTime: '19:15',
    guestCount: 4,
    status: BookingStatus.CANCELLED,
    notes: '[seed-guest-booking-3] Cancelled guest reservation for dashboard edge-case testing',
  },
];

async function upsertUser(userData: SeedUser) {
  const passwordHash = await hashPassword(userData.password);
  const permissions = resolvePermissions(userData.role);

  return prisma.user.upsert({
    where: { email: userData.email },
    update: {
      name: userData.name,
      passwordHash,
      role: userData.role,
      permissions,
    },
    create: {
      email: userData.email,
      name: userData.name,
      passwordHash,
      role: userData.role,
      permissions,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });
}

async function ensureSchemaIsCurrent(): Promise<void> {
  const eventPriceColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Event'
      AND column_name = 'price'
  `;

  if (eventPriceColumns.length === 0) {
    throw new Error(
      'Database schema is outdated: missing Event.price. Run `npm run prisma:push` and then retry seeding.'
    );
  }

  const organizerSuspensionColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Organizer'
      AND column_name IN ('isSuspended', 'suspendedAt')
  `;

  if (organizerSuspensionColumns.length < 2) {
    throw new Error(
      'Database schema is outdated: missing Organizer suspension columns. Run `npm run prisma:push` and then retry seeding.'
    );
  }

  const guestBookingColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Booking'
      AND column_name IN ('fullName', 'email', 'phone', 'bookingDate', 'bookingTime', 'guestCount')
  `;

  if (guestBookingColumns.length < 6) {
    throw new Error(
      'Database schema is outdated: missing guest-booking columns on Booking. Run `npm run prisma:push` and then retry seeding.'
    );
  }
}

async function resetSeedData(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "Payment",
      "Booking",
      "OrganizerStaff",
      "Event",
      "Organizer",
      "User"
    RESTART IDENTITY CASCADE
  `);
}

async function upsertOrganizer(name: string, ownerId: number) {
  return prisma.organizer.upsert({
    where: { ownerId },
    update: { name },
    create: {
      name,
      ownerId,
    },
    select: {
      id: true,
      name: true,
      ownerId: true,
    },
  });
}

async function setOrganizerSuspension(organizerId: string, isSuspended: boolean) {
  const suspendedAt = isSuspended ? new Date('2026-04-08T10:30:00.000Z') : null;

  await prisma.$executeRaw`
    UPDATE "Organizer"
    SET
      "isSuspended" = ${isSuspended},
      "suspendedAt" = ${suspendedAt},
      "updatedAt" = NOW()
    WHERE id = CAST(${organizerId} AS UUID)
  `;
}

async function upsertEvent(organizerId: string, eventSeed: SeedEvent) {
  const existing = await prisma.event.findFirst({
    where: {
      organizerId,
      name: eventSeed.name,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (existing) {
    return prisma.event.update({
      where: { id: existing.id },
      data: {
        description: eventSeed.description,
        price: eventSeed.price,
        isPublished: eventSeed.isPublished,
      },
      select: {
        id: true,
        name: true,
        organizerId: true,
        price: true,
      },
    });
  }

  return prisma.event.create({
    data: {
      organizerId,
      name: eventSeed.name,
      description: eventSeed.description,
      price: eventSeed.price,
      isPublished: eventSeed.isPublished,
    },
    select: {
      id: true,
      name: true,
      organizerId: true,
      price: true,
    },
  });
}

async function upsertBooking(
  bookingSeed: SeedBooking,
  userId: number,
  eventId: string
) {
  const checkIn = new Date(bookingSeed.checkIn);
  const checkOut = new Date(bookingSeed.checkOut);
  const createdAt = bookingSeed.createdAt ? new Date(bookingSeed.createdAt) : new Date();
  const updatedAt = bookingSeed.updatedAt ? new Date(bookingSeed.updatedAt) : createdAt;

  const existing = await prisma.booking.findFirst({
    where: {
      userId,
      eventId,
      checkIn,
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    return prisma.booking.update({
      where: { id: existing.id },
      data: {
        eventName: bookingSeed.eventName,
        checkOut,
        totalPrice: bookingSeed.totalPrice,
        status: bookingSeed.status,
        notes: bookingSeed.notes,
        createdAt,
        updatedAt,
      },
      select: {
        id: true,
        status: true,
      },
    });
  }

  return prisma.booking.create({
    data: {
      userId,
      eventId,
      eventName: bookingSeed.eventName,
      checkIn,
      checkOut,
      totalPrice: bookingSeed.totalPrice,
      status: bookingSeed.status,
      notes: bookingSeed.notes,
      createdAt,
      updatedAt,
    },
    select: {
      id: true,
      status: true,
    },
  });
}

async function upsertPayment(paymentSeed: SeedPayment, bookingId: number) {
  const createdAt = paymentSeed.createdAt ? new Date(paymentSeed.createdAt) : new Date();
  const updatedAt = paymentSeed.updatedAt ? new Date(paymentSeed.updatedAt) : createdAt;

  return prisma.payment.upsert({
    where: {
      stripeSessionId: paymentSeed.stripeSessionId,
    },
    update: {
      bookingId,
      amount: paymentSeed.amount,
      currency: paymentSeed.currency,
      status: paymentSeed.status,
      stripePaymentIntentId: paymentSeed.stripePaymentIntentId ?? null,
      createdAt,
      updatedAt,
    },
    create: {
      bookingId,
      amount: paymentSeed.amount,
      currency: paymentSeed.currency,
      status: paymentSeed.status,
      stripeSessionId: paymentSeed.stripeSessionId,
      stripePaymentIntentId: paymentSeed.stripePaymentIntentId ?? null,
      createdAt,
      updatedAt,
    },
    select: {
      id: true,
    },
  });
}

async function upsertGuestBooking(guestBooking: SeedGuestBooking) {
  const bookingDate = new Date(`${guestBooking.bookingDate}T00:00:00.000Z`);

  await prisma.$executeRaw`
    DELETE FROM "Booking"
    WHERE "userId" IS NULL
      AND email = ${guestBooking.email}
      AND "bookingDate" = ${bookingDate}
      AND "bookingTime" = ${guestBooking.bookingTime}
  `;

  const [booking] = await prisma.$queryRaw<Array<{ id: number; status: BookingStatus }>>`
    INSERT INTO "Booking" (
      "fullName",
      email,
      phone,
      "bookingDate",
      "bookingTime",
      "guestCount",
      notes,
      status,
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${guestBooking.fullName},
      ${guestBooking.email},
      ${guestBooking.phone},
      ${bookingDate},
      ${guestBooking.bookingTime},
      ${guestBooking.guestCount},
      ${guestBooking.notes},
      CAST(${guestBooking.status} AS "BookingStatus"),
      NOW(),
      NOW()
    )
    RETURNING id, status
  `;

  return booking;
}

async function main(): Promise<void> {
  await ensureSchemaIsCurrent();
  await resetSeedData();

  const usersByEmail = new Map<string, Awaited<ReturnType<typeof upsertUser>>>();

  for (const userData of usersToSeed) {
    const user = await upsertUser(userData);
    usersByEmail.set(user.email, user);
  }

  const organizersByName = new Map<string, Awaited<ReturnType<typeof upsertOrganizer>>>();
  const eventsByKey = new Map<string, Awaited<ReturnType<typeof upsertEvent>>>();

  for (const organizerSeed of organizerSeeds) {
    const owner = usersByEmail.get(organizerSeed.ownerEmail);

    if (!owner) {
      throw new Error(`Missing owner for organizer ${organizerSeed.name}`);
    }

    const organizer = await upsertOrganizer(organizerSeed.name, owner.id);
    await setOrganizerSuspension(organizer.id, organizerSeed.isSuspended ?? false);
    organizersByName.set(organizer.name, organizer);

    for (const eventSeed of organizerSeed.events) {
      const event = await upsertEvent(organizer.id, eventSeed);
      eventsByKey.set(`${organizer.name}:${event.name}`, event);
    }
  }

  const staffAssignments = [
    { organizerName: 'Northwind Live', staffEmail: 'staff1@example.com' },
    { organizerName: 'Blue Harbor Events', staffEmail: 'staff2@example.com' },
    { organizerName: 'Northwind Live', staffEmail: 'staff2@example.com' },
  ];

  for (const assignment of staffAssignments) {
    const organizer = organizersByName.get(assignment.organizerName);
    const staffUser = usersByEmail.get(assignment.staffEmail);

    if (!organizer || !staffUser) {
      throw new Error(`Missing staff assignment dependency for ${assignment.organizerName}`);
    }

    await prisma.organizerStaff.upsert({
      where: {
        organizerId_userId: {
          organizerId: organizer.id,
          userId: staffUser.id,
        },
      },
      update: {},
      create: {
        organizerId: organizer.id,
        userId: staffUser.id,
      },
    });
  }

  const bookingsByKey = new Map<string, Awaited<ReturnType<typeof upsertBooking>>>();

  for (const bookingSeed of bookingSeeds) {
    const user = usersByEmail.get(bookingSeed.userEmail);
    const event = eventsByKey.get(`${bookingSeed.organizerName}:${bookingSeed.eventName}`);

    if (!user || !event) {
      throw new Error(`Missing booking dependency for ${bookingSeed.key}`);
    }

    const booking = await upsertBooking(bookingSeed, user.id, event.id);
    bookingsByKey.set(bookingSeed.key, booking);
  }

  for (const paymentSeed of paymentSeeds) {
    const booking = bookingsByKey.get(paymentSeed.bookingKey);

    if (!booking) {
      throw new Error(`Missing booking for payment ${paymentSeed.stripeSessionId}`);
    }

    await upsertPayment(paymentSeed, booking.id);
  }

  for (const guestBookingSeed of guestBookingSeeds) {
    await upsertGuestBooking(guestBookingSeed);
  }

  const bookingCounts = bookingSeeds.reduce<Record<BookingStatus, number>>(
    (acc, booking) => {
      acc[booking.status] += 1;
      return acc;
    },
    {
      PENDING: 0,
      CONFIRMED: 0,
      CANCELLED: 0,
      COMPLETED: 0,
    }
  );

  console.info('Database has been seeded successfully');
  console.info(`Seeded users: ${usersToSeed.length}`);
  console.info(`Seeded organizers: ${organizerSeeds.length}`);
  console.info(`Seeded events: ${Array.from(eventsByKey.keys()).length}`);
  console.info(
    `Seeded bookings: ${bookingSeeds.length} (pending: ${bookingCounts.PENDING}, confirmed: ${bookingCounts.CONFIRMED}, cancelled: ${bookingCounts.CANCELLED}, completed: ${bookingCounts.COMPLETED})`
  );
  console.info(
    `Seeded guest bookings: ${guestBookingSeeds.length} (shared Booking table, no auth required)`
  );
  console.info(`Seeded payments: ${paymentSeeds.length}`);
  console.info('Business owner test logins:');
  console.info(`  email: ${primaryOwnerEmail}`);
  console.info('  password: (from SEED_OWNER_PASSWORD or changeMeOwner1!)');
  console.info('  organizer: Northwind Live');
  console.info('  email: owner2@example.com');
  console.info('  password: changeMeOwner2!');
  console.info('  organizer: Blue Harbor Events (suspended)');
  console.info('  email: owner4@example.com');
  console.info('  password: changeMeOwner4!');
  console.info('  organizer: Quiet Harbor Labs');
  console.info('  email: owner-no-organizer@example.com');
  console.info('  password: changeMeOwner5!');
  console.info('  organizer: none (permission edge-case)');
  console.info('Admin test login:');
  console.info('  email: admin@example.com');
  console.info('  password: changeMeAdmin1!');
  console.info('  email: admin.audit@example.com');
  console.info('  password: changeMeAdmin2!');
  console.info('Staff test logins:');
  console.info('  email: staff1@example.com / password: changeMeStaff1! (single-tenant visibility)');
  console.info('  email: staff2@example.com / password: changeMeStaff2! (multi-tenant visibility)');
  console.info('  email: staff3@example.com / password: changeMeStaff3! (unassigned edge-case)');
  console.info('User test logins:');
  console.info('  email: user1@example.com / password: changeMeUser1! (mixed booking statuses)');
  console.info('  email: user6@example.com / password: changeMeUser6! (no bookings edge-case)');
  console.info('  email: user7@example.com / password: changeMeUser7! (pending booking without payment)');
}

main()
  .catch((error) => {
    console.error('Seeding failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
