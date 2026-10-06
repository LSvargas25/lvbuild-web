import { daysBetween, toISODate, todayLocalISO } from '@/lib/dates'

/**
 * Avance por tiempo transcurrido entre inicio y fin estimado (0-100). La API no expone un
 * porcentaje de obra del proyecto, así que el avance se mide contra el calendario.
 */
export function timeProgress(startDate: string, endDate: string, today = todayLocalISO()) {
  const start = toISODate(startDate)
  const end = toISODate(endDate)
  const total = daysBetween(start, end)
  if (total <= 0) return today >= end ? 100 : 0
  const elapsed = daysBetween(start, today)
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))
}

/** Porcentaje del presupuesto ya gastado (puede pasar de 100). `null` si no hay presupuesto. */
export function budgetUsage(spent: number, budget: number | undefined) {
  if (!budget || budget <= 0) return null
  return Math.round((spent / budget) * 1000) / 10
}

/** Tono para el porcentaje gastado frente al avance: por encima del avance es una alerta. */
export function usageTone(usage: number | null, progress: number) {
  if (usage == null) return 'muted'
  if (usage > 100) return 'danger'
  if (usage > progress + 10) return 'warning'
  return 'ok'
}
