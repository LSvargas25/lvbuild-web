import { Navigate, isRouteErrorResponse, useParams, useRouteError } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/button-link'

function ErrorLayout({ code, title, message }: { code: string; title: string; message: string }) {
  return (
    <main className="flex min-h-[60svh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-mono text-sm text-muted-foreground">{code}</p>
      <h1 className="font-heading text-3xl font-semibold tracking-wide">{title}</h1>
      <p className="max-w-md text-muted-foreground">{message}</p>
      <ButtonLink to="/">Ir al inicio</ButtonLink>
    </main>
  )
}

export function NotFoundPage() {
  return (
    <ErrorLayout
      code="404"
      title="Página no encontrada"
      message="La dirección no existe o se movió. Revisa el enlace o vuelve al inicio."
    />
  )
}

/** `errorElement` del router: errores de render o de carga de una ruta. */
export function RouteErrorPage() {
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />
  }

  // Tras un deploy, los chunks viejos ya no existen: recargar trae la versión nueva.
  const isChunkError =
    error instanceof Error && /dynamically imported module|Importing a module script failed/i.test(error.message)

  return (
    <main className="flex min-h-[60svh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-mono text-sm text-muted-foreground">Error</p>
      <h1 className="font-heading text-3xl font-semibold tracking-wide">Algo salió mal</h1>
      <p className="max-w-md text-muted-foreground">
        {isChunkError
          ? 'Hay una versión nueva de la aplicación. Recarga la página para continuar.'
          : 'Ocurrió un error inesperado al mostrar esta pantalla.'}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => window.location.reload()}>Recargar</Button>
        <ButtonLink variant="outline" to="/">
          Ir al inicio
        </ButtonLink>
      </div>
    </main>
  )
}

/** `/proyectos/:projectId/bitacoras` pasó a ser una pestaña del detalle de proyecto. */
export function LegacySiteLogsRedirect() {
  const { projectId } = useParams()
  return <Navigate to={`/proyectos/${projectId}?tab=bitacoras`} replace />
}
