import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createSiteLog, getWorkers } from '@/lib/api/sitelogs'

function mondayOfThisWeek() {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

function addDays(iso: string, days: number) {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

interface WorkerRow {
  workerId: string
  hoursWorked: number
}

export function SiteLogCreatePage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const workersQuery = useQuery({ queryKey: ['workers'], queryFn: getWorkers })

  const [weekStart, setWeekStart] = useState(mondayOfThisWeek())
  const [taskDescription, setTaskDescription] = useState('')
  const [pendingTasks, setPendingTasks] = useState('')
  const [rows, setRows] = useState<WorkerRow[]>([{ workerId: '', hoursWorked: 40 }])

  const weekEnd = addDays(weekStart, 6)

  const mutation = useMutation({
    mutationFn: createSiteLog,
    onSuccess: (log) => {
      toast.success('Bitácora creada como borrador')
      navigate(`/bitacoras/${log.id}`)
    },
    onError: () => toast.error('No se pudo crear la bitácora.'),
  })

  function updateRow(index: number, patch: Partial<WorkerRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  function addRow() {
    setRows((prev) => [...prev, { workerId: '', hoursWorked: 40 }])
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit() {
    if (!taskDescription) {
      toast.error('Describí el trabajo realizado.')
      return
    }
    const workers = rows
      .filter((r) => r.workerId)
      .map((r) => ({ workerId: Number(r.workerId), hoursWorked: r.hoursWorked }))

    mutation.mutate({
      projectId: Number(projectId),
      weekStart,
      weekEnd,
      taskDescription,
      pendingTasks: pendingTasks || null,
      workers,
    })
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Nueva bitácora semanal</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Inicio de semana</Label>
              <Input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Fin de semana</Label>
              <Input type="date" value={weekEnd} disabled />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label>Trabajo realizado</Label>
              <Input
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label>Pendientes (opcional)</Label>
              <Input value={pendingTasks} onChange={(e) => setPendingTasks(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t pt-4">
            <Label>Trabajadores</Label>
            {rows.map((row, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1">
                  <Select
                    value={row.workerId || undefined}
                    onValueChange={(v) => updateRow(i, { workerId: v ?? '' })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Elegí un trabajador">
                        {(value: string | null) =>
                          workersQuery.data?.find((w) => String(w.id) === value)?.name ??
                          'Elegí un trabajador'
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {workersQuery.data?.map((w) => (
                        <SelectItem key={w.id} value={String(w.id)}>
                          {w.name} (₡{w.hourlyRate.toLocaleString('es-CR')}/h)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  type="number"
                  className="w-28"
                  value={row.hoursWorked}
                  onChange={(e) => updateRow(i, { hoursWorked: Number(e.target.value) })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRow(i)}
                  disabled={rows.length === 1}
                >
                  Quitar
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addRow}>
              + Agregar trabajador
            </Button>
          </div>

          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Creando…' : 'Crear bitácora (borrador)'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
