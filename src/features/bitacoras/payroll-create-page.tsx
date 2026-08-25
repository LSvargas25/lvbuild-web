import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { createPayroll } from '@/lib/api/payroll'
import { getSiteLog, getWorkers } from '@/lib/api/sitelogs'
import type { PaymentMethod } from '@/types/payroll'

interface DetailRow {
  workerId: number
  workerName: string
  hoursWorked: number
  hourlyRate: number
  paymentMethod: PaymentMethod
}

export function PayrollCreatePage() {
  const { siteLogId } = useParams()
  const navigate = useNavigate()
  const siteLogQuery = useQuery({
    queryKey: ['site-log', Number(siteLogId)],
    queryFn: () => getSiteLog(Number(siteLogId)),
  })
  const workersQuery = useQuery({ queryKey: ['workers'], queryFn: getWorkers })

  const [rows, setRows] = useState<DetailRow[] | null>(null)

  useEffect(() => {
    if (rows === null && siteLogQuery.data && workersQuery.data) {
      setRows(
        siteLogQuery.data.workers.map((w) => {
          const worker = workersQuery.data!.find((wk) => wk.id === w.workerId)
          return {
            workerId: w.workerId,
            workerName: worker?.name ?? `#${w.workerId}`,
            hoursWorked: w.hoursWorked,
            hourlyRate: worker?.hourlyRate ?? 0,
            paymentMethod: 'Cash' as PaymentMethod,
          }
        }),
      )
    }
  }, [rows, siteLogQuery.data, workersQuery.data])

  const mutation = useMutation({
    mutationFn: createPayroll,
    onSuccess: (payroll) => {
      toast.success('Planilla creada')
      navigate(`/planillas/${payroll.id}`)
    },
    onError: () => toast.error('No se pudo crear la planilla.'),
  })

  if (siteLogQuery.isLoading || !rows) return <p className="text-muted-foreground">Cargando…</p>

  function updateRow(index: number, patch: Partial<DetailRow>) {
    setRows((prev) => prev!.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  const total = rows.reduce((sum, r) => sum + r.hoursWorked * r.hourlyRate, 0)

  function handleSubmit() {
    if (!rows || rows.length === 0) {
      toast.error('La bitácora no tiene trabajadores registrados.')
      return
    }
    createPayrollMutate()
  }

  function createPayrollMutate() {
    const details = rows!.map((r) => {
      const amount = r.hoursWorked * r.hourlyRate
      return {
        workerId: r.workerId,
        date: siteLogQuery.data!.weekEnd,
        hoursWorked: r.hoursWorked,
        hourlyRate: r.hourlyRate,
        paymentType: 'Full' as const,
        payments: [{ paymentMethod: r.paymentMethod, amount }],
      }
    })

    mutation.mutate({ siteLogId: Number(siteLogId), details })
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Nueva planilla — bitácora #{siteLogId}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trabajador</TableHead>
                <TableHead className="text-right">Horas</TableHead>
                <TableHead className="text-right">Tarifa/h</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={row.workerId}>
                  <TableCell>{row.workerName}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.hoursWorked}</TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      className="w-24 text-right"
                      value={row.hourlyRate}
                      onChange={(e) => updateRow(i, { hourlyRate: Number(e.target.value) })}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={row.paymentMethod}
                      onValueChange={(v) => updateRow(i, { paymentMethod: v as PaymentMethod })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue>
                          {(v: PaymentMethod) => (v === 'Cash' ? 'Efectivo' : 'Transferencia')}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Efectivo</SelectItem>
                        <SelectItem value="Transfer">Transferencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    ₡{(row.hoursWorked * row.hourlyRate).toLocaleString('es-CR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-between border-t pt-3 font-semibold">
            <span>Total planilla</span>
            <span className="font-mono tabular-nums">₡{total.toLocaleString('es-CR')}</span>
          </div>

          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Creando…' : 'Crear planilla'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
