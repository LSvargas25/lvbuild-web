import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/features/auth/auth-context'
import { addInvoicePayment, cancelInvoice, getInvoice, issueInvoice } from '@/lib/api/commercial'
import type { InvoicePaymentMethod, InvoiceStatus } from '@/types/commercial'

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  Draft: 'Borrador',
  Issued: 'Emitida',
  Cancelled: 'Anulada',
}

const STATUS_VARIANT: Record<InvoiceStatus, 'secondary' | 'default' | 'destructive'> = {
  Draft: 'secondary',
  Issued: 'default',
  Cancelled: 'destructive',
}

export function InvoiceDetailPage() {
  const { id } = useParams()
  const invoiceId = Number(id)
  const { session } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [paymentMethod, setPaymentMethod] = useState<InvoicePaymentMethod>('Efectivo')
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('')

  const invoiceQuery = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => getInvoice(invoiceId),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })

  const issueMutation = useMutation({
    mutationFn: () =>
      issueInvoice(invoiceId, {
        payments: [{ paymentMethod, amount: Number(paymentAmount) }],
      }),
    onSuccess: () => {
      toast.success('Factura emitida')
      invalidate()
    },
    onError: () => toast.error('No se pudo emitir la factura.'),
  })

  const paymentMutation = useMutation({
    mutationFn: () => addInvoicePayment(invoiceId, { paymentMethod, amount: Number(paymentAmount) }),
    onSuccess: () => {
      toast.success('Pago registrado')
      setPaymentAmount('')
      invalidate()
    },
    onError: () => toast.error('No se pudo registrar el pago.'),
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelInvoice(invoiceId),
    onSuccess: () => {
      toast.success('Factura anulada')
      invalidate()
    },
    onError: () => toast.error('No se pudo anular la factura.'),
  })

  if (invoiceQuery.isLoading) return <p className="text-muted-foreground">Cargando…</p>
  const invoice = invoiceQuery.data
  if (!invoice) return <p className="text-destructive">No se encontró la factura.</p>

  const canCancel =
    session?.roles.some((r) => r === 'GeneralManager' || r === 'OperationsDirector') &&
    invoice.status !== 'Cancelled'

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Factura {invoice.invoiceNumber ?? `#${invoice.id}`}
          </CardTitle>
          <Badge variant={STATUS_VARIANT[invoice.status]}>{STATUS_LABEL[invoice.status]}</Badge>
        </CardHeader>
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
                  <TableCell className="text-right tabular-nums">
                    ₡{line.unitPrice.toLocaleString('es-CR')}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    ₡{line.subtotal.toLocaleString('es-CR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-1 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono tabular-nums">₡{invoice.subtotal.toLocaleString('es-CR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA</span>
              <span className="font-mono tabular-nums">₡{invoice.tax.toLocaleString('es-CR')}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="font-mono tabular-nums">₡{invoice.total.toLocaleString('es-CR')}</span>
            </div>
            {invoice.status !== 'Draft' && (
              <div className="flex justify-between text-muted-foreground">
                <span>Pagado / saldo</span>
                <span className="font-mono tabular-nums">
                  ₡{invoice.totalPaid.toLocaleString('es-CR')} / ₡
                  {invoice.balance.toLocaleString('es-CR')}
                </span>
              </div>
            )}
          </div>

          {invoice.payments.length > 0 && (
            <div className="flex flex-col gap-2 border-t pt-3">
              <Label>Pagos registrados</Label>
              {invoice.payments.map((payment) => (
                <div key={payment.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{payment.paymentMethod}</span>
                  <span className="font-mono tabular-nums">
                    ₡{payment.amount.toLocaleString('es-CR')}
                  </span>
                </div>
              ))}
            </div>
          )}

          {(invoice.status === 'Draft' || (invoice.status === 'Issued' && !invoice.isFullyPaid)) && (
            <div className="flex flex-col gap-3 border-t pt-4">
              <Label>
                {invoice.status === 'Draft' ? 'Emitir factura con pago' : 'Registrar pago'}
              </Label>
              <div className="flex gap-2">
                <Select
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value as InvoicePaymentMethod)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Efectivo">Efectivo</SelectItem>
                    <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="Sinpe">Sinpe</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  step="0.01"
                  placeholder={
                    invoice.status === 'Draft'
                      ? invoice.total.toString()
                      : invoice.balance.toString()
                  }
                  value={paymentAmount}
                  onChange={(e) =>
                    setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-32"
                />
                <Button
                  onClick={() =>
                    invoice.status === 'Draft' ? issueMutation.mutate() : paymentMutation.mutate()
                  }
                  disabled={
                    paymentAmount === '' || issueMutation.isPending || paymentMutation.isPending
                  }
                >
                  {invoice.status === 'Draft' ? 'Emitir' : 'Registrar'}
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-2 border-t pt-4">
            {canCancel && (
              <Button
                variant="destructive"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
              >
                Anular factura
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/comercial/facturas/nueva')}>
              Nueva factura
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
