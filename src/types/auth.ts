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

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface UserProfile {
  id: number
  name: string
  email: string
  status: string
  profilePhotoPath: string | null
  roles: Role[]
  createdAt: string
  lastLoginAt: string | null
}

export interface UpdateProfileRequest {
  name: string
}
