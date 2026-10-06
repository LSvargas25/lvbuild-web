import { z } from 'zod'
import { money, positiveInt, requiredId, requiredText } from '@/lib/validation'
import type { CreateBudgetRequest } from '@/types/budgets'

export const activitySchema = z.object({
  description: requiredText('Describe la actividad'),
  materialQuantity: money(),
  materialCost: money(),
  laborCost: money(),
  equipmentCost: money(),
})

export const chapterSchema = z.object({
  name: requiredText('Escribe el nombre del capítulo'),
  estimatedWeeks: positiveInt(),
  activities: z.array(activitySchema).min(1, 'Agrega al menos una actividad'),
})

export const budgetSchema = z.object({
  name: requiredText('Escribe un nombre para el presupuesto'),
  customerId: requiredId('Elige un cliente'),
  branchId: requiredId('Elige una sucursal'),
  utilityPercentage: money().max(100, 'Debe ser como máximo 100'),
  indirectCostsTotal: money(),
  chapters: z.array(chapterSchema).min(1, 'Agrega al menos un capítulo'),
})

export type BudgetFormValues = z.infer<typeof budgetSchema>
export type ActivityFormValues = z.infer<typeof activitySchema>

export function emptyActivity(): ActivityFormValues {
  return { description: '', materialQuantity: 0, materialCost: 0, laborCost: 0, equipmentCost: 0 }
}

export function emptyChapter(): BudgetFormValues['chapters'][number] {
  return { name: '', estimatedWeeks: 1, activities: [emptyActivity()] }
}

export const defaultBudgetValues: BudgetFormValues = {
  name: '',
  customerId: '',
  branchId: '',
  utilityPercentage: 15,
  indirectCostsTotal: 0,
  chapters: [emptyChapter()],
}

/** Costo directo de una actividad (sin indirectos ni utilidad). */
export function activityCost(activity: Partial<ActivityFormValues>) {
  return (
    (Number(activity.materialCost) || 0) +
    (Number(activity.laborCost) || 0) +
    (Number(activity.equipmentCost) || 0)
  )
}

export function directCost(chapters: BudgetFormValues['chapters']) {
  return chapters.reduce(
    (sum, chapter) => sum + chapter.activities.reduce((s, a) => s + activityCost(a), 0),
    0,
  )
}

export function toCreateBudgetRequest(values: BudgetFormValues): CreateBudgetRequest {
  return {
    name: values.name.trim(),
    customerId: Number(values.customerId),
    branchId: Number(values.branchId),
    utilityPercentage: values.utilityPercentage,
    indirectCostsTotal: values.indirectCostsTotal,
    chapters: values.chapters.map((chapter, index) => ({
      name: chapter.name.trim(),
      order: index + 1,
      estimatedWeeks: chapter.estimatedWeeks,
      activities: chapter.activities.map((a) => ({ ...a, description: a.description.trim() })),
    })),
  }
}
