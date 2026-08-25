import { apiClient } from '@/lib/api/client'
import type { CreatePayrollRequest, PagedResult, Payroll } from '@/types/payroll'

export function getPayrollsByProject(projectId: number) {
  return apiClient
    .get<PagedResult<Payroll>>(`/projects/${projectId}/payrolls`, { params: { pageSize: 50 } })
    .then((res) => res.data)
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
