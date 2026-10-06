import { createContext, useContext } from 'react'
import type { AuthSession } from '@/lib/api/auth-storage'
import type { LoginRequest } from '@/types/auth'
import type { Role } from '@/types/roles'

export interface AuthContextValue {
  session: AuthSession | null
  isAuthenticated: boolean
  login: (payload: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  hasRole: (...roles: Role[]) => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
