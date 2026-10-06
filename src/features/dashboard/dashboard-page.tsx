import { useQueries, useQuery } from '@tanstack/react-query'
import {
  Building2,
  ClipboardList,
  FilePlus2,
  HardHat,
  Receipt,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ButtonLink } from '@/components/button-link'
import { PageHeader } from '@/components/page-header'
import { ErrorState, LoadingState } from '@/components/page-state'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth/auth-context'
import { STATUS_LABEL } from '@/features/presupuestos/budget-status'
import { ProgressBar } from '@/features/proyectos/progress-bar'
import { timeProgress } from '@/features/proyectos/project-metrics'
import { projectName } from '@/features/proyectos/project-name'
import { getBudgets } from '@/lib/api/budgets'
import { catalogQueries, nameOf } from '@/lib/api/catalogs'
import { getInvoicesByBranch } from '@/lib/api/commercial'
import { getProjects } from '@/lib/api/projects'
import { formatDate, localDateOf, todayLocalISO } from '@/lib/dates'
import { formatCRC } from '@/lib/format'
import { COMMERCIAL_ROLES } from '@/routes/route-roles'
import { ROLE_LABELS, type Role } from '@/types/roles'

interface QuickLink {
  to: string
  label: string
  icon: LucideIcon
  roles?: Role[]
}

const QUICK_LINKS: QuickLink[] = [
  { to: '/presupuestos/nuevo', label: 'Nuevo presupuesto', icon: FilePlus2, roles: ['ProjectAdmin'] },
  { to: '/presupuestos', label: 'Presupuestos', icon: ClipboardList },
  { to: '/proyectos', label: 'Proyectos', icon: HardHat },
  {
    to: '/comercial/caja',
    label: 'Caja registradora',
    icon: Wallet,
    roles: COMMERCIAL_ROLES,
  },
  {
    to: '/comercial/facturas/nueva',
    label: 'Nueva factura',
    icon: Receipt,
    roles: COMMERCIAL_ROLES,
  },
]

// Tamaño de página usado para resumir: alcanza para la empresa demo y evita recorrer todo.
const SUMMARY_PAGE_SIZE = 100

