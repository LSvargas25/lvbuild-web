import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { Controller, FormProvider, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { EntitySelect } from '@/components/entity-select'
import { FormField } from '@/components/form-field'
import { PageHeader } from '@/components/page-header'
import { ErrorState, LoadingState } from '@/components/page-state'
import { ButtonLink } from '@/components/button-link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getOpenRegisterId } from '@/features/comercial/cash-register-storage'
import {
  emptyLine,
  invoiceSchema,
  invoiceTotals,
  toCreateInvoiceRequest,
  type InvoiceFormValues,
} from '@/features/comercial/invoice-form'
import { InvoiceLineFields } from '@/features/comercial/invoice-line-fields'
import { catalogQueries, nameOf } from '@/lib/api/catalogs'
import { createInvoice, getCashRegister } from '@/lib/api/commercial'
import { getErrorMessage } from '@/lib/api/errors'
import { formatCRC } from '@/lib/format'
import type { CashRegister, InvoicePaymentType } from '@/types/commercial'

export function NewInvoicePage() {
  const registerId = getOpenRegisterId()
  const registerQuery = useQuery({
    queryKey: ['cash-register', registerId],
    queryFn: () => getCashRegister(registerId!),
    enabled: registerId !== null,
  })

  if (registerId !== null && registerQuery.isPending) return <LoadingState />
  if (registerQuery.isError) return <ErrorState error={registerQuery.error} />

  if (registerId === null || registerQuery.data?.status !== 'Open') {
    return (
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>No hay caja abierta</CardTitle>
          <CardDescription>Abre una caja antes de facturar.</CardDescription>
        </CardHeader>
        <CardContent>
          <ButtonLink to="/comercial/caja">Ir a caja</ButtonLink>
        </CardContent>
      </Card>
    )
  }

  return <InvoiceForm cashRegister={registerQuery.data} />
}

function InvoiceForm({ cashRegister }: { cashRegister: CashRegister }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const productsQuery = useQuery(catalogQueries.products)
  const customersQuery = useQuery(catalogQueries.customers)
  const branchesQuery = useQuery(catalogQueries.branches)
  // Solo productos validados y activos se pueden facturar.
  const products = productsQuery.data?.filter((p) => p.status === 'Validated' && p.activeStatus)

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { customerId: '', paymentType: 'Contado', lines: [emptyLine()] },
  })
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = form
  const lines = useFieldArray({ control, name: 'lines' })
  const watchedLines = useWatch({ control, name: 'lines' })
  const { subtotal, tax, total } = invoiceTotals(watchedLines ?? [], products)

  const mutation = useMutation({
    mutationFn: (values: InvoiceFormValues) =>
      createInvoice(toCreateInvoiceRequest(values, cashRegister.branchId, cashRegister.id)),
    onSuccess: (invoice) => {
      toast.success('Factura creada como borrador')
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      navigate(`/comercial/facturas/${invoice.id}`)
    },
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudo crear la factura.')),
  })

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <PageHeader
        title="Nueva factura"
        description={`Caja #${cashRegister.id} · ${nameOf(branchesQuery.data, cashRegister.branchId)}`}
      />
      <Card>
        <CardContent>
          <FormProvider {...form}>
            <form
              noValidate
              onSubmit={handleSubmit((values) => mutation.mutate(values))}
              className="flex flex-col gap-4"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField id="invoice-customer" label="Cliente" hint="Vacío = consumidor final">
                  <Controller
                    control={control}
                    name="customerId"
                    render={({ field }) => (
                      <EntitySelect
                        id="invoice-customer"
                        items={customersQuery.data}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Consumidor final"
                      />
                    )}
                  />
                </FormField>
                <FormField id="invoice-payment-type" label="Tipo de pago">
                  <Controller
                    control={control}
                    name="paymentType"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(v) => field.onChange(v as InvoicePaymentType)}
                      >
                        <SelectTrigger id="invoice-payment-type" className="w-full">
                          <SelectValue>
                            {(v: InvoicePaymentType) => (v === 'Credito' ? 'Crédito' : 'Contado')}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Contado">Contado</SelectItem>
                          <SelectItem value="Credito">Crédito</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>
              </div>

              <fieldset className="flex flex-col gap-3">
                <legend className="mb-2 text-sm font-medium">Productos</legend>
                {lines.fields.map((field, index) => (
                  <InvoiceLineFields
                    key={field.id}
                    index={index}
                    products={products}
                    canRemove={lines.fields.length > 1}
                    onRemove={() => lines.remove(index)}
                  />
                ))}
                {errors.lines?.root?.message && (
                  <p className="text-sm text-destructive">{errors.lines.root.message}</p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() => lines.append(emptyLine())}
                >
                  <Plus aria-hidden="true" />
                  Agregar producto
                </Button>
              </fieldset>

              <dl className="flex flex-col gap-1 border-t pt-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-mono tabular-nums">{formatCRC(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">IVA (13 %)</dt>
                  <dd className="font-mono tabular-nums">{formatCRC(tax)}</dd>
                </div>
                <div className="flex justify-between font-semibold">
                  <dt>Total estimado</dt>
                  <dd className="font-mono tabular-nums">{formatCRC(total)}</dd>
                </div>
              </dl>

              <Button type="submit" disabled={mutation.isPending} className="sm:w-fit">
                {mutation.isPending ? 'Creando…' : 'Crear factura (borrador)'}
              </Button>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  )
}
