import { z } from 'zod'

import {
  ACCEPTED_USER_ROLE_VALUES,
  USER_PERMISSION_VALUES,
  normalizeUserRole,
} from '@/types/user'
import { registerRequestSchema } from '@/validation/auth-schema'

const trimToUndefined = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length ? value : undefined))

const nullableTrimToNull = z
  .string()
  .trim()
  .nullable()
  .optional()
  .transform((value) => {
    if (value === null) {
      return null
    }

    return value && value.length ? value : null
  })

const roleSchema = z.enum(ACCEPTED_USER_ROLE_VALUES).transform((value) => normalizeUserRole(value))
const permissionSchema = z.enum(USER_PERMISSION_VALUES)
const dateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format')

export const organizerCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  ownerId: z
    .union([z.string().trim().min(1), z.number().int().positive()])
    .optional()
    .transform((value) => (value === undefined ? undefined : String(value))),
})

export const organizerUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100),
})

export const organizerStatusSchema = z.object({
  status: z.enum(['active', 'suspended']).transform((value) =>
    value === 'active' ? 'ACTIVE' : 'SUSPENDED',
  ),
})

export const organizerStaffSchema = z.object({
  userId: z
    .union([z.string().trim().min(1), z.number().int().positive()])
    .transform((value) => String(value)),
})

export const eventCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: trimToUndefined,
  price: z.coerce.number().min(0),
  isPublished: z.boolean().optional().default(false),
})

export const eventUpdateSchema = eventCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: 'At least one field is required',
  },
)

export const bookingCreateSchema = z
  .object({
    eventId: trimToUndefined,
    propertyName: trimToUndefined,
    checkIn: dateSchema,
    checkOut: dateSchema,
    totalPrice: z.coerce.number().min(0).optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .refine((value) => Boolean(value.eventId || value.propertyName), {
    message: 'Either eventId or propertyName is required',
    path: ['eventId'],
  })
  .refine((value) => new Date(value.checkIn) < new Date(value.checkOut), {
    message: 'Check-out date must be after check-in date',
    path: ['checkOut'],
  })

export const bookingUpdateSchema = z
  .object({
    eventId: trimToUndefined,
    propertyName: trimToUndefined,
    checkIn: dateSchema.optional(),
    checkOut: dateSchema.optional(),
    totalPrice: z.coerce.number().min(0).optional(),
    notes: z.string().trim().max(500).optional(),
    status: z.enum(['CONFIRMED', 'PENDING', 'CANCELLED', 'COMPLETED']).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  })
  .refine((value) => {
    if (!value.checkIn || !value.checkOut) {
      return true
    }

    return new Date(value.checkIn) < new Date(value.checkOut)
  }, {
    message: 'Check-out date must be after check-in date',
    path: ['checkOut'],
  })

export const userCreateSchema = registerRequestSchema.extend({
  role: roleSchema.optional().default('USER'),
  permissions: z.array(permissionSchema).optional(),
  businessId: trimToUndefined,
})

export const userUpdateSchema = z
  .object({
    email: z.string().email().optional(),
    name: nullableTrimToNull,
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    businessId: nullableTrimToNull,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  })

export const userRoleUpdateSchema = z.object({
  role: roleSchema,
  permissions: z.array(permissionSchema).optional(),
})

export const checkoutSessionSchema = z.object({
  bookingId: z.coerce.number().int().positive(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
})
