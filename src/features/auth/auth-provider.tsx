import { useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { AuthContext } from '@/features/auth/auth-context'
import { login as loginRequest, logout as logoutRequest } from '@/lib/api/auth'
import { clearSession, getSession, setSession, type AuthSession } from '@/lib/api/auth-storage'
import { setSessionExpiredHandler } from '@/lib/api/client'
import type { LoginRequest } from '@/types/auth'
import type { Role } from '@/types/roles'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(() => getSession())

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setSessionState(null)
      toast.info('Tu sesión expiró. Inicia sesión de nuevo.')
    })
    return () => setSessionExpiredHandler(null)
  }, [])

  async function login(payload: LoginRequest) {
    const response = await loginRequest(payload)
    setSession(response)
    setSessionState(response)
  }

  async function logout() {
    try {
      if (session?.refreshToken) await logoutRequest(session.refreshToken)
    } catch {
      // El token se descarta localmente aunque el servidor no responda.
    } finally {
      clearSession()
      setSessionState(null)
    }
  }

  function hasRole(...roles: Role[]) {
    return session?.roles.some((role) => roles.includes(role)) ?? false
  }

  return (
    <AuthContext.Provider
      value={{ session, isAuthenticated: session !== null, login, logout, hasRole }}
    >
      {children}
    </AuthContext.Provider>
  )
}
