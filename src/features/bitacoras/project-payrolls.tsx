import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
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
import { getPayrollsByProject } from '@/lib/api/payroll'
import { formatDate } from '@/lib/dates'
import { formatCRC } from '@/lib/format'
import { PAYROLL_STATUS } from '@/lib/status-labels'

/** Planillas de un proyecto (pestaña del detalle de proyecto). */
export function ProjectPayrolls({ projectId }: { projectId: number }) {
  const [page, setPage] = useState(1)
  const payrollsQuery = useQuery({
    queryKey: ['payrolls', projectId, page],
    queryFn: () => getPayrollsByProject(projectId, page),
    placeholderData: keepPreviousData,
  })

  if (payrollsQuery.isPending) return <LoadingState />
  if (payrollsQuery.isError) return <ErrorState error={payrollsQuery.error} />

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Semana</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Pagada</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payrollsQuery.data.items.map((payroll) => (
            <TableRow key={payroll.id}>
              <TableCell className="whitespace-nowrap">
                <Link to={`/planillas/${payroll.id}`} className="font-medium text-primary hover:underline">
                  {formatDate(payroll.weekStart)} – {formatDate(payroll.weekEnd)}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant={PAYROLL_STATUS[payroll.status].variant}>
                  {PAYROLL_STATUS[payroll.status].label}
                </Badge>
              </TableCell>
              <TableCell>{payroll.paidAt ? formatDate(payroll.paidAt) : '—'}</TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatCRC(payroll.totalPayroll)}
              </TableCell>
            </TableRow>
          ))}
          {payrollsQuery.data.items.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                Todavía no hay planillas. Se crean desde una bitácora aprobada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination page={payrollsQuery.data} onPageChange={setPage} />
    </div>
  )
}
