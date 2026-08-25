import { apiClient } from '@/lib/api/client'
import type { CreateOfferRequest, Offer } from '@/types/offers'

export function createOffer(payload: CreateOfferRequest) {
  return apiClient.post<Offer>('/offers', payload).then((res) => res.data)
}

export function getOffer(id: number) {
  return apiClient.get<Offer>(`/offers/${id}`).then((res) => res.data)
}

export function sendOfferToClient(id: number) {
  return apiClient.post<Offer>(`/offers/${id}/send-to-client`, {}).then((res) => res.data)
}

export function markOfferAccepted(id: number) {
  return apiClient.post<Offer>(`/offers/${id}/mark-accepted`, {}).then((res) => res.data)
}

export function revertOfferToDraft(id: number) {
  return apiClient.post<Offer>(`/offers/${id}/revert-to-draft`, {}).then((res) => res.data)
}

export async function openOfferPdf(id: number) {
  const res = await apiClient.get(`/offers/${id}/pdf`, { responseType: 'blob' })
  const url = URL.createObjectURL(res.data as Blob)
  window.open(url, '_blank')
}
