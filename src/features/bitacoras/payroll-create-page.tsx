import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { PageHeader } from '@/components/page-header'
import { ErrorState, LoadingState } from '@/components/page-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { catalogQueries, nameOf } from '@/lib/api/catalogs'
import { getErrorMessage } from '@/lib/api/errors'
import { createPayroll } from '@/lib/api/payroll'
import { getSiteLog } from '@/lib/api/sitelogs'
import { formatDate, toISODate } from '@/lib/dates'
import { formatCRC } from '@/lib/format'
import { PAYROLL_PAYMENT_METHOD_LABEL } from '@/lib/status-labels'
import { money } from '@/lib/validation'
import type { CreatePayrollRequest, PaymentMethod } from '@/types/payroll'
import type { SiteLog, Worker } from '@/types/sitelogs'

const payrollSchema = z.object({
  rows: z.array(
    z.object({
      workerId: z.number(),
      hoursWorked: z.number(),
      hourlyRate: money(),
      paymentMethod: z.enum(['Cash', 'Transfer']),
    }),
  ),
})

type PayrollFormValues = z.infer<typeof payrollSchema>

export function PayrollCreatePage() {
  const { siteLogId } = useParams()
  const siteLogQuery = useQuery({
    queryKey: ['site-log', Number(siteLogId)],
    queryFn: () => getSiteLog(Number(siteLogId)),
  })
  const workersQuery = useQuery(catalogQueries.workers)

  if (siteLogQuery.isPending || workersQuery.isPending) return <LoadingState />
  if (siteLogQuery.isError) {
    return <ErrorState error={siteLogQuery.error} fallback="No se encontró la bitácora." />
  }
  if (workersQuery.isError) return <ErrorState error={workersQuery.error} />
  if (siteLogQuery.data.status !== 'Approved') {
    return (
      <ErrorState
        error={null}
        fallback="Solo se puede crear la planilla de una bitácora aprobada."
        backTo={{ to: `/bitacoras/${siteLogId}`, label: 'Volver a la bitácora' }}
      />
    )
  }

  return <PayrollForm siteLog={siteLogQuery.data} workers={workersQuery.data} />
}

function PayrollForm({ siteLog, workers }: { siteLog: SiteLog; workers: Worker[] }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PayrollFormValues>({
    resolver: zodResolver(payrollSchema),
    defaultValues: {
      rows: siteLog.workers.map((w) => ({
        workerId: w.workerId,
        hoursWorked: w.hoursWorked,
        hourlyRate: workers.find((wk) => wk.id === w.workerId)?.hourlyRate ?? 0,
        paymentMethod: 'Cash' as PaymentMethod,
      })),
    },
  })
  const { fields } = useFieldArray({ control, name: 'rows' })
  const rows = useWatch({ control, name: 'rows' })
  const total = (rows ?? []).reduce((sum, r) => sum + r.hoursWorked * (Number(r.hourlyRate) || 0), 0)

  const mutation = useMutation({
    mutationFn: (values: PayrollFormValues) => {
      const request: CreatePayrollRequest = {
        siteLogId: siteLog.id,
        chapterId: siteLog.chapterId,
        details: values.rows.map((r) => {
          const amount = r.hoursWorked * r.hourlyRate
          return {
            workerId: r.workerId,
            date: toISODate(siteLog.weekEnd),
            hoursWorked: r.hoursWorked,
            hourlyRate: r.hourlyRate,
            paymentType: 'Full',
            payments: [{ paymentMethod: r.paymentMethod, amount }],
          }
        }),
      }
      return createPayroll(request)
    },
    onSuccess: (payroll) => {
      toast.success('Planilla creada')
      queryClient.invalidateQueries({ queryKey: ['payrolls', siteLog.projectId] })
      navigate(`/planillas/${payroll.id}`)
    },
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudo crear la planilla.')),
  })

  if (fields.length === 0) {
    return <ErrorState error={null} fallback="La bitácora no tiene trabajadores registrados." />
  }

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <PageHeader
        title="Nueva planilla"
        description={`Semana del ${formatDate(siteLog.weekStart)} al ${formatDate(siteLog.weekEnd)}`}
      />
      <Card>
        <CardContent>
          <form
            noValidate
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            className="flex flex-col gap-4"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trabajador</TableHead>
                  <TableHead className="text-right">Horas</TableHead>
                  <TableHead className="text-right">Tarifa por hora (₡)</TableHead>
                  <TableHead>Forma de pago</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, i) => {
                  const name = nameOf(workers, field.workerId)
                  const rateError = errors.rows?.[i]?.hourlyRate?.message
                  const row = rows?.[i]
                  return (
                    <TableRow key={field.id}>
                      <TableCell>{name}</TableCell>
                      <TableCell className="text-right tabular-nums">{field.hoursWorked}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          inputMode="decimal"
                          className="ml-auto w-28 text-right"
                          aria-label={`Tarifa por hora de ${name}`}
                          aria-invalid={rateError ? true : undefined}
                          aria-describedby={rateError ? `payroll-rate-${i}-error` : undefined}
                          {...register(`rows.${i}.hourlyRate`, { valueAsNumber: true })}
                        />
                        {rateError && (
                          <p id={`payroll-rate-${i}-error`} className="text-xs text-destructive">
                            {rateError}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Controller
                          control={control}
                          name={`rows.${i}.paymentMethod`}
                          render={({ field: f }) => (
                            <Select value={f.value} onValueChange={(v) => f.onChange(v as PaymentMethod)}>
                              <SelectTrigger className="w-36" aria-label={`Forma de pago de ${name}`}>
                                <SelectValue>
                                  {(v: PaymentMethod) => PAYROLL_PAYMENT_METHOD_LABEL[v]}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Cash">{PAYROLL_PAYMENT_METHOD_LABEL.Cash}</SelectItem>
                                <SelectItem value="Transfer">
                                  {PAYROLL_PAYMENT_METHOD_LABEL.Transfer}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatCRC(field.hoursWorked * (Number(row?.hourlyRate) || 0))}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            <div className="flex justify-between border-t pt-3 font-semibold">
              <span>Total planilla</span>
              <span className="font-mono tabular-nums">{formatCRC(total)}</span>
            </div>

            <Button type="submit" disabled={mutation.isPending} className="sm:w-fit">
              {mutation.isPending ? 'Creando…' : 'Crear planilla'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
