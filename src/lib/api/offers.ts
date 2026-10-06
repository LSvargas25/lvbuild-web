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

// Tiempo para que la pestaña nueva cargue el blob antes de liberarlo.
const PDF_URL_LIFETIME_MS = 60_000

/** Descarga el PDF de la oferta (la ruta requiere el token) y lo abre en una pestaña nueva. */
export async function openOfferPdf(id: number) {
  // La pestaña se abre antes del await: los bloqueadores de ventanas emergentes solo permiten
  // window.open dentro del gesto del usuario.
  const tab = window.open('', '_blank')
  try {
    const res = await apiClient.get<Blob>(`/offers/${id}/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    if (tab) tab.location.href = url
    else window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), PDF_URL_LIFETIME_MS)
  } catch (error) {
    tab?.close()
    throw error
  }
}
