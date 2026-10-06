import axios from 'axios'

/**
 * Formas de error que devuelve la API:
 * - ExceptionMiddleware / validadores: `{ statusCode, message }`
 * - Model binding de ASP.NET Core (ProblemDetails): `{ title, errors: { campo: [mensajes] } }`
 */
interface ApiErrorBody {
  message?: string
  title?: string
  detail?: string
  errors?: Record<string, string[]>
}

/** Mensaje legible para el usuario a partir de un error de la API, o `fallback` si no hay uno. */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback

  if (!error.response) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión.'
  }

  const body = error.response.data as ApiErrorBody | undefined
  if (body && typeof body === 'object') {
    if (body.errors) {
      const messages = Object.values(body.errors).flat().filter(Boolean)
      if (messages.length > 0) return messages.join(' ')
    }
    if (body.message) return body.message
    if (body.detail) return body.detail
  }

  if (error.response.status === 403) return 'No tienes permiso para realizar esta acción.'
  return fallback
}
