import type { Role } from '@/types/roles'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: string
  userId: number
  name: string
  email: string
  roles: Role[]
}
