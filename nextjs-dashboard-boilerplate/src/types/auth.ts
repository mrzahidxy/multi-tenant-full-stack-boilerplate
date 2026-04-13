export type AuthenticatedUser = {
  id: string
  email: string
  name: string
  role: string
  status: string
  permissions: string[]
  businessId: string | null
  organizerId: string | null
  createdAt: string
  updatedAt: string
}

export type AuthSessionPayload = {
  accessToken: string
  accessTokenExpiresAt: string
  refreshTokenExpiresAt: string
  user: AuthenticatedUser
}
