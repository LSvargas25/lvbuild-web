import { apiClient } from '@/lib/api/client'
import { DEFAULT_PAGE_SIZE, getPage } from '@/lib/api/paging'
import type {
  CashRegister,
  CloseCashRegisterRequest,
  CreateInvoiceRequest,
  CreateInvoicePaymentRequest,
  Invoice,
  IssueInvoiceRequest,
  OpenCashRegisterRequest,
} from '@/types/commercial'

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

export function getInvoicesByBranch(
  branchId: number,
  pageNumber = 1,
  pageSize = DEFAULT_PAGE_SIZE,
) {
  return getPage<Invoice>(`/branches/${branchId}/invoices`, pageNumber, pageSize)
}
