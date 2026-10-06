import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { BudgetCreatePage } from '@/features/presupuestos/budget-create-page'
import { renderRoute, signIn } from '@/test/render'
import { API, server } from '@/test/server'

const page = <T,>(items: T[]) => ({ items, totalCount: items.length, pageNumber: 1, pageSize: 100 })

beforeEach(() => {
  signIn(['ProjectAdmin'])
  server.use(
    http.get(`${API}/customers`, () =>
      HttpResponse.json(page([{ id: 3, name: 'Inversiones Solano', city: null, phoneNumber: null, email: null }])),
    ),
    http.get(`${API}/branches/options`, () =>
      HttpResponse.json([{ id: 1, name: 'Sucursal Central', branchType: 'Office' }]),
    ),
  )
})

function renderPage() {
  return renderRoute(<BudgetCreatePage />, {
    route: '/presupuestos/nuevo',
    path: '/presupuestos/nuevo',
    extraRoutes: [{ path: '/presupuestos/:id', element: <p>Detalle del presupuesto</p> }],
  })
}

async function choose(user: ReturnType<typeof userEvent.setup>, label: string, option: string) {
  // El select queda deshabilitado mientras carga su catálogo.
  await waitFor(() => expect(screen.getByLabelText(label)).toBeEnabled())
  await user.click(screen.getByLabelText(label))
  await user.click(await screen.findByRole('option', { name: option }))
}

describe('BudgetCreatePage', () => {
  it('shows a message on every invalid field and does not submit', async () => {
    const user = userEvent.setup({ delay: null })
    let submitted = false
    server.use(
      http.post(`${API}/budgets`, () => {
        submitted = true
        return HttpResponse.json({})
      }),
    )
    renderPage()

    const activity = screen.getByLabelText('Materiales (₡)')
    await user.clear(activity)
    await user.type(activity, '-5')
    await user.click(screen.getByRole('button', { name: 'Crear presupuesto (borrador)' }))

    expect(await screen.findByText('Escribe un nombre para el presupuesto')).toBeInTheDocument()
    expect(screen.getByLabelText('Cliente')).toHaveAccessibleDescription('Elige un cliente')
    expect(screen.getByLabelText('Sucursal')).toHaveAccessibleDescription('Elige una sucursal')
    expect(screen.getByText('Escribe el nombre del capítulo')).toBeInTheDocument()
    expect(screen.getByText('Describe la actividad')).toBeInTheDocument()
    expect(screen.getByText('No puede ser negativo')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre del presupuesto')).toHaveAttribute('aria-invalid', 'true')
    expect(submitted).toBe(false)
  })

  it('sends chapters in order with their activities and opens the new budget', async () => {
    const user = userEvent.setup({ delay: null })
    let body: Record<string, unknown> | undefined
    server.use(
      http.post(`${API}/budgets`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ id: 42 }, { status: 201 })
      }),
    )
    renderPage()

    await user.type(screen.getByLabelText('Nombre del presupuesto'), '  Casa Solano  ')
    await choose(user, 'Cliente', 'Inversiones Solano')
    await choose(user, 'Sucursal', 'Sucursal Central')
    await user.clear(screen.getByLabelText('Costos indirectos (₡)'))
    await user.type(screen.getByLabelText('Costos indirectos (₡)'), '50000')

    const chapter1 = screen.getByRole('group', { name: 'Capítulo 1' })
    await user.type(within(chapter1).getByLabelText('Nombre del capítulo'), 'Obra gris')
    await user.type(within(chapter1).getByLabelText('Actividad'), 'Cimientos')
    await user.clear(within(chapter1).getByLabelText('Materiales (₡)'))
    await user.type(within(chapter1).getByLabelText('Materiales (₡)'), '1000')
    await user.clear(within(chapter1).getByLabelText('Mano de obra (₡)'))
    await user.type(within(chapter1).getByLabelText('Mano de obra (₡)'), '500')

    await user.click(screen.getByRole('button', { name: 'Agregar capítulo' }))
    const chapter2 = screen.getByRole('group', { name: 'Capítulo 2' })
    await user.type(within(chapter2).getByLabelText('Nombre del capítulo'), 'Acabados')
    await user.clear(within(chapter2).getByLabelText('Semanas estimadas'))
    await user.type(within(chapter2).getByLabelText('Semanas estimadas'), '3')
    await user.type(within(chapter2).getByLabelText('Actividad'), 'Pintura')

    // Costo de la actividad y costo directo total del presupuesto.
    expect(screen.getAllByText('₡1500', { normalizer: (t) => t.replace(/\s/g, '') })).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Crear presupuesto (borrador)' }))

    expect(await screen.findByText('Detalle del presupuesto')).toBeInTheDocument()
    expect(body).toEqual({
      name: 'Casa Solano',
      customerId: 3,
      branchId: 1,
      utilityPercentage: 15,
      indirectCostsTotal: 50000,
      chapters: [
        {
          name: 'Obra gris',
          order: 1,
          estimatedWeeks: 1,
          activities: [
            { description: 'Cimientos', materialQuantity: 0, materialCost: 1000, laborCost: 500, equipmentCost: 0 },
          ],
        },
        {
          name: 'Acabados',
          order: 2,
          estimatedWeeks: 3,
          activities: [
            { description: 'Pintura', materialQuantity: 0, materialCost: 0, laborCost: 0, equipmentCost: 0 },
          ],
        },
      ],
    })
  })

  it('shows the validation message returned by the API', async () => {
    const user = userEvent.setup({ delay: null })
    server.use(
      http.post(`${API}/budgets`, () =>
        HttpResponse.json({ statusCode: 400, message: 'El cliente no existe.' }, { status: 400 }),
      ),
    )
    renderPage()

    await user.type(screen.getByLabelText('Nombre del presupuesto'), 'Casa')
    await choose(user, 'Cliente', 'Inversiones Solano')
    await choose(user, 'Sucursal', 'Sucursal Central')
    await user.type(screen.getByLabelText('Nombre del capítulo'), 'Obra gris')
    await user.type(screen.getByLabelText('Actividad'), 'Cimientos')
    await user.click(screen.getByRole('button', { name: 'Crear presupuesto (borrador)' }))

    expect(await screen.findByText('El cliente no existe.')).toBeInTheDocument()
  })
})
