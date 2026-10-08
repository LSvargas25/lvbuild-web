import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { DEMO_ACCOUNTS } from '@/features/auth/demo-accounts'
import { LoginPage } from '@/features/auth/login-page'
import { getSession } from '@/lib/api/auth-storage'
import { makeSession, renderRoute } from '@/test/render'
import { API, server } from '@/test/server'
import { ROLE_LABELS } from '@/types/roles'

function renderLogin(state?: { from: string }) {
  const result = renderRoute(<LoginPage />, {
    route: '/login',
    path: '/login',
    extraRoutes: [
      { path: '/', element: <p>Inicio</p> },
      { path: '/proyectos/7', element: <p>Proyecto 7</p> },
    ],
  })
  if (state) result.router.navigate('/login', { state, replace: true })
  return result
}

describe('LoginPage', () => {
  it('validates the fields before calling the API', async () => {
    const user = userEvent.setup({ delay: null })
    let called = false
    server.use(
      http.post(`${API}/auth/login`, () => {
        called = true
        return HttpResponse.json(makeSession())
      }),
    )
    renderLogin()

    await user.type(screen.getByLabelText('Correo'), 'no-es-correo')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByText('Ingresa un correo válido')).toBeInTheDocument()
    expect(screen.getByText('Ingresa tu contraseña')).toBeInTheDocument()
    expect(screen.getByLabelText('Correo')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Correo')).toHaveAccessibleDescription('Ingresa un correo válido')
    expect(called).toBe(false)
  })

  // La API real responde 403 con un mensaje en inglés.
  it('shows wrong credentials inline (in Spanish) and stays on the page', async () => {
    const user = userEvent.setup({ delay: null })
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json({ statusCode: 403, message: 'Invalid email or password.' }, { status: 403 }),
      ),
    )
    const { router } = renderLogin()

    await user.type(screen.getByLabelText('Correo'), 'gerencia@lvbuild.test')
    await user.type(screen.getByLabelText('Contraseña'), 'incorrecta')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.')
    expect(router.state.location.pathname).toBe('/login')
    expect(getSession()).toBeNull()
  })

  it.each([
    [403, 'This account is blocked. Contact an administrator.', 'Esta cuenta está bloqueada. Contacta a un administrador.'],
    [429, '', 'Demasiados intentos. Espera un minuto y vuelve a intentarlo.'],
  ])('explains a %i response', async (status, message, expected) => {
    const user = userEvent.setup({ delay: null })
    server.use(http.post(`${API}/auth/login`, () => HttpResponse.json({ statusCode: status, message }, { status })))
    renderLogin()

    await user.type(screen.getByLabelText('Correo'), 'gerencia@lvbuild.test')
    await user.type(screen.getByLabelText('Contraseña'), 'LvBuild#2026')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(expected)
  })

  it('stores the session and goes to the home page', async () => {
    const user = userEvent.setup({ delay: null })
    let body: unknown
    server.use(
      http.post(`${API}/auth/login`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(makeSession(['GeneralManager']))
      }),
    )
    renderLogin()

    await user.type(screen.getByLabelText('Correo'), 'gerencia@lvbuild.test')
    await user.type(screen.getByLabelText('Contraseña'), 'LvBuild#2026')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByText('Inicio')).toBeInTheDocument()
    expect(body).toEqual({ email: 'gerencia@lvbuild.test', password: 'LvBuild#2026' })
    expect(getSession()?.roles).toEqual(['GeneralManager'])
  })

  it('returns to the page that required the login', async () => {
    const user = userEvent.setup({ delay: null })
    server.use(http.post(`${API}/auth/login`, () => HttpResponse.json(makeSession())))
    renderLogin({ from: '/proyectos/7' })

    await user.type(screen.getByLabelText('Correo'), 'proyectos@lvbuild.test')
    await user.type(screen.getByLabelText('Contraseña'), 'LvBuild#2026')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => expect(screen.getByText('Proyecto 7')).toBeInTheDocument())
  })

  describe('demo accounts', () => {
    it('offers one button per role, each with a line about what it can do, above the regular form', () => {
      renderLogin()

      const demo = screen.getByRole('region', { name: 'Probar demo' })
      const buttons = within(demo).getAllByRole('button')
      expect(buttons).toHaveLength(DEMO_ACCOUNTS.length)
      expect(within(demo).getByRole('button', { name: 'Entrar como Gerencia' })).toHaveAccessibleDescription(
        'Aprueba presupuestos, acepta ofertas y paga planillas.',
      )
      // El formulario normal sigue disponible, debajo de la sección demo.
      const email = screen.getByLabelText('Correo')
      expect(demo.compareDocumentPosition(email) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it.each(DEMO_ACCOUNTS.map((a) => [a.role, a.email]))('logs in as %s in one click', async (role, email) => {
      const user = userEvent.setup({ delay: null })
      let body: unknown
      server.use(
        http.post(`${API}/auth/login`, async ({ request }) => {
          body = await request.json()
          return HttpResponse.json(makeSession([role]))
        }),
      )
      renderLogin()

      const demo = screen.getByRole('region', { name: 'Probar demo' })
      await user.click(within(demo).getByRole('button', { name: `Entrar como ${ROLE_LABELS[role]}` }))

      expect(await screen.findByText('Inicio')).toBeInTheDocument()
      expect(body).toEqual({ email, password: 'LvBuild#2026' })
      expect(getSession()?.roles).toEqual([role])
    })

    it('shows the error inline if the demo login fails', async () => {
      const user = userEvent.setup({ delay: null })
      server.use(
        http.post(`${API}/auth/login`, () =>
          HttpResponse.json({ statusCode: 403, message: 'Invalid email or password.' }, { status: 403 }),
        ),
      )
      renderLogin()

      await user.click(screen.getByRole('button', { name: 'Entrar como Gerencia Comercial' }))

      expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.')
      expect(getSession()).toBeNull()
    })
  })
})
