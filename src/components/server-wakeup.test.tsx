import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse, type JsonBodyType } from 'msw'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { ServerWakeup } from '@/components/server-wakeup'
import { AuthProvider } from '@/features/auth/auth-provider'
import { DashboardPage } from '@/features/dashboard/dashboard-page'
import { createQueryClient } from '@/lib/query-client'
import { signIn } from '@/test/render'
import { API, server } from '@/test/server'

const HEALTH = 'http://api.test/health/ready'
const page = <T,>(items: T[]) => ({ items, totalCount: items.length, pageNumber: 1, pageSize: 100 })

const project = {
  id: 1,
  name: 'Residencia Familia Mora',
  offerId: 1,
  budgetId: 6,
  customerId: 1,
  branchId: 1,
  projectType: 'TurnKey',
  startDate: '2026-08-31T00:00:00',
  endDate: '2026-12-21T00:00:00',
  weeksCounter: 3,
  totalWorkedHours: 960,
  workersUsedCount: 5,
  materialsUsedCount: 4,
  currentDirectExpenses: 0,
  pendingExpenses: 0,
  currentProfit: 0,
  status: 'Active',
  createdByUserId: 2,
  workers: [],
}

/** La API "duerme" (red caída en datos, 503 en el health check) hasta que se despierta. */
let apiUp = false
let healthPings = 0

function apiHandlers({ wakeAfterPings }: { wakeAfterPings: number }) {
  const whenUp = (body: () => JsonBodyType) => () => (apiUp ? HttpResponse.json(body()) : HttpResponse.error())
  return [
    http.get(HEALTH, () => {
      healthPings++
      if (healthPings >= wakeAfterPings) apiUp = true
      return apiUp ? HttpResponse.json({ status: 'Healthy' }) : new HttpResponse(null, { status: 503 })
    }),
    http.get(`${API}/projects`, whenUp(() => page([project]))),
    http.get(`${API}/customers`, whenUp(() => page([{ id: 1, name: 'Familia Mora Rodríguez' }]))),
    http.get(`${API}/budgets`, whenUp(() => page([]))),
    http.get(`${API}/branches/options`, whenUp(() => [])),
  ]
}

function renderDashboard() {
  // Backoff de milisegundos: los reintentos se agotan antes de que la API despierte.
  const queryClient = createQueryClient({ retryDelay: () => 5 })
  const router = createMemoryRouter([{ path: '/', element: <DashboardPage /> }])
  return render(
    <QueryClientProvider client={queryClient}>
      <ServerWakeup delaysMs={[30, 30, 30, 30, 30]} showNoticeAfterMs={0} />
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  apiUp = false
  healthPings = 0
  signIn(['GeneralManager'])
})

describe('ServerWakeup', () => {
  it('shows the wake-up notice while the API sleeps, then loads the dashboard once it answers', async () => {
    server.use(...apiHandlers({ wakeAfterPings: 4 }))
    renderDashboard()

    expect(await screen.findByText(/Despertando el servidor, puede tardar hasta un minuto/)).toBeInTheDocument()

    // Las consultas fallidas se vuelven a pedir solas cuando el health check responde.
    expect(await screen.findByRole('link', { name: 'Residencia Familia Mora' })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText(/Despertando el servidor/)).not.toBeInTheDocument())
    expect(screen.queryByText('Cargando…')).not.toBeInTheDocument()
  })

  it('offers a retry when the API never wakes up, and recovers when it does', async () => {
    const user = userEvent.setup()
    server.use(...apiHandlers({ wakeAfterPings: Number.POSITIVE_INFINITY }))
    renderDashboard()

    // En vez de "Cargando…" para siempre: errores con botón Reintentar y aviso de conexión.
    const banner = await screen.findByText('No se pudo conectar con el servidor.')
    expect(screen.getAllByRole('button', { name: /Reintentar/ }).length).toBeGreaterThan(1)

    apiUp = true
    await user.click(screen.getAllByRole('button', { name: /Reintentar/ })[0])

    expect(await screen.findByRole('link', { name: 'Residencia Familia Mora' })).toBeInTheDocument()
    await waitFor(() => expect(banner).not.toBeInTheDocument())
  })
})
