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
import { useAuth } from '@/features/auth/auth-context'
import { getBranches } from '@/lib/api/commercial'
import { getOffer, markOfferAccepted, openOfferPdf, revertOfferToDraft, sendOfferToClient } from '@/lib/api/offers'
import { createProject } from '@/lib/api/projects'
import type { OfferStatus } from '@/types/offers'

const STATUS_LABEL: Record<OfferStatus, string> = {
  Draft: 'Borrador',
  SentToClient: 'Enviada al cliente',
  ClientAccepted: 'Aceptada por el cliente',
}

export function OfferDetailPage() {
  const { id } = useParams()
  const offerId = Number(id)
  const { session } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [branchId, setBranchId] = useState('')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))

  const offerQuery = useQuery({ queryKey: ['offer', offerId], queryFn: () => getOffer(offerId) })
  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: getBranches })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['offer', offerId] })

  const sendMutation = useMutation({
    mutationFn: () => sendOfferToClient(offerId),
    onSuccess: () => {
      toast.success('Oferta enviada al cliente (PDF generado)')
      invalidate()
    },
    onError: () => toast.error('No se pudo enviar la oferta.'),
  })

  const acceptMutation = useMutation({
    mutationFn: () => markOfferAccepted(offerId),
    onSuccess: () => {
      toast.success('Oferta aceptada por el cliente')
      invalidate()
    },
    onError: () => toast.error('No se pudo marcar como aceptada.'),
  })

  const revertMutation = useMutation({
    mutationFn: () => revertOfferToDraft(offerId),
    onSuccess: () => {
      toast.success('Oferta devuelta a borrador')
      invalidate()
    },
    onError: () => toast.error('No se pudo revertir la oferta.'),
  })

  const createProjectMutation = useMutation({
    mutationFn: () => createProject({ offerId, branchId: Number(branchId), startDate }),
    onSuccess: (project) => {
      toast.success('Proyecto creado')
      navigate(`/proyectos/${project.id}`)
    },
    onError: () => toast.error('No se pudo crear el proyecto.'),
  })

  if (offerQuery.isLoading) return <p className="text-muted-foreground">Cargando…</p>
  const offer = offerQuery.data
  if (!offer) return <p className="text-destructive">No se encontró la oferta.</p>

  const canManage = session?.roles.some((r) => r === 'ProjectAdmin')
  const canDecide = session?.roles.some((r) => r === 'GeneralManager' || r === 'OperationsDirector')

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Oferta {offer.offerNumber ?? `#${offer.id}`}</CardTitle>
          <Badge variant={offer.status === 'ClientAccepted' ? 'default' : 'secondary'}>
            {STATUS_LABEL[offer.status]}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ubicación</span>
            <span>{offer.workLocation}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Alcance</span>
            <span>{offer.workScope}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duración estimada</span>
            <span>{offer.estimatedDurationWeeks} semanas</span>
          </div>
          {offer.totalProjectPrice != null && (
            <div className="flex justify-between font-semibold">
              <span>Precio total</span>
              <span className="font-mono tabular-nums">
                ₡{offer.totalProjectPrice.toLocaleString('es-CR')}
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t pt-4">
            {offer.status === 'Draft' && canManage && (
              <Button onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending}>
                Enviar al cliente (genera PDF)
              </Button>
            )}
            {offer.generatedPdfPath && (
              <Button variant="outline" onClick={() => openOfferPdf(offer.id)}>
                Ver PDF
              </Button>
            )}
            {offer.status === 'SentToClient' && canDecide && (
              <>
                <Button onClick={() => acceptMutation.mutate()} disabled={acceptMutation.isPending}>
                  Marcar aceptada por cliente
                </Button>
                <Button
                  variant="outline"
                  onClick={() => revertMutation.mutate()}
                  disabled={revertMutation.isPending}
                >
                  Revertir a borrador
                </Button>
              </>
            )}
          </div>

          {offer.status === 'ClientAccepted' && canDecide && (
            <div className="flex flex-col gap-3 border-t pt-4">
              <span className="font-medium">Crear proyecto</span>
              <div className="flex gap-2">
                <Select value={branchId || undefined} onValueChange={(v) => setBranchId(v ?? '')}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sucursal">
                      {(value: string | null) =>
                        branchesQuery.data?.find((b) => String(b.id) === value)?.name ?? 'Sucursal'
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {branchesQuery.data?.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-40"
                />
                <Button
                  onClick={() => createProjectMutation.mutate()}
                  disabled={!branchId || createProjectMutation.isPending}
                >
                  Crear proyecto
                </Button>
              </div>
              <Label className="text-xs text-muted-foreground">
                Al aceptar la oferta, el presupuesto queda marcado como aprobado por el cliente.
                Crear el proyecto es un paso manual siguiente.
              </Label>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
