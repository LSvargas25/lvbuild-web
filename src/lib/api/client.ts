import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { clearSession, getSession, setSession } from '@/lib/api/auth-storage'
import type { LoginResponse } from '@/types/auth'

const baseURL = import.meta.env.VITE_API_BASE_URL

export const apiClient = axios.create({ baseURL })

// Instancia sin interceptores: evita que el refresh dispare su propio 401 -> refresh en bucle.
const refreshClient = axios.create({ baseURL })

// Un 401 en estos endpoints significa "credenciales inválidas", no "sesión vencida":
// se devuelve tal cual para que la pantalla muestre el error.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh-token']

let onSessionExpired: (() => void) | null = null

/**
 * Registra qué hacer cuando la sesión no se puede renovar. Lo usa AuthProvider para limpiar el
 * estado; las rutas protegidas redirigen a /login con el router, sin recargar la página.
 */
export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler
}

function expireSession() {
  clearSession()
  onSessionExpired?.()
}

apiClient.interceptors.request.use((config) => {
  const session = getSession()
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`
  }
  return config
})

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

let refreshPromise: Promise<LoginResponse> | null = null

/** Single-flight: requests concurrentes con 401 comparten un único refresh. */
function refreshAccessToken(refreshToken: string): Promise<LoginResponse> {
  refreshPromise ??= refreshClient
    .post<LoginResponse>('/auth/refresh-token', { refreshToken })
    .then((res) => res.data)
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

function isAuthEndpoint(config: InternalAxiosRequestConfig) {
  return AUTH_ENDPOINTS.some((endpoint) => config.url?.endsWith(endpoint))
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined

    if (error.response?.status !== 401 || !config || isAuthEndpoint(config)) {
      return Promise.reject(error)
    }

    const session = getSession()
    if (config._retried || !session?.refreshToken) {
      expireSession()
      return Promise.reject(error)
    }

    config._retried = true

    try {
      const refreshed = await refreshAccessToken(session.refreshToken)
      setSession(refreshed)
      config.headers.Authorization = `Bearer ${refreshed.accessToken}`
      return apiClient(config)
    } catch (refreshError) {
      expireSession()
      return Promise.reject(refreshError)
    }
  },
)
