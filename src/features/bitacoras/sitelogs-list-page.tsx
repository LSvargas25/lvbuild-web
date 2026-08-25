import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getSiteLogsByProject } from '@/lib/api/sitelogs'
import type { SiteLogStatus } from '@/types/sitelogs'

const STATUS_LABEL: Record<SiteLogStatus, string> = {
  Draft: 'Borrador',
  Review: 'En revisión',
  Approved: 'Aprobada',
}

export function SiteLogsListPage() {
  const { projectId } = useParams()
  const siteLogsQuery = useQuery({
    queryKey: ['site-logs', Number(projectId)],
    queryFn: () => getSiteLogsByProject(Number(projectId)),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Bitácoras — Proyecto #{projectId}</h1>
        <Button render={<Link to={`/proyectos/${projectId}/bitacoras/nueva`} />}>
          + Nueva bitácora
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Semana</TableHead>
            <TableHead>Tarea</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {siteLogsQuery.data?.items.map((log) => (
            <TableRow key={log.id}>
              <TableCell>
                <Link
                  to={`/bitacoras/${log.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {new Date(log.weekStart).toLocaleDateString('es-CR')} –{' '}
                  {new Date(log.weekEnd).toLocaleDateString('es-CR')}
                </Link>
              </TableCell>
              <TableCell>{log.taskDescription}</TableCell>
              <TableCell>
                <Badge variant={log.status === 'Approved' ? 'default' : 'secondary'}>
                  {STATUS_LABEL[log.status]}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {siteLogsQuery.data?.items.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                No hay bitácoras todavía.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
