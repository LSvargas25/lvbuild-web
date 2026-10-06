import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { ButtonLink } from '@/components/button-link'
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
import { useAuth } from '@/features/auth/auth-context'
import { getPayrollsByProject } from '@/lib/api/payroll'
import { getSiteLogsByProject } from '@/lib/api/sitelogs'
import { formatDate } from '@/lib/dates'
import { formatCRC } from '@/lib/format'
import { PAYROLL_STATUS, SITE_LOG_STATUS } from '@/lib/status-labels'
import type { Payroll } from '@/types/payroll'

// Las planillas de un proyecto son una por semana: una página grande cubre el proyecto entero.
const PAYROLLS_PAGE_SIZE = 100

/** Bitácoras semanales de un proyecto (pestaña del detalle de proyecto). */
export function ProjectSiteLogs({ projectId, canCreate }: { projectId: number; canCreate: boolean }) {
  const { hasRole } = useAuth()
  const [page, setPage] = useState(1)
  const siteLogsQuery = useQuery({
    queryKey: ['site-logs', projectId, page],
    queryFn: () => getSiteLogsByProject(projectId, page),
    placeholderData: keepPreviousData,
  })
  // SiteLog.totalPayroll solo se llena al pagar la planilla; el monto y el estado reales vienen
  // de la planilla asociada a cada bitácora.
  const payrollsQuery = useQuery({
    queryKey: ['payrolls', projectId, 'by-site-log'],
    queryFn: () => getPayrollsByProject(projectId, 1, PAYROLLS_PAGE_SIZE),
  })
  const payrollBySiteLog = new Map(
    (payrollsQuery.data?.items ?? []).map((payroll) => [payroll.siteLogId, payroll]),
  )

  return (
    <div className="flex flex-col gap-3">
      {canCreate && hasRole('ProjectAdmin') && (
        <ButtonLink className="w-fit" to={`/proyectos/${projectId}/bitacoras/nueva`}>
          Nueva bitácora
        </ButtonLink>
      )}
      {siteLogsQuery.isPending ? (
        <LoadingState />
      ) : siteLogsQuery.isError ? (
        <ErrorState error={siteLogsQuery.error} />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Semana</TableHead>
                <TableHead>Trabajo realizado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Planilla</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {siteLogsQuery.data.items.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    <Link to={`/bitacoras/${log.id}`} className="font-medium text-primary hover:underline">
                      {formatDate(log.weekStart)} – {formatDate(log.weekEnd)}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-80 truncate">{log.taskDescription}</TableCell>
                  <TableCell>
                    <Badge variant={SITE_LOG_STATUS[log.status].variant}>
                      {SITE_LOG_STATUS[log.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <PayrollCell
                      payroll={payrollBySiteLog.get(log.id)}
                      loading={payrollsQuery.isPending}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {siteLogsQuery.data.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Este proyecto todavía no tiene bitácoras.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Pagination page={siteLogsQuery.data} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}

function PayrollCell({ payroll, loading }: { payroll?: Payroll; loading: boolean }) {
  if (loading) return <span className="text-muted-foreground">…</span>
  if (!payroll) return <span className="text-sm text-muted-foreground">Sin planilla</span>
  return (
    <Link
      to={`/planillas/${payroll.id}`}
      className="inline-flex items-center justify-end gap-2 hover:underline"
    >
      <span className="font-mono tabular-nums">{formatCRC(payroll.totalPayroll)}</span>
      <Badge variant={PAYROLL_STATUS[payroll.status].variant}>
        {PAYROLL_STATUS[payroll.status].label}
      </Badge>
    </Link>
  )
}
