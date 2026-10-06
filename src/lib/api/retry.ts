import axios from 'axios'

/** Reintentos para fallas transitorias: Render tarda ~50 s en despertar una instancia dormida. */
export const MAX_TRANSIENT_RETRIES = 8
const MAX_DELAY_MS = 10_000

/** Status que devuelve el proxy mientras la API arranca o se redespliega. */
const TRANSIENT_STATUSES = new Set([502, 503, 504])

/** Sin respuesta (red caída, timeout) o 502/503/504: vale la pena reintentar. */
export function isTransientError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false
  const status = error.response?.status
  return status === undefined || TRANSIENT_STATUSES.has(status)
}

/**
 * Política de reintentos de React Query:
 * - 4xx: nunca (no existe, sin permiso, validación: reintentar no lo arregla).
 * - red / 502 / 503 / 504: hasta {@link MAX_TRANSIENT_RETRIES} veces, con backoff.
 * - otros errores (p. ej. 500): un reintento.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    if (status !== undefined && status >= 400 && status < 500) return false
  }
  return failureCount < (isTransientError(error) ? MAX_TRANSIENT_RETRIES : 1)
}

/** Backoff exponencial: 1 s, 2 s, 4 s, 8 s y luego 10 s (≈ 55 s en total con 8 reintentos). */
export function retryDelayMs(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, MAX_DELAY_MS)
}
