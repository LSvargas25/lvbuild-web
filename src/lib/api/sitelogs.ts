import { apiClient } from '@/lib/api/client'
import { DEFAULT_PAGE_SIZE, getPage } from '@/lib/api/paging'
import type { CreateSiteLogRequest, SiteLog } from '@/types/sitelogs'

export function getSiteLogsByProject(
  projectId: number,
  pageNumber = 1,
  pageSize = DEFAULT_PAGE_SIZE,
) {
  return getPage<SiteLog>(`/projects/${projectId}/site-logs`, pageNumber, pageSize)
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
