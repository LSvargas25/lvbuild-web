import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/auth-context'
import { getWorkers } from '@/lib/api/sitelogs'
import {
  approveSiteLog,
  getSiteLog,
  revertSiteLogToDraft,
  submitSiteLogToReview,
} from '@/lib/api/sitelogs'
import type { SiteLogStatus } from '@/types/sitelogs'

const STATUS_LABEL: Record<SiteLogStatus, string> = {
  Draft: 'Borrador',
  Review: 'En revisión',
  Approved: 'Aprobada',
}

export function SiteLogDetailPage() {
  const { id } = useParams()
  const siteLogId = Number(id)
  const { session } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showRevert, setShowRevert] = useState(false)
  const [revertReason, setRevertReason] = useState('')

  const siteLogQuery = useQuery({
    queryKey: ['site-log', siteLogId],
    queryFn: () => getSiteLog(siteLogId),
  })
  const workersQuery = useQuery({ queryKey: ['workers'], queryFn: getWorkers })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['site-log', siteLogId] })

  const submitMutation = useMutation({
    mutationFn: () => submitSiteLogToReview(siteLogId),
    onSuccess: () => {
      toast.success('Bitácora enviada a revisión')
      invalidate()
    },
    onError: () => toast.error('No se pudo enviar a revisión.'),
  })

  const approveMutation = useMutation({
    mutationFn: () => approveSiteLog(siteLogId),
    onSuccess: () => {
      toast.success('Bitácora aprobada')
      invalidate()
    },
    onError: () => toast.error('No se pudo aprobar la bitácora.'),
  })

  const revertMutation = useMutation({
    mutationFn: () => revertSiteLogToDraft(siteLogId, revertReason),
    onSuccess: () => {
      toast.success('Bitácora devuelta a borrador')
      setShowRevert(false)
      setRevertReason('')
      invalidate()
    },
    onError: () => toast.error('No se pudo devolver a borrador.'),
  })

  if (siteLogQuery.isLoading) return <p className="text-muted-foreground">Cargando…</p>
  const log = siteLogQuery.data
  if (!log) return <p className="text-destructive">No se encontró la bitácora.</p>

  const canManage = session?.roles.includes('ProjectAdmin')
  const canDecide = session?.roles.some((r) => r === 'GeneralManager' || r === 'OperationsDirector')

  function workerName(workerId: number) {
    return workersQuery.data?.find((w) => w.id === workerId)?.name ?? `#${workerId}`
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {new Date(log.weekStart).toLocaleDateString('es-CR')} –{' '}
            {new Date(log.weekEnd).toLocaleDateString('es-CR')}
          </CardTitle>
          <Badge variant={log.status === 'Approved' ? 'default' : 'secondary'}>
            {STATUS_LABEL[log.status]}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Trabajo realizado: </span>
            {log.taskDescription}
          </div>
          {log.pendingTasks && (
            <div>
              <span className="text-muted-foreground">Pendientes: </span>
              {log.pendingTasks}
            </div>
          )}

          <div className="flex flex-col gap-1 border-t pt-3">
            <span className="font-medium">Trabajadores</span>
            {log.workers.map((w) => (
              <div key={w.id} className="flex justify-between">
                <span>{workerName(w.workerId)}</span>
                <span className="font-mono tabular-nums">{w.hoursWorked} h</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 border-t pt-4">
            {log.status === 'Draft' && canManage && (
              <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
                Enviar a revisión
              </Button>
            )}
            {log.status === 'Review' && canDecide && (
              <>
                <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
                  Aprobar
                </Button>
                <Button variant="outline" onClick={() => setShowRevert(true)}>
                  Devolver a borrador
                </Button>
              </>
            )}
            {log.status === 'Approved' && canManage && (
              <Button onClick={() => navigate(`/bitacoras/${log.id}/planilla`)}>
                Crear planilla
              </Button>
            )}
            <Button variant="outline" render={<Link to={`/proyectos/${log.projectId}/bitacoras`} />}>
              Volver al listado
            </Button>
          </div>

          {showRevert && (
            <div className="flex gap-2 rounded-lg border p-3">
              <Input
                placeholder="Motivo"
                value={revertReason}
                onChange={(e) => setRevertReason(e.target.value)}
              />
              <Button
                onClick={() => revertMutation.mutate()}
                disabled={!revertReason || revertMutation.isPending}
              >
                Confirmar
              </Button>
              <Button variant="ghost" onClick={() => setShowRevert(false)}>
                Cancelar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
