import { QueryClient } from '@tanstack/react-query'
import { retryDelayMs, shouldRetryQuery } from '@/lib/api/retry'

/** Cliente de React Query de la app. Los tests acortan `retryDelay` para no esperar el backoff. */
export function createQueryClient({ retryDelay = retryDelayMs }: { retryDelay?: (attempt: number) => number } = {}) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetryQuery,
        retryDelay,
        refetchOnWindowFocus: false,
      },
    },
  })
}
