import { apiClient } from '@/lib/api/client'
import type { LoginRequest, LoginResponse } from '@/types/auth'

export function login(payload: LoginRequest) {
  return apiClient.post<LoginResponse>('/auth/login', payload).then((res) => res.data)
}

export function logout(refreshToken: string) {
  return apiClient.post('/auth/logout', { refreshToken })
}
