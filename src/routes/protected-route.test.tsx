import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { useAuth } from '@/features/auth/auth-context'
import { AuthProvider } from '@/features/auth/auth-provider'
import { getSession } from '@/lib/api/auth-storage'
import { apiClient } from '@/lib/api/client'
import { ProtectedRoute } from '@/routes/protected-route'
import { signIn } from '@/test/render'
import { API, server } from '@/test/server'
import type { Role } from '@/types/roles'

function LogoutButton() {
  const { logout } = useAuth()
  return <button onClick={() => logout()}>Salir</button>
}

function ExpireButton() {
  return <button onClick={() => apiClient.get('/projects').catch(() => {})}>Cargar</button>
}

function renderApp(initial: string, allowedRoles?: Role[]) {
  const router = createMemoryRouter(
    [
      { path: '/login', element: <p>Pantalla de login</p> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/', element: <p>Inicio</p> },
          {
            path: '/privada',
            element: (
              <>
                <p>Privada</p>
                <LogoutButton />
                <ExpireButton />
              </>
            ),
          },
          {
            element: <ProtectedRoute allowedRoles={allowedRoles} />,
            children: [{ path: '/caja', element: <p>Caja</p> }],
          },
        ],
      },
    ],
    { initialEntries: [initial] },
  )
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  )
  return router
}

describe('ProtectedRoute', () => {
  it('sends anonymous users to /login and remembers where they were going', () => {
    const router = renderApp('/privada')
    expect(screen.getByText('Pantalla de login')).toBeInTheDocument()
    expect(router.state.location.state).toEqual({ from: '/privada' })
  })

  it('redirects to home when the role is not allowed', () => {
    signIn(['ProjectAdmin'])
    renderApp('/caja', ['GeneralManager', 'BranchAdmin'])
    expect(screen.getByText('Inicio')).toBeInTheDocument()
  })

  it('renders the page when one of the roles is allowed', () => {
    signIn(['BranchAdmin'])
    renderApp('/caja', ['GeneralManager', 'BranchAdmin'])
    expect(screen.getByText('Caja')).toBeInTheDocument()
  })

  it('logs out: revokes the refresh token and returns to login', async () => {
    const user = userEvent.setup()
    signIn()
    let body: unknown
    server.use(
      http.post(`${API}/auth/logout`, async ({ request }) => {
        body = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderApp('/privada')

    await user.click(screen.getByRole('button', { name: 'Salir' }))

    expect(await screen.findByText('Pantalla de login')).toBeInTheDocument()
    expect(body).toEqual({ refreshToken: 'refresh-1' })
    expect(getSession()).toBeNull()
  })

  it('logs out locally even if the server fails', async () => {
    const user = userEvent.setup()
    signIn()
    server.use(http.post(`${API}/auth/logout`, () => new HttpResponse(null, { status: 500 })))
    renderApp('/privada')

    await user.click(screen.getByRole('button', { name: 'Salir' }))

    expect(await screen.findByText('Pantalla de login')).toBeInTheDocument()
    expect(getSession()).toBeNull()
  })

  it('navigates to login with the router (no reload) when the session expires', async () => {
    const user = userEvent.setup()
    signIn()
    server.use(
      http.get(`${API}/projects`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${API}/auth/refresh-token`, () => new HttpResponse(null, { status: 401 })),
    )
    const router = renderApp('/privada')

    await user.click(screen.getByRole('button', { name: 'Cargar' }))

    await waitFor(() => expect(screen.getByText('Pantalla de login')).toBeInTheDocument())
    expect(router.state.location.state).toEqual({ from: '/privada' })
  })
})
