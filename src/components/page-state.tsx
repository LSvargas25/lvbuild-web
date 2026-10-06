import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/lib/api/errors'

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
}

export function ErrorState({ error, fallback = 'No se pudo cargar la información.', backTo }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3">
      <p className="text-destructive">{getErrorMessage(error, fallback)}</p>
      {backTo && (
        <Button variant="outline" render={<Link to={backTo.to} />}>
          {backTo.label}
        </Button>
      )}
    </div>
  )
}
