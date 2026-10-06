import { useQuery } from '@tanstack/react-query'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/page-header'
import { ErrorState, LoadingState } from '@/components/page-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProjectPayrolls } from '@/features/bitacoras/project-payrolls'
import { ProjectSiteLogs } from '@/features/bitacoras/project-sitelogs'
import { ProgressBar } from '@/features/proyectos/progress-bar'
import { ProjectFinance } from '@/features/proyectos/project-finance'
import { budgetUsage, timeProgress } from '@/features/proyectos/project-metrics'
import { getBudget } from '@/lib/api/budgets'
import { catalogQueries, nameOf } from '@/lib/api/catalogs'
import { getProject } from '@/lib/api/projects'
import { formatDate } from '@/lib/dates'
import { formatCRC, formatPercent } from '@/lib/format'
import { PROJECT_STATUS } from '@/lib/status-labels'
import { cn } from '@/lib/utils'
import type { Budget } from '@/types/budgets'
import type { Project } from '@/types/projects'

const TABS = [
  { value: 'resumen', label: 'Resumen' },
  { value: 'finanzas', label: 'Finanzas' },
  { value: 'bitacoras', label: 'Bitácoras' },
  { value: 'planillas', label: 'Planillas' },
  { value: 'trabajadores', label: 'Trabajadores' },
] as const

type TabValue = (typeof TABS)[number]['value']

function isTab(value: string | null): value is TabValue {
  return TABS.some((tab) => tab.value === value)
}

export function ProjectDetailPage() {
  const { id } = useParams()
  const projectId = Number(id)
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const tab: TabValue = isTab(tabParam) ? tabParam : 'resumen'

  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId),
  })
  const budgetId = projectQuery.data?.budgetId
  const budgetQuery = useQuery({
    queryKey: ['budget', budgetId],
    queryFn: () => getBudget(budgetId!),
    enabled: budgetId !== undefined,
  })
  const customersQuery = useQuery(catalogQueries.customers)
  const branchesQuery = useQuery(catalogQueries.branches)

  if (projectQuery.isPending) return <LoadingState />
  if (projectQuery.isError) {
    return (
      <ErrorState
        error={projectQuery.error}
        fallback="No se encontró el proyecto."
        backTo={{ to: '/proyectos', label: 'Volver a proyectos' }}
      />
    )
  }

  const project = projectQuery.data
  const status = PROJECT_STATUS[project.status]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={budgetQuery.data?.name ?? `Proyecto #${project.id}`}
        description={`${nameOf(customersQuery.data, project.customerId)} · ${nameOf(branchesQuery.data, project.branchId)}`}
        actions={<Badge variant={status.variant}>{status.label}</Badge>}
      />

      <Tabs
        value={tab}
        onValueChange={(value) => setSearchParams({ tab: value as string }, { replace: true })}
      >
        <TabsList className="h-auto flex-wrap">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="resumen" className="pt-2">
          <ProjectSummary project={project} budget={budgetQuery.data} />
        </TabsContent>
        <TabsContent value="finanzas" className="pt-2">
          <ProjectFinance project={project} budget={budgetQuery.data} />
        </TabsContent>
        <TabsContent value="bitacoras" className="pt-2">
          <ProjectSiteLogs projectId={project.id} canCreate={project.status === 'Active'} />
        </TabsContent>
        <TabsContent value="planillas" className="pt-2">
          <ProjectPayrolls projectId={project.id} />
        </TabsContent>
        <TabsContent value="trabajadores" className="pt-2">
          <ProjectWorkers project={project} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ProjectSummary({ project, budget }: { project: Project; budget: Budget | undefined }) {
  const progress = timeProgress(project.startDate, project.endDate)
  const usage = budgetUsage(project.currentDirectExpenses, budget?.totalBudget)

  const stats: [string, string, string?][] = [
    ['Presupuesto', budget ? formatCRC(budget.totalBudget) : '…'],
    [
      'Gastos directos',
      formatCRC(project.currentDirectExpenses),
      usage == null ? undefined : `${formatPercent(usage)} del presupuesto`,
    ],
    ['Gastos pendientes', formatCRC(project.pendingExpenses)],
    ['Utilidad actual', formatCRC(project.currentProfit)],
  ]

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value, note]) => (
          <Card key={label} size="sm">
            <CardContent>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd
                className={cn(
                  'mt-1 font-mono text-xl tabular-nums',
                  label === 'Utilidad actual' && project.currentProfit < 0 && 'text-destructive',
                )}
              >
                {value}
              </dd>
              {note && <dd className="text-xs text-muted-foreground">{note}</dd>}
            </CardContent>
          </Card>
        ))}
      </dl>

      <Card>
        <CardContent className="flex flex-col gap-4 text-sm">
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground">
              Avance según calendario · semana {project.weeksCounter}
            </span>
            <ProgressBar value={progress} label="Avance del proyecto según calendario" />
          </div>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            <Row label="Inicio" value={formatDate(project.startDate)} />
            <Row label="Fin estimado" value={formatDate(project.endDate)} />
            <Row label="Tipo" value={project.projectType === 'TurnKey' ? 'Llave en mano' : 'Por porcentaje'} />
            <Row label="Horas trabajadas" value={project.totalWorkedHours.toLocaleString('es-CR')} />
            <Row label="Trabajadores que han participado" value={String(project.workersUsedCount)} />
            <Row label="Materiales usados" value={String(project.materialsUsedCount)} />
          </dl>
          <div className="flex flex-wrap gap-2 border-t pt-4">
            <Button variant="outline" render={<Link to={`/ofertas/${project.offerId}`} />}>
              Ver oferta
            </Button>
            <Button variant="outline" render={<Link to={`/presupuestos/${project.budgetId}`} />}>
              Ver presupuesto
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 sm:block">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function ProjectWorkers({ project }: { project: Project }) {
  const workersQuery = useQuery(catalogQueries.workers)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Trabajador</TableHead>
          <TableHead>Asignado desde</TableHead>
          <TableHead className="text-right">Tarifa por hora</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {project.workers.map((assignment) => {
          const worker = workersQuery.data?.find((w) => w.id === assignment.workerId)
          return (
            <TableRow key={assignment.id}>
              <TableCell>{worker?.name ?? `#${assignment.workerId}`}</TableCell>
              <TableCell>{formatDate(assignment.assignedAt)}</TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {worker ? formatCRC(worker.hourlyRate) : '—'}
              </TableCell>
              <TableCell>
                <Badge variant={assignment.isActive ? 'default' : 'secondary'}>
                  {assignment.isActive ? 'Activo' : 'Retirado'}
                </Badge>
              </TableCell>
            </TableRow>
          )
        })}
        {project.workers.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground">
              No hay trabajadores asignados.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
