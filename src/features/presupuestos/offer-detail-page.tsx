import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { EntitySelect } from '@/components/entity-select'
import { FormField } from '@/components/form-field'
import { PageHeader } from '@/components/page-header'
import { ErrorState, LoadingState } from '@/components/page-state'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/button-link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/auth-context'
import { catalogQueries, nameOf } from '@/lib/api/catalogs'
import { getErrorMessage } from '@/lib/api/errors'
import {
  getOffer,
  markOfferAccepted,
  openOfferPdf,
  revertOfferToDraft,
  sendOfferToClient,
} from '@/lib/api/offers'
import { createProject } from '@/lib/api/projects'
import { formatDate, todayLocalISO } from '@/lib/dates'
import { formatCRC } from '@/lib/format'
import { OFFER_STATUS, OFFER_TYPE_LABEL, PAYMENT_FREQUENCY_LABEL } from '@/lib/status-labels'
import { MANAGEMENT_ROLES } from '@/types/roles'

export function OfferDetailPage() {
  const { id } = useParams()
  const offerId = Number(id)
  const { hasRole } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [branchId, setBranchId] = useState('')
  const [startDate, setStartDate] = useState(() => todayLocalISO())

  const offerQuery = useQuery({ queryKey: ['offer', offerId], queryFn: () => getOffer(offerId) })
  const branchesQuery = useQuery(catalogQueries.branches)
  const customersQuery = useQuery(catalogQueries.customers)

  const onStatusChange = (message: string) => () => {
    toast.success(message)
    queryClient.invalidateQueries({ queryKey: ['offer', offerId] })
  }

  const sendMutation = useMutation({
    mutationFn: () => sendOfferToClient(offerId),
    onSuccess: onStatusChange('Oferta enviada al cliente. El PDF ya está disponible.'),
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudo enviar la oferta.')),
  })
  const acceptMutation = useMutation({
    mutationFn: () => markOfferAccepted(offerId),
    onSuccess: onStatusChange('Oferta aceptada por el cliente'),
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudo marcar como aceptada.')),
  })
  const revertMutation = useMutation({
    mutationFn: () => revertOfferToDraft(offerId),
    onSuccess: onStatusChange('Oferta devuelta a borrador'),
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudo revertir la oferta.')),
  })
  const pdfMutation = useMutation({
    mutationFn: () => openOfferPdf(offerId),
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudo abrir el PDF.')),
  })
  const createProjectMutation = useMutation({
    mutationFn: () => createProject({ offerId, branchId: Number(branchId), startDate }),
    onSuccess: (project) => {
      toast.success('Proyecto creado')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      navigate(`/proyectos/${project.id}`)
    },
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudo crear el proyecto.')),
  })

  if (offerQuery.isPending) return <LoadingState />
  if (offerQuery.isError) {
    return (
      <ErrorState
        error={offerQuery.error}
        fallback="No se encontró la oferta."
        backTo={{ to: '/presupuestos', label: 'Volver a presupuestos' }}
      />
    )
  }

  const offer = offerQuery.data
  const canManage = hasRole('ProjectAdmin')
  const canDecide = hasRole(...MANAGEMENT_ROLES)
  const status = OFFER_STATUS[offer.status]
  const busy = sendMutation.isPending || acceptMutation.isPending || revertMutation.isPending

  const details: [string, string][] = [
    ['Cliente', nameOf(customersQuery.data, offer.customerId)],
    ['Tipo', OFFER_TYPE_LABEL[offer.offerType]],
    ['Emisión', `${formatDate(offer.issueDate)} · vigencia ${offer.validityDays} días`],
    ['Ubicación', offer.workLocation ?? '—'],
    ['Alcance', offer.workScope ?? '—'],
    [
      'Plazo',
      `${offer.estimatedDurationWeeks} semanas · del ${formatDate(offer.estimatedStartDate)} al ${formatDate(offer.estimatedDeliveryDate)}`,
    ],
    ['Condiciones de pago', offer.paymentTerms ?? '—'],
    ['Garantías', offer.warranties ?? '—'],
    ['Exclusiones', offer.exclusions ?? '—'],
  ]
  if (offer.offerType === 'Percentage') {
    details.push(
      ['Porcentaje acordado', `${offer.agreedPercentage ?? '—'} %`],
      ['Frecuencia de pago', offer.paymentFrequency ? PAYMENT_FREQUENCY_LABEL[offer.paymentFrequency] : '—'],
    )
  }

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <PageHeader
        title={`Oferta ${offer.offerNumber || `#${offer.id}`}`}
        actions={<Badge variant={status.variant}>{status.label}</Badge>}
      />
      <Card>
        <CardContent className="flex flex-col gap-4 text-sm">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
            {details.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="whitespace-pre-line">{value}</dd>
              </div>
            ))}
          </dl>
          {offer.totalProjectPrice != null && (
            <div className="flex justify-between border-t pt-3 font-semibold">
              <span>Precio total</span>
              <span className="font-mono tabular-nums">{formatCRC(offer.totalProjectPrice)}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t pt-4">
            {offer.status === 'Draft' && canManage && (
              <Button onClick={() => sendMutation.mutate()} disabled={busy}>
                Enviar al cliente
              </Button>
            )}
            {offer.pdfUrl && (
              <Button
                variant="outline"
                onClick={() => pdfMutation.mutate()}
                disabled={pdfMutation.isPending}
              >
                <FileText aria-hidden="true" />
                {pdfMutation.isPending ? 'Abriendo PDF…' : 'Ver PDF'}
              </Button>
            )}
            {offer.status === 'SentToClient' && canDecide && (
              <>
                <Button onClick={() => acceptMutation.mutate()} disabled={busy}>
                  Marcar aceptada por el cliente
                </Button>
                <Button variant="outline" onClick={() => revertMutation.mutate()} disabled={busy}>
                  Revertir a borrador
                </Button>
              </>
            )}
            <ButtonLink variant="ghost" to={`/presupuestos/${offer.budgetId}`}>
              Ver presupuesto
            </ButtonLink>
          </div>
        </CardContent>
      </Card>

      {offer.status === 'ClientAccepted' && canDecide && (
        <Card>
          <CardHeader>
            <CardTitle>Crear proyecto</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault()
                if (branchId) createProjectMutation.mutate()
              }}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField id="project-branch" label="Sucursal a cargo">
                  <EntitySelect
                    id="project-branch"
                    items={branchesQuery.data}
                    value={branchId}
                    onValueChange={setBranchId}
                    placeholder="Elige una sucursal"
                  />
                </FormField>
                <FormField id="project-start" label="Fecha de inicio">
                  <Input
                    id="project-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </FormField>
              </div>
              <p className="text-xs text-muted-foreground">
                Al aceptar la oferta, el presupuesto quedó aprobado por el cliente. Crear el proyecto
                es el paso siguiente.
              </p>
              <Button
                type="submit"
                className="w-fit"
                disabled={!branchId || !startDate || createProjectMutation.isPending}
              >
                {createProjectMutation.isPending ? 'Creando…' : 'Crear proyecto'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
