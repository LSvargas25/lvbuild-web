import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getProject } from '@/lib/api/projects'
import type { ProjectStatus } from '@/types/projects'

const STATUS_LABEL: Record<ProjectStatus, string> = {
  Active: 'Activo',
  Finished: 'Finalizado',
  Suspended: 'Suspendido',
}

export function ProjectDetailPage() {
  const { id } = useParams()
  const projectQuery = useQuery({
    queryKey: ['project', Number(id)],
    queryFn: () => getProject(Number(id)),
  })

  if (projectQuery.isLoading) return <p className="text-muted-foreground">Cargando…</p>
  const project = projectQuery.data
  if (!project) return <p className="text-destructive">No se encontró el proyecto.</p>

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Proyecto #{project.id}</CardTitle>
          <Badge>{STATUS_LABEL[project.status]}</Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Inicio</span>
            <span>{new Date(project.startDate).toLocaleDateString('es-CR')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fin estimado</span>
            <span>{new Date(project.endDate).toLocaleDateString('es-CR')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Semanas transcurridas</span>
            <span>{project.weeksCounter}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gastos directos actuales</span>
            <span className="font-mono tabular-nums">
              ₡{project.currentDirectExpenses.toLocaleString('es-CR')}
            </span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Utilidad actual</span>
            <span className="font-mono tabular-nums">
              ₡{project.currentProfit.toLocaleString('es-CR')}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
