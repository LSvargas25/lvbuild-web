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
import { getBudget } from '@/lib/api/budgets'
import { createOffer } from '@/lib/api/offers'
import type { OfferType, PaymentFrequency } from '@/types/offers'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function inWeeksIso(weeks: number) {
  const d = new Date()
  d.setDate(d.getDate() + weeks * 7)
  return d.toISOString().slice(0, 10)
}

export function OfferCreatePage() {
  const { budgetId } = useParams()
  const navigate = useNavigate()
  const budgetQuery = useQuery({
    queryKey: ['budget', Number(budgetId)],
    queryFn: () => getBudget(Number(budgetId)),
  })

  const totalWeeks =
    budgetQuery.data?.chapters.reduce((sum, c) => sum + c.estimatedWeeks, 0) || 4

  const [offerType, setOfferType] = useState<OfferType>('Turnkey')
  const [workLocation, setWorkLocation] = useState('')
  const [workScope, setWorkScope] = useState('')
  const [validityDays, setValidityDays] = useState(30)
  const [estimatedDurationWeeks, setEstimatedDurationWeeks] = useState(totalWeeks)
  const [totalProjectPrice, setTotalProjectPrice] = useState(0)
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>('Monthly')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [warranties, setWarranties] = useState('')
  const [exclusions, setExclusions] = useState('')
  const [agreedPercentage, setAgreedPercentage] = useState(10)
  const [percentageIncludes, setPercentageIncludes] = useState('')
  const [percentageExcludes, setPercentageExcludes] = useState('')
  const [percentageCalculationMethod, setPercentageCalculationMethod] = useState('')

  if (budgetQuery.data && totalProjectPrice === 0) {
    setTotalProjectPrice(budgetQuery.data.totalBudget)
  }

  const mutation = useMutation({
    mutationFn: createOffer,
    onSuccess: (offer) => {
      toast.success('Oferta creada como borrador')
      navigate(`/ofertas/${offer.id}`)
    },
    onError: () => toast.error('No se pudo crear la oferta. Revisá los campos obligatorios.'),
  })

  if (budgetQuery.isLoading) return <p className="text-muted-foreground">Cargando…</p>

  function handleSubmit() {
    if (!workLocation || !workScope || !paymentTerms || !warranties || !exclusions) {
      toast.error('Completá todos los campos obligatorios.')
      return
    }
    if (offerType === 'Percentage' && (!percentageIncludes || !percentageExcludes || !percentageCalculationMethod)) {
      toast.error('Completá los campos de porcentaje.')
      return
    }

    mutation.mutate({
      budgetId: Number(budgetId),
      offerType,
      issueDate: todayIso(),
      validityDays,
      workLocation,
      workScope,
      estimatedStartDate: inWeeksIso(1),
      estimatedDurationWeeks,
      paymentTerms,
      warranties,
      exclusions,
      totalProjectPrice: offerType === 'Turnkey' ? totalProjectPrice : null,
      agreedPercentage: offerType === 'Percentage' ? agreedPercentage : null,
      percentageIncludes: offerType === 'Percentage' ? percentageIncludes : null,
      percentageExcludes: offerType === 'Percentage' ? percentageExcludes : null,
      percentageCalculationMethod: offerType === 'Percentage' ? percentageCalculationMethod : null,
      paymentFrequency: offerType === 'Percentage' ? paymentFrequency : null,
    })
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Nueva oferta — {budgetQuery.data?.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Tipo de oferta</Label>
              <Select value={offerType} onValueChange={(v) => setOfferType(v as OfferType)}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(v: OfferType) => (v === 'Turnkey' ? 'Llave en mano' : 'Por porcentaje')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Turnkey">Llave en mano</SelectItem>
                  <SelectItem value="Percentage">Por porcentaje</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Vigencia (días)</Label>
              <Input
                type="number"
                value={validityDays}
                onChange={(e) => setValidityDays(Number(e.target.value))}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label>Ubicación de la obra</Label>
              <Input value={workLocation} onChange={(e) => setWorkLocation(e.target.value)} />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label>Alcance del trabajo</Label>
              <Input value={workScope} onChange={(e) => setWorkScope(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Duración estimada (semanas)</Label>
              <Input
                type="number"
                value={estimatedDurationWeeks}
                onChange={(e) => setEstimatedDurationWeeks(Number(e.target.value))}
              />
            </div>
            {offerType === 'Turnkey' ? (
              <div className="flex flex-col gap-2">
                <Label>Precio total del proyecto (₡)</Label>
                <Input
                  type="number"
                  value={totalProjectPrice}
                  onChange={(e) => setTotalProjectPrice(Number(e.target.value))}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Label>Porcentaje acordado (%)</Label>
                <Input
                  type="number"
                  value={agreedPercentage}
                  onChange={(e) => setAgreedPercentage(Number(e.target.value))}
                />
              </div>
            )}
            <div className="col-span-2 flex flex-col gap-2">
              <Label>Condiciones de pago</Label>
              <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label>Garantías</Label>
              <Input value={warranties} onChange={(e) => setWarranties(e.target.value)} />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label>Exclusiones</Label>
              <Input value={exclusions} onChange={(e) => setExclusions(e.target.value)} />
            </div>

            {offerType === 'Percentage' && (
              <>
                <div className="flex flex-col gap-2">
                  <Label>Frecuencia de pago</Label>
                  <Select
                    value={paymentFrequency}
                    onValueChange={(v) => setPaymentFrequency(v as PaymentFrequency)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(v: PaymentFrequency) =>
                          ({
                            Weekly: 'Semanal',
                            Biweekly: 'Quincenal',
                            Monthly: 'Mensual',
                            ProgressBased: 'Por avance',
                          })[v]
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Weekly">Semanal</SelectItem>
                      <SelectItem value="Biweekly">Quincenal</SelectItem>
                      <SelectItem value="Monthly">Mensual</SelectItem>
                      <SelectItem value="ProgressBased">Por avance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 flex flex-col gap-2">
                  <Label>El porcentaje incluye</Label>
                  <Input
                    value={percentageIncludes}
                    onChange={(e) => setPercentageIncludes(e.target.value)}
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-2">
                  <Label>El porcentaje excluye</Label>
                  <Input
                    value={percentageExcludes}
                    onChange={(e) => setPercentageExcludes(e.target.value)}
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-2">
                  <Label>Método de cálculo del porcentaje</Label>
                  <Input
                    value={percentageCalculationMethod}
                    onChange={(e) => setPercentageCalculationMethod(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Creando…' : 'Crear oferta (borrador)'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
