import axios from 'axios'

// Una petición colgada (instancia dormida) cuenta como fallo y se vuelve a intentar.
const PING_TIMEOUT_MS = 15_000

/**
 * URL del health check de la API: `/health/ready` en el mismo host que `VITE_API_BASE_URL`
 * (que termina en `/api`). "ready" también despierta la base de datos (Neon suspende la suya).
 */
export function healthUrl(baseURL: string | undefined = import.meta.env.VITE_API_BASE_URL): string {
  const apiBase = new URL(baseURL ?? '', window.location.origin)
  return new URL('/health/ready', apiBase).toString()
}

/** true si la API (y su base de datos) responden. Sin interceptores ni token. */
export async function pingApi(url = healthUrl()): Promise<boolean> {
  try {
    await axios.get(url, { timeout: PING_TIMEOUT_MS })
    return true
  } catch {
    return false
  }
}
