import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/features/auth/auth-context'
import { getPayroll, markPayrollPaid } from '@/lib/api/payroll'
import { getWorkers } from '@/lib/api/sitelogs'

export function PayrollDetailPage() {
  const { id } = useParams()
  const payrollId = Number(id)
  const { session } = useAuth()
  const queryClient = useQueryClient()

  const payrollQuery = useQuery({
    queryKey: ['payroll', payrollId],
    queryFn: () => getPayroll(payrollId),
  })
  const workersQuery = useQuery({ queryKey: ['workers'], queryFn: getWorkers })

  const markPaidMutation = useMutation({
    mutationFn: () => markPayrollPaid(payrollId),
    onSuccess: () => {
      toast.success('Planilla marcada como pagada')
      queryClient.invalidateQueries({ queryKey: ['payroll', payrollId] })
    },
    onError: () => toast.error('No se pudo marcar como pagada.'),
  })

  if (payrollQuery.isLoading) return <p className="text-muted-foreground">Cargando…</p>
  const payroll = payrollQuery.data
  if (!payroll) return <p className="text-destructive">No se encontró la planilla.</p>

  const canDecide = session?.roles.some((r) => r === 'GeneralManager' || r === 'OperationsDirector')

  function workerName(workerId: number) {
    return workersQuery.data?.find((w) => w.id === workerId)?.name ?? `#${workerId}`
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Planilla #{payroll.id}</CardTitle>
          <Badge variant={payroll.status === 'Paid' ? 'default' : 'secondary'}>
            {payroll.status === 'Paid' ? 'Pagada' : 'Pendiente'}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trabajador</TableHead>
                <TableHead className="text-right">Horas</TableHead>
                <TableHead className="text-right">Tarifa/h</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payroll.details.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{workerName(d.workerId)}</TableCell>
                  <TableCell className="text-right tabular-nums">{d.hoursWorked}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    ₡{d.hourlyRate.toLocaleString('es-CR')}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    ₡{d.finalAmountToPay.toLocaleString('es-CR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-between border-t pt-3 font-semibold">
            <span>Total planilla</span>
            <span className="font-mono tabular-nums">
              ₡{payroll.totalPayroll.toLocaleString('es-CR')}
            </span>
          </div>

          {payroll.status === 'Pending' && canDecide && (
            <Button
              onClick={() => markPaidMutation.mutate()}
              disabled={markPaidMutation.isPending}
              className="w-fit"
            >
              Marcar como pagada
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
