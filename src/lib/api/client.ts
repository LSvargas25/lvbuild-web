import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { clearSession, getSession, setSession } from '@/lib/api/auth-storage'
import type { LoginResponse } from '@/types/auth'

const baseURL = import.meta.env.VITE_API_BASE_URL

export const apiClient = axios.create({ baseURL })

// Instancia sin interceptores: evita que el refresh dispare su propio 401 -> refresh en bucle.
const refreshClient = axios.create({ baseURL })

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

function refreshAccessToken(refreshToken: string): Promise<LoginResponse> {
  refreshPromise ??= refreshClient
    .post<LoginResponse>('/auth/refresh-token', { refreshToken })
    .then((res) => res.data)
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined
    const session = getSession()

    if (error.response?.status !== 401 || !config || config._retried || !session?.refreshToken) {
      if (error.response?.status === 401) {
        clearSession()
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    config._retried = true

    try {
      const refreshed = await refreshAccessToken(session.refreshToken)
      setSession(refreshed)
      config.headers.Authorization = `Bearer ${refreshed.accessToken}`
      return apiClient(config)
    } catch (refreshError) {
      clearSession()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    }
  },
)
