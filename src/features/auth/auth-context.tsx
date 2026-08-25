import { createContext, useContext, useState, type ReactNode } from 'react'
import { login as loginRequest, logout as logoutRequest } from '@/lib/api/auth'
import { clearSession, getSession, setSession, type AuthSession } from '@/lib/api/auth-storage'
import type { LoginRequest } from '@/types/auth'

interface AuthContextValue {
  session: AuthSession | null
  isAuthenticated: boolean
  login: (payload: LoginRequest) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(() => getSession())

  async function login(payload: LoginRequest) {
    const response = await loginRequest(payload)
    setSession(response)
    setSessionState(response)
  }

  async function logout() {
    try {
      await logoutRequest()
    } finally {
      clearSession()
      setSessionState(null)
    }
  }

  return (
    <AuthContext.Provider value={{ session, isAuthenticated: session !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
