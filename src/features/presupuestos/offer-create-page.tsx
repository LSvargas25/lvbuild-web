import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { FormField } from '@/components/form-field'
import { fieldA11y } from '@/lib/a11y'
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
import { Textarea } from '@/components/ui/textarea'
import {
  offerDefaults,
  offerSchema,
  toCreateOfferRequest,
  type OfferFormValues,
} from '@/features/presupuestos/offer-form-schema'
import { getBudget } from '@/lib/api/budgets'
import { getErrorMessage } from '@/lib/api/errors'
import { createOffer } from '@/lib/api/offers'
import { addDays, formatDate } from '@/lib/dates'
import { formatCRC } from '@/lib/format'
import { OFFER_TYPE_LABEL, PAYMENT_FREQUENCY_LABEL } from '@/lib/status-labels'
import type { Budget } from '@/types/budgets'
import type { OfferType, PaymentFrequency } from '@/types/offers'

export function OfferCreatePage() {
  const { budgetId } = useParams()
  const budgetQuery = useQuery({
    queryKey: ['budget', Number(budgetId)],
    queryFn: () => getBudget(Number(budgetId)),
  })

  if (budgetQuery.isPending) return <LoadingState />
  if (budgetQuery.isError) {
    return (
      <ErrorState
        error={budgetQuery.error}
        fallback="No se encontró el presupuesto."
        backTo={{ to: '/presupuestos', label: 'Volver a presupuestos' }}
      />
    )
  }
  if (budgetQuery.data.status !== 'Sent') {
    return (
      <ErrorState
        error={null}
        fallback="Solo se puede crear una oferta desde un presupuesto en estado Enviado."
        backTo={{ to: `/presupuestos/${budgetId}`, label: 'Volver al presupuesto' }}
      />
    )
  }

  // El formulario se monta cuando ya está el presupuesto: los valores iniciales salen de él.
  return <OfferForm budget={budgetQuery.data} />
}

const TEXT_FIELDS = [
  { name: 'workLocation', label: 'Ubicación de la obra', multiline: false },
  { name: 'workScope', label: 'Alcance del trabajo', multiline: true },
  { name: 'paymentTerms', label: 'Condiciones de pago', multiline: true },
  { name: 'warranties', label: 'Garantías', multiline: true },
  { name: 'exclusions', label: 'Exclusiones', multiline: true },
] as const

const PERCENTAGE_FIELDS = [
  { name: 'percentageIncludes', label: 'El porcentaje incluye' },
  { name: 'percentageExcludes', label: 'El porcentaje excluye' },
  { name: 'percentageCalculationMethod', label: 'Método de cálculo del porcentaje' },
] as const

