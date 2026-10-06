import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { RouterProvider, createMemoryRouter, type RouteObject } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/features/auth/auth-provider'
import { setSession } from '@/lib/api/auth-storage'
import type { LoginResponse } from '@/types/auth'
import type { Role } from '@/types/roles'

export function makeSession(roles: Role[] = ['ProjectAdmin'], overrides: Partial<LoginResponse> = {}): LoginResponse {
  return {
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
    accessTokenExpiresAt: '2030-01-01T00:00:00Z',
    userId: 1,
    name: 'María Fernanda Solano',
    email: 'proyectos@lvbuild.test',
    roles,
    ...overrides,
  }
}

/** Guarda una sesión como si el usuario ya hubiera iniciado sesión. */
export function signIn(roles?: Role[]) {
  const session = makeSession(roles)
  setSession(session)
  return session
}

interface RenderRouteOptions {
  /** Ruta inicial, p. ej. `/presupuestos/nuevo`. */
  route: string
  /** Patrón de la ruta bajo prueba, p. ej. `/presupuestos/nuevo`. */
  path: string
  /** Pantallas extra (destinos de navegación) para verificar redirecciones. */
  extraRoutes?: RouteObject[]
}

/** Renderiza una pantalla con React Query, AuthProvider y un router en memoria. */
export function renderRoute(element: ReactNode, { route, path, extraRoutes = [] }: RenderRouteOptions) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createMemoryRouter([{ path, element }, ...extraRoutes], { initialEntries: [route] })

  const result = render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>,
  )
  return { ...result, router, queryClient }
}
