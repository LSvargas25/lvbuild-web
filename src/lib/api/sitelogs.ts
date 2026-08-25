import { apiClient } from '@/lib/api/client'
import type { CreateSiteLogRequest, PagedResult, SiteLog, Worker } from '@/types/sitelogs'

export function getWorkers() {
  return apiClient
    .get<PagedResult<Worker>>('/workers', { params: { pageSize: 100 } })
    .then((res) => res.data.items)
}

export function getSiteLogsByProject(projectId: number) {
  return apiClient
    .get<PagedResult<SiteLog>>(`/projects/${projectId}/site-logs`, { params: { pageSize: 50 } })
    .then((res) => res.data)
}

export function getSiteLog(id: number) {
  return apiClient.get<SiteLog>(`/site-logs/${id}`).then((res) => res.data)
}

export function createSiteLog(payload: CreateSiteLogRequest) {
  return apiClient.post<SiteLog>('/site-logs', payload).then((res) => res.data)
}

export function submitSiteLogToReview(id: number) {
  return apiClient.post<SiteLog>(`/site-logs/${id}/submit-review`, {}).then((res) => res.data)
}

export function approveSiteLog(id: number) {
  return apiClient.post<SiteLog>(`/site-logs/${id}/approve`, {}).then((res) => res.data)
}

export function revertSiteLogToDraft(id: number, reason: string) {
  return apiClient
    .post<SiteLog>(`/site-logs/${id}/revert-to-draft`, { reason })
    .then((res) => res.data)
}
