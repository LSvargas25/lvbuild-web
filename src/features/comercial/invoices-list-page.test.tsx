import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { InvoicesListPage } from '@/features/comercial/invoices-list-page'
import { renderRoute, signIn } from '@/test/render'
import { API, server } from '@/test/server'

const page = <T,>(items: T[]) => ({ items, totalCount: items.length, pageNumber: 1, pageSize: 20 })
const requestedBranches: string[] = []

beforeEach(() => {
  requestedBranches.length = 0
  signIn(['GeneralManager'])
  server.use(
    // Orden alfabético de la API: la bodega (que nunca factura) queda primero.
    http.get(`${API}/branches/options`, () =>
      HttpResponse.json([
        { id: 3, name: 'Bodega Central Cartago', branchType: 'Warehouse' },
        { id: 2, name: 'Ferretería LV Heredia', branchType: 'Commercial' },
        { id: 1, name: 'Oficina Central San José', branchType: 'Office' },
      ]),
    ),
    http.get(`${API}/customers`, () => HttpResponse.json(page([]))),
    http.get(`${API}/branches/:branchId/invoices`, ({ params }) => {
      requestedBranches.push(String(params.branchId))
      return HttpResponse.json(page([]))
    }),
  )
})

describe('InvoicesListPage', () => {
  it('defaults to the first commercial branch, the only kind that invoices', async () => {
    renderRoute(<InvoicesListPage />, { route: '/comercial/facturas', path: '/comercial/facturas' })

    await waitFor(() => expect(screen.getByLabelText('Sucursal')).toHaveTextContent('Ferretería LV Heredia'))
    await waitFor(() => expect(requestedBranches).toEqual(['2']))
  })
})
