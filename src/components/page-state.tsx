import { useQueryClient } from '@tanstack/react-query'
import { RefreshCwIcon } from 'lucide-react'
import { ButtonLink } from '@/components/button-link'
import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/lib/api/errors'
import { isTransientError } from '@/lib/api/retry'

export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <p role="status" aria-live="polite" className="text-muted-foreground">
      {label}
    </p>
  )
}

interface ErrorStateProps {
  error: unknown
  fallback?: string
  backTo?: { to: string; label: string }
  /** Qué hacer al pulsar "Reintentar"; por defecto, volver a pedir las consultas que fallaron. */
  onRetry?: () => void
}

export function ErrorState({ error, fallback = 'No se pudo cargar la información.', backTo, onRetry }: ErrorStateProps) {
  const queryClient = useQueryClient()
  // Reintentar solo tiene sentido si el fallo puede ser pasajero (red, servidor despertando, 5xx).
  const canRetry = isTransientError(error) || isServerError(error)
  const retry =
    onRetry ?? (() => void queryClient.refetchQueries({ predicate: (query) => query.state.status === 'error' }))

  return (
    <div role="alert" className="flex flex-col items-start gap-3">
      <p className="text-destructive">{getErrorMessage(error, fallback)}</p>
      <div className="flex flex-wrap gap-2">
        {canRetry && (
          <Button variant="outline" onClick={retry}>
            <RefreshCwIcon aria-hidden="true" /> Reintentar
          </Button>
        )}
        {backTo && (
          <ButtonLink variant="outline" to={backTo.to}>
            {backTo.label}
          </ButtonLink>
        )}
      </div>
    </div>
  )
}

function isServerError(error: unknown): boolean {
  const status = (error as { response?: { status?: number } } | null)?.response?.status
  return status !== undefined && status >= 500
}
