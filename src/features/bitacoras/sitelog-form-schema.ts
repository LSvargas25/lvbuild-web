import { z } from 'zod'
import { addDays, mondayOf, todayLocalISO } from '@/lib/dates'
import { isoDate, positive, requiredId, requiredText } from '@/lib/validation'
import type { CreateSiteLogRequest } from '@/types/sitelogs'

export const siteLogSchema = z.object({
  weekStart: isoDate(),
  chapterId: z.string(),
  taskDescription: requiredText('Describe el trabajo realizado'),
  pendingTasks: z.string(),
  workers: z
    .array(
      z.object({
        workerId: requiredId('Elige un trabajador'),
        hoursWorked: positive().max(168, 'Una semana tiene 168 horas'),
      }),
    )
    .min(1, 'Agrega al menos un trabajador')
    .superRefine((workers, ctx) => {
      const seen = new Set<string>()
      workers.forEach((w, index) => {
        if (w.workerId && seen.has(w.workerId)) {
          ctx.addIssue({
            code: 'custom',
            path: [index, 'workerId'],
            message: 'Este trabajador ya está en la lista',
          })
        }
        seen.add(w.workerId)
      })
    }),
})

export type SiteLogFormValues = z.infer<typeof siteLogSchema>

export function siteLogDefaults(today = todayLocalISO()): SiteLogFormValues {
  return {
    weekStart: mondayOf(today),
    chapterId: '',
    taskDescription: '',
    pendingTasks: '',
    workers: [{ workerId: '', hoursWorked: 40 }],
  }
}

export function toCreateSiteLogRequest(projectId: number, v: SiteLogFormValues): CreateSiteLogRequest {
  const weekStart = mondayOf(v.weekStart)
  return {
    projectId,
    chapterId: v.chapterId ? Number(v.chapterId) : null,
    weekStart,
    weekEnd: addDays(weekStart, 6),
    taskDescription: v.taskDescription.trim(),
    pendingTasks: v.pendingTasks.trim() || null,
    workers: v.workers.map((w) => ({ workerId: Number(w.workerId), hoursWorked: w.hoursWorked })),
  }
}
