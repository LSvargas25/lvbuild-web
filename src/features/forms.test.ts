import { describe, expect, it } from 'vitest'
import {
  siteLogDefaults,
  siteLogSchema,
  toCreateSiteLogRequest,
} from '@/features/bitacoras/sitelog-form-schema'
import { invoiceTotals, toCreateInvoiceRequest } from '@/features/comercial/invoice-form'
import type { Product } from '@/types/commercial'

describe('site log form', () => {
  it('defaults to the Monday of the current week', () => {
    expect(siteLogDefaults('2026-10-08').weekStart).toBe('2026-10-05')
  })

  it('normalizes any day to a Monday-Sunday week', () => {
    const request = toCreateSiteLogRequest(4, {
      weekStart: '2026-10-09',
      chapterId: '',
      taskDescription: '  Repello  ',
      pendingTasks: ' ',
      workers: [{ workerId: '2', hoursWorked: 40 }],
    })
    expect(request).toEqual({
      projectId: 4,
      chapterId: null,
      weekStart: '2026-10-05',
      weekEnd: '2026-10-11',
      taskDescription: 'Repello',
      pendingTasks: null,
      workers: [{ workerId: 2, hoursWorked: 40 }],
    })
  })

  it('rejects the same worker twice and impossible hours', () => {
    const result = siteLogSchema.safeParse({
      ...siteLogDefaults('2026-10-05'),
      taskDescription: 'Repello',
      workers: [
        { workerId: '2', hoursWorked: 40 },
        { workerId: '2', hoursWorked: 200 },
      ],
    })
    const issues = result.error!.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
    expect(issues).toContain('workers.1.hoursWorked: Una semana tiene 168 horas')
    expect(issues).toContain('workers.1.workerId: Este trabajador ya está en la lista')
  })
})

describe('invoice form', () => {
  const products = [
    { id: 1, unitPrice: 1000 },
    { id: 2, unitPrice: 250.5 },
  ] as Product[]

  it('estimates subtotal, 13 % VAT and total', () => {
    expect(
      invoiceTotals(
        [
          { productId: '1', quantity: 2 },
          { productId: '2', quantity: 4 },
          { productId: '', quantity: 3 },
        ],
        products,
      ),
    ).toEqual({ subtotal: 3002, tax: 390.26, total: 3392.26 })
  })

  it('sends null customer for walk-in sales', () => {
    const request = toCreateInvoiceRequest(
      { customerId: '', paymentType: 'Contado', lines: [{ productId: '1', quantity: 2 }] },
      1,
      5,
    )
    expect(request).toEqual({
      branchId: 1,
      cashRegisterId: 5,
      customerId: null,
      paymentType: 'Contado',
      details: [{ productId: 1, quantity: 2 }],
    })
  })
})
