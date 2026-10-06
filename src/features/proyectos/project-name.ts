import type { Project } from '@/types/projects'

/**
 * Nombre visible de un proyecto: el que manda la API, o el del presupuesto si ya se cargó.
 * El número solo aparece si no hay ninguno de los dos.
 */
export function projectName(project: Pick<Project, 'id' | 'name'>, budgetName?: string): string {
  return project.name?.trim() || budgetName?.trim() || `Proyecto #${project.id}`
}
