import { apiClient } from '@/lib/api/client'
import type {
  Branch,
  CashRegister,
  CloseCashRegisterRequest,
  CreateInvoiceRequest,
  CreateInvoicePaymentRequest,
  Invoice,
  IssueInvoiceRequest,
  OpenCashRegisterRequest,
  PagedResult,
  Product,
} from '@/types/commercial'

export function getBranches() {
  return apiClient
    .get<PagedResult<Branch>>('/branches', { params: { pageSize: 100 } })
    .then((res) => res.data.items)
}

export function getBranchInventory(branchId: number) {
  return apiClient
    .get<{ productId: number; productName: string; quantity: number }[]>(
      `/branches/${branchId}/inventory`,
    )
    .then((res) => res.data)
}

export function getProducts() {
  return apiClient
    .get<PagedResult<Product>>('/products', { params: { pageSize: 100 } })
    .then((res) => res.data.items)
}

export function openCashRegister(payload: OpenCashRegisterRequest) {
  return apiClient.post<CashRegister>('/cash-registers/open', payload).then((res) => res.data)
}

export function closeCashRegister(id: number, payload: CloseCashRegisterRequest) {
  return apiClient
    .post<CashRegister>(`/cash-registers/${id}/close`, payload)
    .then((res) => res.data)
}

export function getCashRegister(id: number) {
  return apiClient.get<CashRegister>(`/cash-registers/${id}`).then((res) => res.data)
}

export function createInvoice(payload: CreateInvoiceRequest) {
  return apiClient.post<Invoice>('/invoices', payload).then((res) => res.data)
}

export function getInvoice(id: number) {
  return apiClient.get<Invoice>(`/invoices/${id}`).then((res) => res.data)
}

export function issueInvoice(id: number, payload: IssueInvoiceRequest) {
  return apiClient.post<Invoice>(`/invoices/${id}/issue`, payload).then((res) => res.data)
}

export function addInvoicePayment(id: number, payload: CreateInvoicePaymentRequest) {
  return apiClient.post<Invoice>(`/invoices/${id}/payments`, payload).then((res) => res.data)
}

export function cancelInvoice(id: number) {
  return apiClient.post<Invoice>(`/invoices/${id}/cancel`).then((res) => res.data)
}

export function getInvoicesByBranch(branchId: number, pageNumber = 1, pageSize = 20) {
  return apiClient
    .get<PagedResult<Invoice>>(`/branches/${branchId}/invoices`, {
      params: { pageNumber, pageSize },
    })
    .then((res) => res.data)
}
