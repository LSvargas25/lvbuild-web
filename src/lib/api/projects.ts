import { apiClient } from '@/lib/api/client'
import type { CreateProjectRequest, Project } from '@/types/projects'

export function createProject(payload: CreateProjectRequest) {
  return apiClient.post<Project>('/projects', payload).then((res) => res.data)
}

export function getProject(id: number) {
  return apiClient.get<Project>(`/projects/${id}`).then((res) => res.data)
}
