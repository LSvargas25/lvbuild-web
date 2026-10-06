import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { FormField } from '@/components/form-field'
import { PageHeader } from '@/components/page-header'
import { ErrorState, LoadingState } from '@/components/page-state'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/button-link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/auth-context'
import { catalogQueries, nameOf } from '@/lib/api/catalogs'
import { getErrorMessage } from '@/lib/api/errors'
import {
  approveSiteLog,
  getSiteLog,
  revertSiteLogToDraft,
  submitSiteLogToReview,
} from '@/lib/api/sitelogs'
import { formatDate } from '@/lib/dates'
import { formatCRC } from '@/lib/format'
import { SITE_LOG_STATUS } from '@/lib/status-labels'
import { MANAGEMENT_ROLES } from '@/types/roles'

export function SiteLogDetailPage() {
  const { id } = useParams()
  const siteLogId = Number(id)
  const { hasRole } = useAuth()
  const queryClient = useQueryClient()
  const [showRevert, setShowRevert] = useState(false)
  const [revertReason, setRevertReason] = useState('')

  const siteLogQuery = useQuery({
    queryKey: ['site-log', siteLogId],
    queryFn: () => getSiteLog(siteLogId),
  })
  const workersQuery = useQuery(catalogQueries.workers)

  const onDone = (message: string) => () => {
    toast.success(message)
    queryClient.invalidateQueries({ queryKey: ['site-log', siteLogId] })
    queryClient.invalidateQueries({ queryKey: ['site-logs'] })
  }

  const submitMutation = useMutation({
    mutationFn: () => submitSiteLogToReview(siteLogId),
    onSuccess: onDone('Bitácora enviada a revisión'),
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudo enviar a revisión.')),
  })
  const approveMutation = useMutation({
    mutationFn: () => approveSiteLog(siteLogId),
    onSuccess: onDone('Bitácora aprobada'),
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudo aprobar la bitácora.')),
  })
  const revertMutation = useMutation({
    mutationFn: () => revertSiteLogToDraft(siteLogId, revertReason.trim()),
    onSuccess: () => {
      setShowRevert(false)
      setRevertReason('')
      onDone('Bitácora devuelta a borrador')()
    },
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudo devolver a borrador.')),
  })

  if (siteLogQuery.isPending) return <LoadingState />
  if (siteLogQuery.isError) {
    return (
      <ErrorState
        error={siteLogQuery.error}
        fallback="No se encontró la bitácora."
        backTo={{ to: '/proyectos', label: 'Volver a proyectos' }}
      />
    )
  }

  const log = siteLogQuery.data
  const canManage = hasRole('ProjectAdmin')
  const canDecide = hasRole(...MANAGEMENT_ROLES)
  const status = SITE_LOG_STATUS[log.status]
  const busy = submitMutation.isPending || approveMutation.isPending || revertMutation.isPending

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <PageHeader
        title={`Semana del ${formatDate(log.weekStart)} al ${formatDate(log.weekEnd)}`}
        actions={<Badge variant={status.variant}>{status.label}</Badge>}
      />
      <Card>
        <CardContent className="flex flex-col gap-4 text-sm">
          <dl className="flex flex-col gap-2">
            <div>
              <dt className="text-muted-foreground">Trabajo realizado</dt>
              <dd className="whitespace-pre-line">{log.taskDescription}</dd>
            </div>
            {log.pendingTasks && (
              <div>
                <dt className="text-muted-foreground">Pendientes</dt>
                <dd className="whitespace-pre-line">{log.pendingTasks}</dd>
              </div>
            )}
          </dl>

          <section aria-labelledby="sitelog-workers" className="flex flex-col gap-1 border-t pt-3">
            <h2 id="sitelog-workers" className="font-medium">
              Trabajadores
            </h2>
            <ul className="flex flex-col gap-1">
              {log.workers.map((w) => (
                <li key={w.id} className="flex justify-between">
                  <span>{nameOf(workersQuery.data, w.workerId)}</span>
                  <span className="font-mono tabular-nums">{w.hoursWorked} h</span>
                </li>
              ))}
            </ul>
          </section>

          <dl className="flex flex-col gap-1 border-t pt-3">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Planilla</dt>
              <dd className="font-mono tabular-nums">{formatCRC(log.totalPayroll)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Materiales</dt>
              <dd className="font-mono tabular-nums">{formatCRC(log.totalMaterials)}</dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-2 border-t pt-4">
            {log.status === 'Draft' && canManage && (
              <Button onClick={() => submitMutation.mutate()} disabled={busy}>
                Enviar a revisión
              </Button>
            )}
            {log.status === 'Review' && canDecide && (
              <>
                <Button onClick={() => approveMutation.mutate()} disabled={busy}>
                  Aprobar
                </Button>
                <Button variant="outline" onClick={() => setShowRevert(true)} disabled={busy}>
                  Devolver a borrador
                </Button>
              </>
            )}
            {log.status === 'Approved' && canManage && (
              <ButtonLink to={`/bitacoras/${log.id}/planilla`}>Crear planilla</ButtonLink>
            )}
            <ButtonLink
              variant="outline" to={`/proyectos/${log.projectId}?tab=bitacoras`}>
              Volver al proyecto
            </ButtonLink>
          </div>

          {showRevert && (
            <form
              className="flex flex-col gap-3 rounded-lg border p-3"
              onSubmit={(e) => {
                e.preventDefault()
                if (revertReason.trim()) revertMutation.mutate()
              }}
            >
              <FormField id="sitelog-revert-reason" label="Motivo de la devolución">
                <Input
                  id="sitelog-revert-reason"
                  autoFocus
                  value={revertReason}
                  onChange={(e) => setRevertReason(e.target.value)}
                />
              </FormField>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={!revertReason.trim() || revertMutation.isPending}>
                  Confirmar devolución
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowRevert(false)}>
                  Volver
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
