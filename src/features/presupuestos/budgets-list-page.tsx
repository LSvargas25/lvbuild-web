import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ErrorState, LoadingState } from '@/components/page-state'
import { Pagination } from '@/components/pagination'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/features/auth/auth-context'
import { STATUS_LABEL, STATUS_VARIANT } from '@/features/presupuestos/budget-status'
import { getBudgets } from '@/lib/api/budgets'
import { catalogQueries, nameOf } from '@/lib/api/catalogs'
import { formatCRC } from '@/lib/format'
import type { BudgetStatus } from '@/types/budgets'

const ALL = 'all'
const STATUSES = Object.keys(STATUS_LABEL) as BudgetStatus[]

export function BudgetsListPage() {
  const { hasRole } = useAuth()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<BudgetStatus | typeof ALL>(ALL)

  const budgetsQuery = useQuery({
    queryKey: ['budgets', page, status],
    queryFn: () => getBudgets(page, status === ALL ? undefined : status),
    placeholderData: keepPreviousData,
  })
  const customersQuery = useQuery(catalogQueries.customers)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Presupuestos"
        actions={
          hasRole('ProjectAdmin') && (
            <Button render={<Link to="/presupuestos/nuevo" />}>Nuevo presupuesto</Button>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="budget-status-filter" className="text-sm text-muted-foreground">
          Estado
        </label>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as BudgetStatus | typeof ALL)
            setPage(1)
          }}
        >
          <SelectTrigger id="budget-status-filter" className="w-52">
            <SelectValue>
              {(value: string) => (value === ALL ? 'Todos' : STATUS_LABEL[value as BudgetStatus])}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {budgetsQuery.isPending ? (
        <LoadingState />
      ) : budgetsQuery.isError ? (
        <ErrorState error={budgetsQuery.error} />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgetsQuery.data.items.map((budget) => (
                <TableRow key={budget.id}>
                  <TableCell>
                    <Link
                      to={`/presupuestos/${budget.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {budget.name}
                    </Link>
                  </TableCell>
                  <TableCell>{nameOf(customersQuery.data, budget.customerId)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[budget.status]}>
                      {STATUS_LABEL[budget.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatCRC(budget.totalBudget)}
                  </TableCell>
                </TableRow>
              ))}
              {budgetsQuery.data.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No hay presupuestos{status === ALL ? ' todavía' : ' en este estado'}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Pagination page={budgetsQuery.data} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
