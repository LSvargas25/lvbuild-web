import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { ErrorState, LoadingState } from '@/components/page-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/features/auth/auth-context'
import { catalogQueries, nameOf } from '@/lib/api/catalogs'
import { getErrorMessage } from '@/lib/api/errors'
import { getPayroll, markPayrollPaid } from '@/lib/api/payroll'
import { formatDate, formatDateTime } from '@/lib/dates'
import { formatCRC } from '@/lib/format'
import { PAYROLL_PAYMENT_METHOD_LABEL, PAYROLL_STATUS } from '@/lib/status-labels'
import { MANAGEMENT_ROLES } from '@/types/roles'

export function PayrollDetailPage() {
  const { id } = useParams()
  const payrollId = Number(id)
  const { hasRole } = useAuth()
  const queryClient = useQueryClient()

  const payrollQuery = useQuery({
    queryKey: ['payroll', payrollId],
    queryFn: () => getPayroll(payrollId),
  })
  const workersQuery = useQuery(catalogQueries.workers)

  const markPaidMutation = useMutation({
    mutationFn: () => markPayrollPaid(payrollId),
    onSuccess: () => {
      toast.success('Planilla marcada como pagada')
      queryClient.invalidateQueries({ queryKey: ['payroll', payrollId] })
      queryClient.invalidateQueries({ queryKey: ['payrolls'] })
    },
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudo marcar como pagada.')),
  })

  if (payrollQuery.isPending) return <LoadingState />
  if (payrollQuery.isError) {
    return <ErrorState error={payrollQuery.error} fallback="No se encontró la planilla." />
  }

  const payroll = payrollQuery.data
  const status = PAYROLL_STATUS[payroll.status]

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <PageHeader
        title={`Planilla #${payroll.id}`}
        description={`Semana del ${formatDate(payroll.weekStart)} al ${formatDate(payroll.weekEnd)}${
          payroll.paidAt ? ` · pagada el ${formatDateTime(payroll.paidAt)}` : ''
        }`}
        actions={<Badge variant={status.variant}>{status.label}</Badge>}
      />
      <Card>
        <CardContent className="flex flex-col gap-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trabajador</TableHead>
                <TableHead className="text-right">Horas</TableHead>
                <TableHead className="text-right">Tarifa por hora</TableHead>
                <TableHead>Forma de pago</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payroll.details.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{nameOf(workersQuery.data, d.workerId)}</TableCell>
                  <TableCell className="text-right tabular-nums">{d.hoursWorked}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatCRC(d.hourlyRate)}
                  </TableCell>
                  <TableCell>
                    {d.payments.map((p) => PAYROLL_PAYMENT_METHOD_LABEL[p.paymentMethod]).join(', ')}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatCRC(d.finalAmountToPay)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-between border-t pt-3 font-semibold">
            <span>Total planilla</span>
            <span className="font-mono tabular-nums">{formatCRC(payroll.totalPayroll)}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {payroll.status === 'Pending' && hasRole(...MANAGEMENT_ROLES) && (
              <Button onClick={() => markPaidMutation.mutate()} disabled={markPaidMutation.isPending}>
                Marcar como pagada
              </Button>
            )}
            <Button
              variant="outline"
              render={<Link to={`/proyectos/${payroll.projectId}?tab=planillas`} />}
            >
              Volver al proyecto
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
