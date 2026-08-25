import { apiClient } from '@/lib/api/client'
import type { Budget, BudgetHistoryEntry, CreateBudgetRequest, PagedResult } from '@/types/budgets'

export interface Customer {
  id: number
  name: string
}

export function getCustomers() {
  return apiClient
    .get<PagedResult<Customer>>('/customers', { params: { pageSize: 100 } })
    .then((res) => res.data.items)
}

export function getBudgets() {
  return apiClient
    .get<PagedResult<Budget>>('/budgets', { params: { pageSize: 50 } })
    .then((res) => res.data)
}

export function getBudget(id: number) {
  return apiClient.get<Budget>(`/budgets/${id}`).then((res) => res.data)
}

export function getBudgetHistory(id: number) {
  return apiClient.get<BudgetHistoryEntry[]>(`/budgets/${id}/history`).then((res) => res.data)
}

export function createBudget(payload: CreateBudgetRequest) {
  return apiClient.post<Budget>('/budgets', payload).then((res) => res.data)
}

export function submitBudgetForReview(id: number) {
  return apiClient.post<Budget>(`/budgets/${id}/submit-for-review`, {}).then((res) => res.data)
}

export function approveBudgetInternal(id: number) {
  return apiClient.post<Budget>(`/budgets/${id}/approve-internal`).then((res) => res.data)
}

export function requestBudgetCorrection(id: number, comment: string) {
  return apiClient
    .post<Budget>(`/budgets/${id}/request-correction`, { comment })
    .then((res) => res.data)
}

export function withdrawBudgetFromCommercial(id: number, comment: string) {
  return apiClient
    .post<Budget>(`/budgets/${id}/withdraw-from-commercial`, { comment })
    .then((res) => res.data)
}

export function markBudgetClientApproved(id: number) {
  return apiClient.post<Budget>(`/budgets/${id}/mark-client-approved`).then((res) => res.data)
}

export function cancelBudget(id: number, reason: string) {
  return apiClient.post<Budget>(`/budgets/${id}/cancel`, { reason }).then((res) => res.data)
}
