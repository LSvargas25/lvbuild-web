import { apiClient } from '@/lib/api/client'
import { DEFAULT_PAGE_SIZE, getPage } from '@/lib/api/paging'
import type {
  CreateProjectRequest,
  FinancePeriod,
  Project,
  ProjectChapter,
  ProjectFinance,
} from '@/types/projects'

export function getProjects(pageNumber = 1, pageSize = DEFAULT_PAGE_SIZE) {
  return getPage<Project>('/projects', pageNumber, pageSize)
}

export function createProject(payload: CreateProjectRequest) {
  return apiClient.post<Project>('/projects', payload).then((res) => res.data)
}

export function getProject(id: number) {
  return apiClient.get<Project>(`/projects/${id}`).then((res) => res.data)
}

export function getProjectChapters(id: number) {
  return apiClient.get<ProjectChapter[]>(`/projects/${id}/chapters`).then((res) => res.data)
}

/** Gastos del periodo (semana / mes / año) que contiene `date` (`YYYY-MM-DD`). */
export function getProjectFinance(id: number, period: FinancePeriod, date: string) {
  return apiClient
    .get<ProjectFinance>(`/projects/${id}/finance`, { params: { period, date } })
    .then((res) => res.data)
}
