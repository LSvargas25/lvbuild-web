import { apiClient } from '@/lib/api/client'
import type {
  LoginRequest,
  LoginResponse,
  UpdateProfileRequest,
  UserProfile,
} from '@/types/auth'

export function login(payload: LoginRequest) {
  return apiClient.post<LoginResponse>('/auth/login', payload).then((res) => res.data)
}

export function logout() {
  return apiClient.post('/auth/logout')
}

export function getMe() {
  return apiClient.get<UserProfile>('/auth/me').then((res) => res.data)
}

export function updateMe(payload: UpdateProfileRequest) {
  return apiClient.put<UserProfile>('/auth/me', payload).then((res) => res.data)
}
