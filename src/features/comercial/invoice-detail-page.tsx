import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormField } from '@/components/form-field'
import { fieldA11y } from '@/lib/a11y'
import { PageHeader } from '@/components/page-header'
import { ErrorState, LoadingState } from '@/components/page-state'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/button-link'
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
import { useAuth } from '@/features/auth/auth-context'
import { catalogQueries, nameOf } from '@/lib/api/catalogs'
import {
  addInvoicePayment,
  cancelInvoice,
  getInvoice,
  issueInvoice,
} from '@/lib/api/commercial'
import { getErrorMessage } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/dates'
import { formatCRC } from '@/lib/format'
import { INVOICE_STATUS } from '@/lib/status-labels'
import { positive } from '@/lib/validation'
import type { Invoice, InvoicePaymentMethod } from '@/types/commercial'
import { MANAGEMENT_ROLES } from '@/types/roles'

const PAYMENT_METHODS: InvoicePaymentMethod[] = ['Efectivo', 'Tarjeta', 'Sinpe']

export function InvoiceDetailPage() {
  const { id } = useParams()
  const invoiceId = Number(id)
  const { hasRole } = useAuth()
  const queryClient = useQueryClient()

  const invoiceQuery = useQuery({ queryKey: ['invoice', invoiceId], queryFn: () => getInvoice(invoiceId) })
  const customersQuery = useQuery(catalogQueries.customers)
  const branchesQuery = useQuery(catalogQueries.branches)

  const cancelMutation = useMutation({
    mutationFn: () => cancelInvoice(invoiceId),
    onSuccess: () => {
      toast.success('Factura anulada')
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudo anular la factura.')),
  })

  if (invoiceQuery.isPending) return <LoadingState />
  if (invoiceQuery.isError) {
    return (
      <ErrorState
        error={invoiceQuery.error}
        fallback="No se encontró la factura."
        backTo={{ to: '/comercial/facturas', label: 'Volver a facturas' }}
      />
    )
  }

  const invoice = invoiceQuery.data
  const status = INVOICE_STATUS[invoice.status]
  const canCancel = hasRole(...MANAGEMENT_ROLES) && invoice.status === 'Issued'
  const acceptsPayment =
    invoice.status === 'Draft' ||
    (invoice.status === 'Issued' && invoice.paymentType === 'Credito' && !invoice.isFullyPaid)

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <PageHeader
        title={`Factura ${invoice.invoiceNumber || `#${invoice.id}`}`}
        description={`${invoice.customerId ? nameOf(customersQuery.data, invoice.customerId) : 'Consumidor final'} · ${nameOf(branchesQuery.data, invoice.branchId)} · ${invoice.paymentType === 'Credito' ? 'Crédito' : 'Contado'} · ${formatDateTime(invoice.date)}`}
        actions={<Badge variant={status.variant}>{status.label}</Badge>}
      />
      <Card>
        <CardContent className="flex flex-col gap-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.details.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>{line.productName}</TableCell>
                  <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{formatCRC(line.unitPrice)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{formatCRC(line.subtotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <dl className="flex flex-col gap-1 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-mono tabular-nums">{formatCRC(invoice.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">IVA</dt>
              <dd className="font-mono tabular-nums">{formatCRC(invoice.tax)}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>Total</dt>
              <dd className="font-mono tabular-nums">{formatCRC(invoice.total)}</dd>
            </div>
            {invoice.status !== 'Draft' && (
              <div className="flex justify-between text-muted-foreground">
                <dt>Pagado / saldo</dt>
                <dd className="font-mono tabular-nums">
                  {formatCRC(invoice.totalPaid)} / {formatCRC(invoice.balance)}
                </dd>
              </div>
            )}
          </dl>

          {invoice.payments.length > 0 && (
            <section aria-labelledby="invoice-payments" className="flex flex-col gap-2 border-t pt-3">
              <h2 id="invoice-payments" className="text-sm font-medium">
                Pagos registrados
              </h2>
              <ul className="flex flex-col gap-1">
                {invoice.payments.map((payment) => (
                  <li key={payment.id} className="flex flex-wrap justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">
                      {payment.paymentMethod} · {formatDateTime(payment.date)}
                    </span>
                    <span className="font-mono tabular-nums">{formatCRC(payment.amount)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="flex flex-wrap gap-2 border-t pt-4">
            {canCancel && (
              <Button
                variant="destructive"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
              >
                Anular factura
              </Button>
            )}
            <ButtonLink variant="outline" to="/comercial/facturas">
              Volver a facturas
            </ButtonLink>
          </div>
        </CardContent>
      </Card>

      {acceptsPayment && <PaymentForm key={invoice.status} invoice={invoice} />}
    </div>
  )
}

/** Emitir con el pago inicial (borrador) o registrar un abono (crédito emitido). */
function PaymentForm({ invoice }: { invoice: Invoice }) {
  const queryClient = useQueryClient()
  const isDraft = invoice.status === 'Draft'
  const due = isDraft ? invoice.total : invoice.balance
  // Contado se emite pagado completo; crédito puede emitirse con un pago parcial.
  const schema = z.object({
    paymentMethod: z.enum(['Efectivo', 'Tarjeta', 'Sinpe']),
    amount: positive().max(due, `No puede superar ${formatCRC(due)}`),
  })
  type PaymentValues = z.infer<typeof schema>

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentValues>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: 'Efectivo', amount: due },
  })

  const mutation = useMutation({
    mutationFn: (payment: PaymentValues) =>
      isDraft ? issueInvoice(invoice.id, { payments: [payment] }) : addInvoicePayment(invoice.id, payment),
    onSuccess: (updated) => {
      toast.success(isDraft ? 'Factura emitida' : 'Pago registrado')
      reset({ paymentMethod: 'Efectivo', amount: updated.balance })
      queryClient.invalidateQueries({ queryKey: ['invoice', invoice.id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, isDraft ? 'No se pudo emitir la factura.' : 'No se pudo registrar el pago.')),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isDraft ? 'Emitir factura' : 'Registrar abono'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="flex flex-wrap items-start gap-3"
        >
          <FormField id="payment-method" label="Medio de pago" className="w-40">
            <Controller
              control={control}
              name="paymentMethod"
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => field.onChange(v as InvoicePaymentMethod)}>
                  <SelectTrigger id="payment-method" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <FormField
            id="payment-amount"
            label="Monto (₡)"
            error={errors.amount?.message}
            hint={`Pendiente: ${formatCRC(due)}`}
            className="w-44"
          >
            <Input
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              {...fieldA11y('payment-amount', errors.amount?.message)}
              {...register('amount', { valueAsNumber: true })}
            />
          </FormField>
          <Button type="submit" className="sm:mt-6" disabled={mutation.isPending}>
            {mutation.isPending ? 'Guardando…' : isDraft ? 'Emitir' : 'Registrar pago'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
