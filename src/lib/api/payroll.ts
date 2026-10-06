import { apiClient } from '@/lib/api/client'
import { DEFAULT_PAGE_SIZE, getPage } from '@/lib/api/paging'
import type { CreatePayrollRequest, Payroll } from '@/types/payroll'

export function getPayrollsByProject(
  projectId: number,
  pageNumber = 1,
  pageSize = DEFAULT_PAGE_SIZE,
) {
  return getPage<Payroll>(`/projects/${projectId}/payrolls`, pageNumber, pageSize)
}

export function getPayroll(id: number) {
  return apiClient.get<Payroll>(`/payrolls/${id}`).then((res) => res.data)
}

export function createPayroll(payload: CreatePayrollRequest) {
  return apiClient.post<Payroll>('/payrolls', payload).then((res) => res.data)
}

export function markPayrollPaid(id: number) {
  return apiClient.post<Payroll>(`/payrolls/${id}/mark-paid`, {}).then((res) => res.data)
}