export function DashboardPage() {
  const { session, hasRole } = useAuth()
  const firstName = session?.name.split(' ')[0] ?? ''
  const links = QUICK_LINKS.filter((link) => !link.roles || hasRole(...link.roles))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Hola, ${firstName}`}
        description={session?.roles.map((role) => ROLE_LABELS[role]).join(' · ')}
      />

      <nav aria-label="Accesos rápidos" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {links.map(({ to, label, icon: Icon }) => (
          <ButtonLink key={to} variant="outline" className="h-auto justify-start gap-2 py-3" to={to}>
            <Icon aria-hidden="true" />
            {label}
          </ButtonLink>
        ))}
      </nav>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ActiveProjectsCard />
        <PendingBudgetsCard />
        <MonthlyBillingCard />
      </div>
    </div>
  )
}

function ActiveProjectsCard() {
  const projectsQuery = useQuery({
    queryKey: ['projects', 'dashboard'],
    queryFn: () => getProjects(1, SUMMARY_PAGE_SIZE),
  })
  const customersQuery = useQuery(catalogQueries.customers)
  const active = projectsQuery.data?.items.filter((p) => p.status === 'Active') ?? []
  const shown = active.slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardHat className="size-4" aria-hidden="true" /> Proyectos activos
        </CardTitle>
        <CardDescription>
          {projectsQuery.data ? `${active.length} en ejecución` : 'Avance según calendario'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {projectsQuery.isPending ? (
          <LoadingState />
        ) : projectsQuery.isError ? (
          <ErrorState error={projectsQuery.error} />
        ) : shown.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay proyectos activos.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {shown.map((project) => (
              <li key={project.id} className="flex flex-col gap-1">
                <div className="flex flex-wrap justify-between gap-2 text-sm">
                  <Link to={`/proyectos/${project.id}`} className="font-medium text-primary hover:underline">
                    {projectName(project)}
                  </Link>
                  <span className="text-muted-foreground">{nameOf(customersQuery.data, project.customerId)}</span>
                </div>
                <ProgressBar
                  value={timeProgress(project.startDate, project.endDate)}
                  label={`Avance de ${projectName(project)}`}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function PendingBudgetsCard() {
  const reviewQuery = useQuery({
    queryKey: ['budgets', 'dashboard', 'Review'],
    queryFn: () => getBudgets(1, 'Review', 5),
  })
  const correctionQuery = useQuery({
    queryKey: ['budgets', 'dashboard', 'Correction'],
    queryFn: () => getBudgets(1, 'Correction', 5),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="size-4" aria-hidden="true" /> Presupuestos pendientes
        </CardTitle>
        <CardDescription>
          {reviewQuery.data && correctionQuery.data
            ? `${reviewQuery.data.totalCount} en revisión · ${correctionQuery.data.totalCount} en corrección`
            : 'En revisión o corrección'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {reviewQuery.isPending || correctionQuery.isPending ? (
          <LoadingState />
        ) : reviewQuery.isError || correctionQuery.isError ? (
          <ErrorState error={reviewQuery.error ?? correctionQuery.error} />
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {[...reviewQuery.data.items, ...correctionQuery.data.items].map((budget) => (
              <li key={budget.id} className="flex flex-wrap justify-between gap-2">
                <Link to={`/presupuestos/${budget.id}`} className="font-medium text-primary hover:underline">
                  {budget.name}
                </Link>
                <span className="text-muted-foreground">
                  {STATUS_LABEL[budget.status]} · {formatCRC(budget.totalBudget)}
                </span>
              </li>
            ))}
            {reviewQuery.data.totalCount + correctionQuery.data.totalCount === 0 && (
              <li className="text-muted-foreground">Nada pendiente de aprobación.</li>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function MonthlyBillingCard() {
  const branchesQuery = useQuery(catalogQueries.branches)
  const branches = branchesQuery.data ?? []
  const invoiceQueries = useQueries({
    queries: branches.map((branch) => ({
      queryKey: ['invoices', String(branch.id), 'dashboard'],
      queryFn: () => getInvoicesByBranch(branch.id, 1, SUMMARY_PAGE_SIZE),
    })),
  })

  const month = todayLocalISO().slice(0, 7)
  const loading = branchesQuery.isPending || invoiceQueries.some((q) => q.isPending)
  const error = branchesQuery.error ?? invoiceQueries.find((q) => q.error)?.error

  const perBranch = branches.map((branch, i) => {
    const issued = (invoiceQueries[i]?.data?.items ?? []).filter(
      (inv) => inv.status === 'Issued' && localDateOf(inv.date).startsWith(month),
    )
    return {
      branch,
      count: issued.length,
      total: issued.reduce((s, inv) => s + inv.total, 0),
      collected: issued.reduce((s, inv) => s + inv.totalPaid, 0),
    }
  })
  const total = perBranch.reduce((s, b) => s + b.total, 0)
  const collected = perBranch.reduce((s, b) => s + b.collected, 0)

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="size-4" aria-hidden="true" /> Facturación del mes
        </CardTitle>
        <CardDescription>
          Facturas emitidas desde el {formatDate(`${month}-01`)} · cobrado {formatCRC(collected)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="font-mono text-3xl tabular-nums">{formatCRC(total)}</p>
            <ul className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              {perBranch.map(({ branch, count, total: branchTotal }) => (
                <li key={branch.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                  <span className="flex items-center gap-2">
                    <Building2 className="size-4 text-muted-foreground" aria-hidden="true" />
                    {branch.name}
                  </span>
                  <span className="text-right">
                    <span className="block font-mono tabular-nums">{formatCRC(branchTotal)}</span>
                    <span className="text-xs text-muted-foreground">{count} factura(s)</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
