import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { FormField } from '@/components/form-field'
import { ErrorState, LoadingState } from '@/components/page-state'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ProgressBar } from '@/features/proyectos/progress-bar'
import { budgetUsage } from '@/features/proyectos/project-metrics'
import { getProjectChapters, getProjectFinance } from '@/lib/api/projects'
import { formatDate, todayLocalISO } from '@/lib/dates'
import { formatCRC, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Budget } from '@/types/budgets'
import type { FinancePeriod, Project } from '@/types/projects'

const PERIOD_LABEL: Record<FinancePeriod, string> = { Week: 'Semana', Month: 'Mes', Year: 'Año' }

export function ProjectFinance({ project, budget }: { project: Project; budget: Budget | undefined }) {
  return (
    <div className="flex flex-col gap-4">
      <ChapterComparison projectId={project.id} budget={budget} />
      <PeriodExpenses projectId={project.id} />
    </div>
  )
}

/** Vendido vs costo real por capítulo (`/projects/{id}/chapters`). */
function ChapterComparison({ projectId, budget }: { projectId: number; budget: Budget | undefined }) {
  const chaptersQuery = useQuery({
    queryKey: ['project-chapters', projectId],
    queryFn: () => getProjectChapters(projectId),
  })

  const chapterName = (chapterId: number) =>
    budget?.chapters.find((c) => c.id === chapterId)?.name ?? `Capítulo #${chapterId}`

  return (
    <Card>
      <CardHeader>
        <CardTitle>Presupuesto vs real por capítulo</CardTitle>
        <CardDescription>
          Monto vendido de cada capítulo frente a lo gastado (planillas, materiales e imprevistos).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chaptersQuery.isPending ? (
          <LoadingState />
        ) : chaptersQuery.isError ? (
          <ErrorState error={chaptersQuery.error} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Capítulo</TableHead>
                <TableHead className="text-right">Vendido</TableHead>
                <TableHead className="text-right">Real</TableHead>
                <TableHead className="min-w-36">Consumido</TableHead>
                <TableHead className="text-right">Utilidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chaptersQuery.data.map((chapter) => {
                const usage = budgetUsage(chapter.actualCostTotal, chapter.assignedSoldTotal)
                return (
                  <TableRow key={chapter.id}>
                    <TableCell>
                      {chapterName(chapter.chapterId)}
                      {chapter.incidentCount > 0 && (
                        <span className="block text-xs text-muted-foreground">
                          {chapter.incidentCount} imprevisto(s)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatCRC(chapter.assignedSoldTotal)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatCRC(chapter.actualCostTotal)}
                    </TableCell>
                    <TableCell>
                      {usage == null ? (
                        <span className="text-xs text-muted-foreground">Sin monto vendido</span>
                      ) : (
                        <ProgressBar
                          value={usage}
                          tone={usage > 100 ? 'danger' : 'default'}
                          label={`Consumido de ${chapterName(chapter.chapterId)}`}
                        />
                      )}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-mono tabular-nums',
                        chapter.chapterProfit < 0 && 'text-destructive',
                      )}
                    >
                      {formatCRC(chapter.chapterProfit)}
                    </TableCell>
                  </TableRow>
                )
              })}
              {chaptersQuery.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    El proyecto no tiene capítulos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            {chaptersQuery.data.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatCRC(chaptersQuery.data.reduce((s, c) => s + c.assignedSoldTotal, 0))}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatCRC(chaptersQuery.data.reduce((s, c) => s + c.actualCostTotal, 0))}
                  </TableCell>
                  <TableCell />
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatCRC(chaptersQuery.data.reduce((s, c) => s + c.chapterProfit, 0))}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

/** Gastos de una semana, mes o año (`/projects/{id}/finance`). */
function PeriodExpenses({ projectId }: { projectId: number }) {
  const [period, setPeriod] = useState<FinancePeriod>('Month')
  const [date, setDate] = useState(() => todayLocalISO())

  const financeQuery = useQuery({
    queryKey: ['project-finance', projectId, period, date],
    queryFn: () => getProjectFinance(projectId, period, date),
    enabled: /^\d{4}-\d{2}-\d{2}$/.test(date),
    placeholderData: keepPreviousData,
  })
  const finance = financeQuery.data

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gastos por periodo</CardTitle>
        <CardDescription>
          {finance
            ? `Del ${formatDate(finance.periodStart)} al ${formatDate(finance.periodEnd)}`
            : 'Elige un periodo'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-3">
          <FormField id="finance-period" label="Periodo" className="w-40">
            <Select value={period} onValueChange={(v) => setPeriod(v as FinancePeriod)}>
              <SelectTrigger id="finance-period" className="w-full">
                <SelectValue>{(v: FinancePeriod) => PERIOD_LABEL[v]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PERIOD_LABEL) as FinancePeriod[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {PERIOD_LABEL[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField id="finance-date" label="Que contiene la fecha" className="w-44">
            <Input id="finance-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </FormField>
        </div>

        {financeQuery.isPending ? (
          <LoadingState />
        ) : financeQuery.isError ? (
          <ErrorState error={financeQuery.error} />
        ) : (
          finance && (
            <>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Metric label="Gastos directos" value={formatCRC(finance.currentDirectExpenses)} />
                <Metric label="Gastos pendientes" value={formatCRC(finance.pendingExpenses)} />
                <Metric
                  label="Horas trabajadas"
                  value={finance.totalHoursWorked.toLocaleString('es-CR')}
                />
              </dl>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {finance.materials.map((m, i) => (
                    <TableRow key={`${m.materialName}-${m.date}-${i}`}>
                      <TableCell>{m.materialName}</TableCell>
                      <TableCell>{m.supplierName || '—'}</TableCell>
                      <TableCell>{formatDate(m.date)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {m.quantity.toLocaleString('es-CR')}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatCRC(m.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {finance.materials.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Sin materiales en este periodo.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {finance.currentDirectExpenses > 0 && (
                <p className="text-xs text-muted-foreground">
                  Materiales: {formatPercent(
                    budgetUsage(
                      finance.materials.reduce((s, m) => s + m.total, 0),
                      finance.currentDirectExpenses,
                    ),
                  )} de los gastos directos del periodo.
                </p>
              )}
            </>
          )
        )}
      </CardContent>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-mono text-lg tabular-nums">{value}</dd>
    </div>
  )
}
