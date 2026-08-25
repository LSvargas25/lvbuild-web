import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/auth-context'
import {
  STATUS_ACTIONS,
  STATUS_LABEL,
  STATUS_VARIANT,
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

export function BudgetDetailPage() {
  const { id } = useParams()
  const budgetId = Number(id)
  const { session } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [pendingAction, setPendingAction] = useState<BudgetAction | null>(null)
  const [comment, setComment] = useState('')

  const budgetQuery = useQuery({ queryKey: ['budget', budgetId], queryFn: () => getBudget(budgetId) })
  const historyQuery = useQuery({
    queryKey: ['budget-history', budgetId],
    queryFn: () => getBudgetHistory(budgetId),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['budget', budgetId] })
    queryClient.invalidateQueries({ queryKey: ['budget-history', budgetId] })
  }

  const runAction = useMutation({
    mutationFn: async (action: BudgetAction) => {
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
    },
    onSuccess: () => {
      toast.success('Presupuesto actualizado')
      setPendingAction(null)
      setComment('')
      invalidate()
    },
    onError: () => toast.error('No se pudo aplicar la acción.'),
  })

  if (budgetQuery.isLoading) return <p className="text-muted-foreground">Cargando…</p>
  const budget = budgetQuery.data
  if (!budget) return <p className="text-destructive">No se encontró el presupuesto.</p>

  const availableActions = (STATUS_ACTIONS[budget.status] ?? []).filter((action) =>
    session?.roles.some((role) => action.roles.includes(role)),
  )

  function handleActionClick(action: BudgetAction) {
    if (action.needsComment) {
      setPendingAction(action)
    } else {
      runAction.mutate(action)
    }
  }

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{budget.name}</CardTitle>
          <Badge variant={STATUS_VARIANT[budget.status]}>{STATUS_LABEL[budget.status]}</Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {budget.chapters.map((chapter) => (
              <div key={chapter.id} className="rounded-lg border p-3">
                <div className="flex justify-between font-medium">
                  <span>{chapter.name}</span>
                  <span className="font-mono tabular-nums">
                    ₡{chapter.totalChapter.toLocaleString('es-CR')}
                  </span>
                </div>
                <div className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground">
                  {chapter.activities.map((activity) => (
                    <div key={activity.id} className="flex justify-between">
                      <span>{activity.description}</span>
                      <span className="font-mono tabular-nums">
                        ₡{activity.totalActivity.toLocaleString('es-CR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Costos indirectos</span>
              <span className="font-mono tabular-nums">
                ₡{budget.indirectCostsTotal.toLocaleString('es-CR')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Utilidad</span>
              <span className="font-mono tabular-nums">{budget.utilityPercentage}%</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total presupuesto</span>
              <span className="font-mono tabular-nums">
                ₡{budget.totalBudget.toLocaleString('es-CR')}
              </span>
            </div>
          </div>

          {availableActions.length > 0 && (
            <div className="flex flex-col gap-3 border-t pt-4">
              <div className="flex flex-wrap gap-2">
                {availableActions.map((action) => (
                  <Button
                    key={action.key}
                    variant={action.variant ?? 'default'}
                    onClick={() => handleActionClick(action)}
                    disabled={runAction.isPending}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
              {pendingAction && (
                <div className="flex gap-2 rounded-lg border p-3">
                  <Input
                    placeholder="Comentario / motivo"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <Button
                    variant={pendingAction.variant ?? 'default'}
                    onClick={() => runAction.mutate(pendingAction)}
                    disabled={!comment || runAction.isPending}
                  >
                    Confirmar
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setPendingAction(null)
                      setComment('')
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          )}

          {budget.status === 'Sent' &&
            session?.roles.includes('ProjectAdmin') && (
              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/presupuestos/${budget.id}/oferta`)}
                >
                  Crear oferta desde este presupuesto
                </Button>
              </div>
            )}

          <div className="flex flex-col gap-2 border-t pt-4">
            <span className="text-sm font-medium">Historial (inmutable)</span>
            <div className="flex flex-col gap-2">
              {historyQuery.data?.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 text-sm">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  <div className="flex flex-col">
                    <span>
                      {entry.previousStatus ? (
                        <>
                          {STATUS_LABEL[entry.previousStatus]} → {STATUS_LABEL[entry.newStatus]}
                        </>
                      ) : (
                        <>Creado como {STATUS_LABEL[entry.newStatus]}</>
                      )}
                    </span>
                    {(entry.comment || entry.reason) && (
                      <span className="text-muted-foreground">
                        {entry.comment ?? entry.reason}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString('es-CR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button variant="outline" render={<Link to="/presupuestos" />} className="w-fit">
            Volver al listado
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
