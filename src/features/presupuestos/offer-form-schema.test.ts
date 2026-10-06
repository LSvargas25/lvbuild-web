import { describe, expect, it } from 'vitest'
import {
  offerDefaults,
  offerSchema,
  toCreateOfferRequest,
  type OfferFormValues,
} from '@/features/presupuestos/offer-form-schema'
import type { Budget } from '@/types/budgets'

const budget: Budget = {
  id: 9,
  customerId: 3,
  branchId: 1,
  name: 'Casa Solano',
  status: 'Sent',
  utilityPercentage: 15,
  indirectCostsTotal: 0,
  totalBudget: 12_500_000,
  createdByUserId: 1,
  chapters: [
    { id: 1, name: 'Obra gris', order: 1, estimatedWeeks: 6, totalChapter: 0, activities: [] },
    { id: 2, name: 'Acabados', order: 2, estimatedWeeks: 4, totalChapter: 0, activities: [] },
  ],
}

function validTurnkey(): OfferFormValues {
  return {
    ...offerDefaults(budget, '2026-10-05'),
    workLocation: 'Escazú',
    workScope: 'Casa de 2 plantas',
    paymentTerms: '30 % adelanto',
    warranties: '1 año',
    exclusions: 'Mobiliario',
  }
}

describe('offerDefaults', () => {
  it('starts from the budget: total price and the sum of chapter weeks', () => {
    const defaults = offerDefaults(budget, '2026-10-05')
    expect(defaults.totalProjectPrice).toBe(12_500_000)
    expect(defaults.estimatedDurationWeeks).toBe(10)
    expect(defaults.issueDate).toBe('2026-10-05')
    expect(defaults.estimatedStartDate).toBe('2026-10-12')
  })
})

describe('offerSchema', () => {
  it('accepts a complete turnkey offer', () => {
    expect(offerSchema.safeParse(validTurnkey()).success).toBe(true)
  })

  it('requires the percentage fields only for percentage offers', () => {
    const result = offerSchema.safeParse({ ...validTurnkey(), offerType: 'Percentage', agreedPercentage: 0 })
    expect(result.success).toBe(false)
    const paths = result.error!.issues.map((i) => i.path.join('.'))
    expect(paths).toEqual(
      expect.arrayContaining(['agreedPercentage', 'percentageIncludes', 'percentageExcludes', 'percentageCalculationMethod']),
    )
    expect(paths).not.toContain('totalProjectPrice')
  })

  it('rejects a start date before the issue date', () => {
    const result = offerSchema.safeParse({ ...validTurnkey(), estimatedStartDate: '2026-10-01' })
    expect(result.error?.issues[0].path).toEqual(['estimatedStartDate'])
  })
})

describe('toCreateOfferRequest', () => {
  it('sends only the fields of the chosen offer type, as the API requires', () => {
    const request = toCreateOfferRequest(9, validTurnkey())
    expect(request).toMatchObject({
      budgetId: 9,
      offerType: 'Turnkey',
      totalProjectPrice: 12_500_000,
      agreedPercentage: null,
      paymentFrequency: null,
      percentageIncludes: null,
      estimatedDeliveryDate: '2026-12-21',
    })
  })

  it('drops the price for percentage offers', () => {
    const request = toCreateOfferRequest(9, {
      ...validTurnkey(),
      offerType: 'Percentage',
      agreedPercentage: 12,
      percentageIncludes: 'Mano de obra',
      percentageExcludes: 'Permisos',
      percentageCalculationMethod: 'Sobre costo real',
    })
    expect(request).toMatchObject({
      totalProjectPrice: null,
      agreedPercentage: 12,
      paymentFrequency: 'Monthly',
      percentageIncludes: 'Mano de obra',
    })
  })
})
