import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { FormField } from '@/components/form-field'
import { PageHeader } from '@/components/page-header'
import { ErrorState, LoadingState } from '@/components/page-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/auth-context'
import {
  STATUS_LABEL,
  STATUS_VARIANT,
  availableBudgetActions,
  canCreateOffer,
  type BudgetAction,
} from '@/features/presupuestos/budget-status'
import {
  approveBudgetInternal,
  cancelBudget,
  getBudget,
  getBudgetHistory,
  markBudgetClientApproved,
  requestBudgetCorrection,
  submitBudgetForReview,
  withdrawBudgetFromCommercial,
} from '@/lib/api/budgets'
import { catalogQueries, nameOf } from '@/lib/api/catalogs'
import { getErrorMessage } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/dates'
import { formatCRC } from '@/lib/format'

function runBudgetAction(budgetId: number, action: BudgetAction, comment: string) {
  switch (action.key) {
    case 'submit-for-review':
      return submitBudgetForReview(budgetId)
    case 'approve-internal':
      return approveBudgetInternal(budgetId)
    case 'request-correction':
      return requestBudgetCorrection(budgetId, comment)
    case 'withdraw-from-commercial':
      return withdrawBudgetFromCommercial(budgetId, comment)
    case 'mark-client-approved':
      return markBudgetClientApproved(budgetId)
    case 'cancel':
      return cancelBudget(budgetId, comment)
  }
}

export function BudgetDetailPage() {
  const { id } = useParams()
  const budgetId = Number(id)
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const [pendingAction, setPendingAction] = useState<BudgetAction | null>(null)
  const [comment, setComment] = useState('')

  const budgetQuery = useQuery({ queryKey: ['budget', budgetId], queryFn: () => getBudget(budgetId) })
  const historyQuery = useQuery({
    queryKey: ['budget-history', budgetId],
    queryFn: () => getBudgetHistory(budgetId),
  })
  const customersQuery = useQuery(catalogQueries.customers)
  const branchesQuery = useQuery(catalogQueries.branches)

  const actionMutation = useMutation({
    mutationFn: (action: BudgetAction) => runBudgetAction(budgetId, action, comment.trim()),
    onSuccess: () => {
      toast.success('Presupuesto actualizado')
      setPendingAction(null)
      setComment('')
      queryClient.invalidateQueries({ queryKey: ['budget', budgetId] })
      queryClient.invalidateQueries({ queryKey: ['budget-history', budgetId] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudo aplicar la acción.')),
  })

  if (budgetQuery.isPending) return <LoadingState />
  if (budgetQuery.isError) {
    return (
      <ErrorState
        error={budgetQuery.error}
        fallback="No se encontró el presupuesto."
        backTo={{ to: '/presupuestos', label: 'Volver a presupuestos' }}
      />
    )
  }

  const budget = budgetQuery.data
  const roles = session?.roles ?? []
  const actions = availableBudgetActions(budget.status, roles)

  function handleActionClick(action: BudgetAction) {
    if (action.needsComment) {
      setPendingAction(action)
      setComment('')
    } else {
      actionMutation.mutate(action)
    }
  }

  return (
    <div className="flex max-w-4xl flex-col gap-4">
      <PageHeader
        title={budget.name}
        description={`${nameOf(customersQuery.data, budget.customerId)} · ${nameOf(branchesQuery.data, budget.branchId)}`}
        actions={<Badge variant={STATUS_VARIANT[budget.status]}>{STATUS_LABEL[budget.status]}</Badge>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Capítulos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {budget.chapters.map((chapter) => (
              <div key={chapter.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap justify-between gap-2 font-medium">
                  <span>
                    {chapter.name}{' '}
                    <span className="text-sm font-normal text-muted-foreground">
                      · {chapter.estimatedWeeks} sem.
                    </span>
                  </span>
                  <span className="font-mono tabular-nums">{formatCRC(chapter.totalChapter)}</span>
                </div>
                <ul className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground">
                  {chapter.activities.map((activity) => (
                    <li key={activity.id} className="flex justify-between gap-2">
                      <span>{activity.description}</span>
                      <span className="font-mono tabular-nums">
                        {formatCRC(activity.totalActivity)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <dl className="flex flex-col gap-1 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Costos indirectos</dt>
              <dd className="font-mono tabular-nums">{formatCRC(budget.indirectCostsTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Utilidad</dt>
              <dd className="font-mono tabular-nums">{budget.utilityPercentage} %</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>Total presupuesto</dt>
              <dd className="font-mono tabular-nums">{formatCRC(budget.totalBudget)}</dd>
            </div>
          </dl>

          {(actions.length > 0 || canCreateOffer(budget.status, roles)) && (
            <div className="flex flex-col gap-3 border-t pt-4">
              <div className="flex flex-wrap gap-2">
                {actions.map((action) => (
                  <Button
                    key={action.key}
                    variant={action.variant ?? 'default'}
                    onClick={() => handleActionClick(action)}
                    disabled={actionMutation.isPending}
                  >
                    {action.label}
                  </Button>
                ))}
                {canCreateOffer(budget.status, roles) && (
                  <Button variant="outline" render={<Link to={`/presupuestos/${budget.id}/oferta`} />}>
                    Crear oferta desde este presupuesto
                  </Button>
                )}
              </div>
              {pendingAction && (
                <form
                  className="flex flex-col gap-3 rounded-lg border p-3"
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (comment.trim()) actionMutation.mutate(pendingAction)
                  }}
                >
                  <FormField
                    id="budget-action-comment"
                    label={
                      pendingAction.key === 'cancel'
                        ? 'Motivo de la cancelación'
                        : 'Comentario para el equipo de proyecto'
                    }
                  >
                    <Input
                      id="budget-action-comment"
                      autoFocus
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </FormField>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="submit"
                      variant={pendingAction.variant ?? 'default'}
                      disabled={!comment.trim() || actionMutation.isPending}
                    >
                      Confirmar: {pendingAction.label.toLowerCase()}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setPendingAction(null)}>
                      Volver
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial</CardTitle>
        </CardHeader>
        <CardContent>
          {historyQuery.isPending ? (
            <LoadingState />
          ) : (
            <ol className="flex flex-col gap-3">
              {historyQuery.data?.map((entry) => (
                <li key={entry.id} className="flex items-start gap-3 text-sm">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  <div className="flex flex-col">
                    <span>
                      {entry.previousStatus
                        ? `${STATUS_LABEL[entry.previousStatus]} → ${STATUS_LABEL[entry.newStatus]}`
                        : `Creado como ${STATUS_LABEL[entry.newStatus]}`}
                    </span>
                    {(entry.comment || entry.reason) && (
                      <span className="text-muted-foreground">{entry.comment ?? entry.reason}</span>
                    )}
                    <time dateTime={entry.timestamp} className="text-xs text-muted-foreground">
                      {formatDateTime(entry.timestamp)}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <Button variant="outline" render={<Link to="/presupuestos" />} className="w-fit">
        Volver a presupuestos
      </Button>
    </div>
  )
}
