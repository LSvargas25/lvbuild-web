import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/page-header'
import { ErrorState, LoadingState } from '@/components/page-state'
import { Pagination } from '@/components/pagination'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ProgressBar } from '@/features/proyectos/progress-bar'
import { budgetUsage, timeProgress, usageTone } from '@/features/proyectos/project-metrics'
import { projectName } from '@/features/proyectos/project-name'
import { getBudget } from '@/lib/api/budgets'
import { catalogQueries, nameOf } from '@/lib/api/catalogs'
import { getProjects } from '@/lib/api/projects'
import { formatDate } from '@/lib/dates'
import { formatCRC, formatPercent } from '@/lib/format'
import { PROJECT_STATUS } from '@/lib/status-labels'
import { cn } from '@/lib/utils'

const TONE_CLASS = {
  ok: 'text-foreground',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-destructive',
  muted: 'text-muted-foreground',
} as const

export function ProjectsListPage() {
  const [page, setPage] = useState(1)
  const projectsQuery = useQuery({
    queryKey: ['projects', page],
    queryFn: () => getProjects(page),
    placeholderData: keepPreviousData,
  })
  const customersQuery = useQuery(catalogQueries.customers)

  // Total presupuestado de cada proyecto de la página (los presupuestos se cachean por id).
  const projects = projectsQuery.data?.items ?? []
  const budgetQueries = useQueries({
    queries: projects.map((project) => ({
      queryKey: ['budget', project.budgetId],
      queryFn: () => getBudget(project.budgetId),
      staleTime: 5 * 60_000,
    })),
  })

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Proyectos"
        description="Los proyectos se crean desde una oferta aceptada por el cliente."
      />
      {projectsQuery.isPending ? (
        <LoadingState />
      ) : projectsQuery.isError ? (
        <ErrorState error={projectsQuery.error} />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proyecto</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="min-w-40">Avance (tiempo)</TableHead>
                <TableHead className="text-right">Gasto / presupuesto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project, index) => {
                const budget = budgetQueries[index]?.data
                const progress = timeProgress(project.startDate, project.endDate)
                const usage = budgetUsage(project.currentDirectExpenses, budget?.totalBudget)
                const status = PROJECT_STATUS[project.status]
                return (
                  <TableRow key={project.id}>
                    <TableCell>
                      <Link
                        to={`/proyectos/${project.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {projectName(project, budget?.name)}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(project.startDate)} – {formatDate(project.endDate)}
                      </div>
                    </TableCell>
                    <TableCell>{nameOf(customersQuery.data, project.customerId)}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <ProgressBar value={progress} label={`Avance del proyecto ${project.id}`} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-mono tabular-nums">
                        {formatCRC(project.currentDirectExpenses)}
                      </div>
                      <div className={cn('text-xs', TONE_CLASS[usageTone(usage, progress)])}>
                        {budget ? `${formatPercent(usage)} de ${formatCRC(budget.totalBudget)}` : '…'}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {projects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Todavía no hay proyectos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Pagination page={projectsQuery.data} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
