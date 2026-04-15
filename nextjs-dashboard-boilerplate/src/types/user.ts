export const USER_ROLE_VALUES = [
  'ADMIN',
  'OWNER',
  'STAFF',
  'USER',
] as const

export const LEGACY_USER_ROLE_VALUES = [
  'SUPER_ADMIN',
  'STUFFS',
  'GUESTS',
] as const

export const ACCEPTED_USER_ROLE_VALUES = [
  ...USER_ROLE_VALUES,
  ...LEGACY_USER_ROLE_VALUES,
] as const

export type UserRole = (typeof USER_ROLE_VALUES)[number]

export type CanonicalUserRole =
  | 'ADMIN'
  | 'OWNER'
  | 'STAFF'
  | 'USER'

export type LegacyUserRole = (typeof LEGACY_USER_ROLE_VALUES)[number]

export type UserStatus = 'ACTIVE' | 'INACTIVE'

export const USER_PERMISSION_VALUES = [
  'ORGANIZER_CREATE',
  'ORGANIZER_READ_OWN',
  'ORGANIZER_UPDATE_OWN',
  'ORGANIZER_MANAGE_STAFF',
  'EVENT_READ_OWN',
  'EVENT_CREATE_OWN',
  'EVENT_UPDATE_OWN',
  'EVENT_DELETE_OWN',
  'BOOKING_READ_OWN',
  'BOOKING_READ_ALL',
  'BOOKING_CREATE',
  'BOOKING_UPDATE_OWN',
  'BOOKING_DELETE_OWN',
  'USER_READ',
  'USER_CREATE',
  'USER_UPDATE',
  'USER_ROLE_UPDATE',
  'USER_DELETE',
  'PAYMENT_READ',
  'PAYMENT_CREATE',
  'UPLOAD_IMAGE',
  'RBAC_READ',
] as const

export type UserPermission = (typeof USER_PERMISSION_VALUES)[number]

export type AppUser = {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  permissions: UserPermission[]
  businessId: string | null
  passwordHash: string
  createdAt: Date
  updatedAt: Date
}

export type SafeUser = Omit<AppUser, 'passwordHash'>

const ROLE_PERMISSIONS: Record<CanonicalUserRole, UserPermission[]> = {
  ADMIN: [...USER_PERMISSION_VALUES],
  OWNER: [
    'ORGANIZER_CREATE',
    'ORGANIZER_READ_OWN',
    'ORGANIZER_UPDATE_OWN',
    'ORGANIZER_MANAGE_STAFF',
    'EVENT_READ_OWN',
    'EVENT_CREATE_OWN',
    'EVENT_UPDATE_OWN',
    'EVENT_DELETE_OWN',
    'BOOKING_READ_OWN',
    'BOOKING_CREATE',
    'BOOKING_UPDATE_OWN',
    'BOOKING_DELETE_OWN',
    'PAYMENT_READ',
    'PAYMENT_CREATE',
    'UPLOAD_IMAGE',
  ],
  STAFF: [
    'ORGANIZER_READ_OWN',
    'EVENT_READ_OWN',
    'EVENT_CREATE_OWN',
    'EVENT_UPDATE_OWN',
    'BOOKING_READ_OWN',
    'BOOKING_CREATE',
    'BOOKING_UPDATE_OWN',
    'PAYMENT_READ',
    'PAYMENT_CREATE',
    'UPLOAD_IMAGE',
  ],
  USER: [
    'BOOKING_READ_OWN',
    'BOOKING_CREATE',
    'PAYMENT_READ',
    'PAYMENT_CREATE',
  ],
}

export function normalizeUserRole(role?: string | null): CanonicalUserRole {
  if (!role) {
    return 'USER'
  }

  const normalized = role.toUpperCase().replace(/\s+/g, '_')

  if (normalized === 'STUFFS' || normalized === 'STAFF') {
    return 'STAFF'
  }

  if (normalized === 'GUESTS' || normalized === 'GUEST') {
    return 'USER'
  }

  if (normalized === 'SUPER_ADMIN' || normalized === 'ADMIN') {
    return 'ADMIN'
  }

  if (normalized === 'OWNER') {
    return normalized
  }

  return 'USER'
}

export function isAdminRole(role?: string | null) {
  const normalized = normalizeUserRole(role)
  return normalized === 'ADMIN'
}

export function isOwnerRole(role?: string | null) {
  return normalizeUserRole(role) === 'OWNER'
}

export function isStaffRole(role?: string | null) {
  return normalizeUserRole(role) === 'STAFF'
}

export function defaultPermissionsForRole(role?: string | null): UserPermission[] {
  return [...ROLE_PERMISSIONS[normalizeUserRole(role)]]
}
