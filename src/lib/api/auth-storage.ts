import type { LoginResponse } from '@/types/auth'

export type AuthSession = LoginResponse

const STORAGE_KEY = 'lv_auth_session'

export function getSession(): AuthSession | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function setSession(session: AuthSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY)
}