function OfferForm({ budget }: { budget: Budget }) {
  const navigate = useNavigate()
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: offerDefaults(budget),
  })
  const [offerType, startDate, weeks] = useWatch({
    control,
    name: ['offerType', 'estimatedStartDate', 'estimatedDurationWeeks'],
  })

  const mutation = useMutation({
    mutationFn: (values: OfferFormValues) => createOffer(toCreateOfferRequest(budget.id, values)),
    onSuccess: (offer) => {
      toast.success('Oferta creada como borrador')
      navigate(`/ofertas/${offer.id}`)
    },
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudo crear la oferta.')),
  })

  const deliveryDate =
    /^\d{4}-\d{2}-\d{2}$/.test(startDate) && weeks > 0 ? addDays(startDate, weeks * 7) : null

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <PageHeader
        title="Nueva oferta"
        description={`${budget.name} · presupuesto ${formatCRC(budget.totalBudget)}`}
      />
      <Card>
        <CardContent>
          <form
            noValidate
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <FormField id="offer-type" label="Tipo de oferta">
              <Controller
                control={control}
                name="offerType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => field.onChange(v as OfferType)}>
                    <SelectTrigger id="offer-type" className="w-full">
                      <SelectValue>{(v: OfferType) => OFFER_TYPE_LABEL[v]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Turnkey">{OFFER_TYPE_LABEL.Turnkey}</SelectItem>
                      <SelectItem value="Percentage">{OFFER_TYPE_LABEL.Percentage}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            {offerType === 'Turnkey' ? (
              <FormField
                id="offer-price"
                label="Precio total del proyecto (₡)"
                error={errors.totalProjectPrice?.message}
              >
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  {...fieldA11y('offer-price', errors.totalProjectPrice?.message)}
                  {...register('totalProjectPrice', { valueAsNumber: true })}
                />
              </FormField>
            ) : (
              <FormField
                id="offer-percentage"
                label="Porcentaje acordado (%)"
                error={errors.agreedPercentage?.message}
              >
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  inputMode="decimal"
                  {...fieldA11y('offer-percentage', errors.agreedPercentage?.message)}
                  {...register('agreedPercentage', { valueAsNumber: true })}
                />
              </FormField>
            )}

            <FormField id="offer-issue-date" label="Fecha de emisión" error={errors.issueDate?.message}>
              <Input
                type="date"
                {...fieldA11y('offer-issue-date', errors.issueDate?.message)}
                {...register('issueDate')}
              />
            </FormField>
            <FormField id="offer-validity" label="Vigencia (días)" error={errors.validityDays?.message}>
              <Input
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                {...fieldA11y('offer-validity', errors.validityDays?.message)}
                {...register('validityDays', { valueAsNumber: true })}
              />
            </FormField>
            <FormField
              id="offer-start"
              label="Inicio estimado"
              error={errors.estimatedStartDate?.message}
            >
              <Input
                type="date"
                {...fieldA11y('offer-start', errors.estimatedStartDate?.message)}
                {...register('estimatedStartDate')}
              />
            </FormField>
            <FormField
              id="offer-weeks"
              label="Duración estimada (semanas)"
              error={errors.estimatedDurationWeeks?.message}
              hint={deliveryDate ? `Entrega estimada: ${formatDate(deliveryDate)}` : undefined}
            >
              <Input
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                {...fieldA11y('offer-weeks', errors.estimatedDurationWeeks?.message)}
                {...register('estimatedDurationWeeks', { valueAsNumber: true })}
              />
            </FormField>

            {TEXT_FIELDS.map(({ name, label, multiline }) => {
              const id = `offer-${name}`
              const error = errors[name]?.message
              return (
                <FormField key={name} id={id} label={label} error={error} className="sm:col-span-2">
                  {multiline ? (
                    <Textarea rows={2} {...fieldA11y(id, error)} {...register(name)} />
                  ) : (
                    <Input {...fieldA11y(id, error)} {...register(name)} />
                  )}
                </FormField>
              )
            })}

            {offerType === 'Percentage' && (
              <>
                <FormField id="offer-frequency" label="Frecuencia de pago">
                  <Controller
                    control={control}
                    name="paymentFrequency"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(v) => field.onChange(v as PaymentFrequency)}
                      >
                        <SelectTrigger id="offer-frequency" className="w-full">
                          <SelectValue>{(v: PaymentFrequency) => PAYMENT_FREQUENCY_LABEL[v]}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(PAYMENT_FREQUENCY_LABEL) as PaymentFrequency[]).map((f) => (
                            <SelectItem key={f} value={f}>
                              {PAYMENT_FREQUENCY_LABEL[f]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>
                {PERCENTAGE_FIELDS.map(({ name, label }) => {
                  const id = `offer-${name}`
                  const error = errors[name]?.message
                  return (
                    <FormField key={name} id={id} label={label} error={error} className="sm:col-span-2">
                      <Textarea rows={2} {...fieldA11y(id, error)} {...register(name)} />
                    </FormField>
                  )
                })}
              </>
            )}

            <div className="sm:col-span-2">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Creando…' : 'Crear oferta (borrador)'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
