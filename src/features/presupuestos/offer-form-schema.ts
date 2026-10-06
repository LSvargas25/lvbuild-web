import { z } from 'zod'
import { addDays, todayLocalISO } from '@/lib/dates'
import { isoDate, money, positiveInt, requiredText } from '@/lib/validation'
import type { Budget } from '@/types/budgets'
import type { CreateOfferRequest, OfferType, PaymentFrequency } from '@/types/offers'

const optionalText = z.string()

export const offerSchema = z
  .object({
    offerType: z.enum(['Turnkey', 'Percentage']),
    issueDate: isoDate(),
    validityDays: positiveInt(),
    workLocation: requiredText('Indica la ubicación de la obra'),
    workScope: requiredText('Describe el alcance del trabajo'),
    estimatedStartDate: isoDate(),
    estimatedDurationWeeks: positiveInt(),
    paymentTerms: requiredText('Indica las condiciones de pago'),
    warranties: requiredText('Indica las garantías'),
    exclusions: requiredText('Indica las exclusiones'),
    // Llave en mano
    totalProjectPrice: z.number({ error: 'Ingresa un número' }),
    // Por porcentaje
    agreedPercentage: z.number({ error: 'Ingresa un número' }),
    paymentFrequency: z.enum(['Weekly', 'Biweekly', 'Monthly', 'ProgressBased']),
    percentageIncludes: optionalText,
    percentageExcludes: optionalText,
    percentageCalculationMethod: optionalText,
  })
  .superRefine((values, ctx) => {
    if (values.estimatedStartDate < values.issueDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['estimatedStartDate'],
        message: 'El inicio no puede ser antes de la fecha de emisión',
      })
    }
    if (values.offerType === 'Turnkey') {
      const result = money().positive('Debe ser mayor que 0').safeParse(values.totalProjectPrice)
      if (!result.success) {
        ctx.addIssue({ code: 'custom', path: ['totalProjectPrice'], message: result.error.issues[0].message })
      }
      return
    }
    const pct = money().gt(0, 'Debe ser mayor que 0').max(100, 'Debe ser como máximo 100')
    const result = pct.safeParse(values.agreedPercentage)
    if (!result.success) {
      ctx.addIssue({ code: 'custom', path: ['agreedPercentage'], message: result.error.issues[0].message })
    }
    for (const [key, message] of [
      ['percentageIncludes', 'Indica qué incluye el porcentaje'],
      ['percentageExcludes', 'Indica qué excluye el porcentaje'],
      ['percentageCalculationMethod', 'Indica cómo se calcula el porcentaje'],
    ] as const) {
      if (!values[key].trim()) ctx.addIssue({ code: 'custom', path: [key], message })
    }
  })

export type OfferFormValues = z.infer<typeof offerSchema>

/** Valores iniciales a partir del presupuesto: precio = total, duración = suma de semanas. */
export function offerDefaults(budget: Budget, today = todayLocalISO()): OfferFormValues {
  const weeks = budget.chapters.reduce((sum, chapter) => sum + chapter.estimatedWeeks, 0)
  return {
    offerType: 'Turnkey' as OfferType,
    issueDate: today,
    validityDays: 30,
    workLocation: '',
    workScope: '',
    estimatedStartDate: addDays(today, 7),
    estimatedDurationWeeks: Math.max(1, weeks),
    paymentTerms: '',
    warranties: '',
    exclusions: '',
    totalProjectPrice: budget.totalBudget,
    agreedPercentage: 10,
    paymentFrequency: 'Monthly' as PaymentFrequency,
    percentageIncludes: '',
    percentageExcludes: '',
    percentageCalculationMethod: '',
  }
}

export function toCreateOfferRequest(budgetId: number, v: OfferFormValues): CreateOfferRequest {
  const isPercentage = v.offerType === 'Percentage'
  return {
    budgetId,
    offerType: v.offerType,
    issueDate: v.issueDate,
    validityDays: v.validityDays,
    workLocation: v.workLocation.trim(),
    workScope: v.workScope.trim(),
    estimatedStartDate: v.estimatedStartDate,
    estimatedDurationWeeks: v.estimatedDurationWeeks,
    estimatedDeliveryDate: addDays(v.estimatedStartDate, v.estimatedDurationWeeks * 7),
    paymentTerms: v.paymentTerms.trim(),
    warranties: v.warranties.trim(),
    exclusions: v.exclusions.trim(),
    totalProjectPrice: isPercentage ? null : v.totalProjectPrice,
    agreedPercentage: isPercentage ? v.agreedPercentage : null,
    percentageIncludes: isPercentage ? v.percentageIncludes.trim() : null,
    percentageExcludes: isPercentage ? v.percentageExcludes.trim() : null,
    percentageCalculationMethod: isPercentage ? v.percentageCalculationMethod.trim() : null,
    paymentFrequency: isPercentage ? v.paymentFrequency : null,
  }
}
