import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/auth-context'
import type { Role } from '@/types/roles'

interface ProtectedRouteProps {
  allowedRoles?: Role[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, session } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !session?.roles.some((role) => allowedRoles.includes(role))) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
