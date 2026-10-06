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
import { getSiteLogsByProject } from '@/lib/api/sitelogs'
import { formatDate } from '@/lib/dates'
import { formatCRC } from '@/lib/format'
import { SITE_LOG_STATUS } from '@/lib/status-labels'

/** Bitácoras semanales de un proyecto (pestaña del detalle de proyecto). */
export function ProjectSiteLogs({ projectId, canCreate }: { projectId: number; canCreate: boolean }) {
  const { hasRole } = useAuth()
  const [page, setPage] = useState(1)
  const siteLogsQuery = useQuery({
    queryKey: ['site-logs', projectId, page],
    queryFn: () => getSiteLogsByProject(projectId, page),
    placeholderData: keepPreviousData,
  })

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
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatCRC(log.totalPayroll)}
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
