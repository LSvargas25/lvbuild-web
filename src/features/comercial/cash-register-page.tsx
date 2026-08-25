import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  clearOpenRegisterId,
  getOpenRegisterId,
  setOpenRegisterId,
} from '@/features/comercial/cash-register-storage'
import {
  closeCashRegister,
  getBranches,
  getCashRegister,
  openCashRegister,
} from '@/lib/api/commercial'

const openSchema = z.object({
  branchId: z.string().min(1, 'Elegí una sucursal'),
  openingBalance: z.number().min(0, 'No puede ser negativo'),
})
type OpenFormValues = z.infer<typeof openSchema>

const closeSchema = z.object({
  closingBalance: z.number().min(0, 'No puede ser negativo'),
})
type CloseFormValues = z.infer<typeof closeSchema>

export function CashRegisterPage() {
  const queryClient = useQueryClient()
  const [registerId, setRegisterId] = useState(() => getOpenRegisterId())

  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: getBranches })
  const registerQuery = useQuery({
    queryKey: ['cash-register', registerId],
    queryFn: () => getCashRegister(registerId!),
    enabled: registerId !== null,
  })

  const openForm = useForm<OpenFormValues>({
    resolver: zodResolver(openSchema),
    defaultValues: { openingBalance: 0 },
  })
  const closeForm = useForm<CloseFormValues>({
    resolver: zodResolver(closeSchema),
    defaultValues: { closingBalance: 0 },
  })

  const openMutation = useMutation({
    mutationFn: (values: OpenFormValues) =>
      openCashRegister({
        branchId: Number(values.branchId),
        openingBalance: values.openingBalance,
      }),
    onSuccess: (register) => {
      setOpenRegisterId(register.id)
      setRegisterId(register.id)
      toast.success('Caja abierta')
    },
    onError: () => toast.error('No se pudo abrir la caja.'),
  })

  const closeMutation = useMutation({
    mutationFn: (values: CloseFormValues) => closeCashRegister(registerId!, values),
    onSuccess: () => {
      clearOpenRegisterId()
      queryClient.invalidateQueries({ queryKey: ['cash-register'] })
      toast.success('Caja cerrada')
    },
    onError: () => toast.error('No se pudo cerrar la caja.'),
  })

  const register = registerQuery.data

  if (register && register.status === 'Closed') {
    return (
      <div className="flex max-w-md flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Caja cerrada</CardTitle>
            <CardDescription>
              Balance esperado ₡{register.expectedBalance?.toLocaleString('es-CR')} · Diferencia{' '}
              ₡{register.difference?.toLocaleString('es-CR')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                setRegisterId(null)
                closeForm.reset()
              }}
            >
              Abrir nueva caja
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (registerId && register?.status === 'Open') {
    return (
      <div className="flex max-w-md flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Caja abierta</CardTitle>
            <CardDescription>
              Sucursal #{register.branchId} · Balance inicial ₡
              {register.openingBalance.toLocaleString('es-CR')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Badge variant="secondary" className="w-fit">
              Abierta
            </Badge>
            <Button render={<Link to="/comercial/facturas/nueva" />}>Ir a facturar</Button>
            <form
              onSubmit={closeForm.handleSubmit((values) => closeMutation.mutate(values))}
              className="flex flex-col gap-3 border-t pt-4"
            >
              <Label htmlFor="closingBalance">Cerrar caja — balance en efectivo contado</Label>
              <Input
                id="closingBalance"
                type="number"
                step="0.01"
                {...closeForm.register('closingBalance', { valueAsNumber: true })}
              />
              {closeForm.formState.errors.closingBalance && (
                <p className="text-sm text-destructive">
                  {closeForm.formState.errors.closingBalance.message}
                </p>
              )}
              <Button type="submit" variant="secondary" disabled={closeMutation.isPending}>
                {closeMutation.isPending ? 'Cerrando…' : 'Cerrar caja'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex max-w-md flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Abrir caja</CardTitle>
          <CardDescription>Elegí la sucursal y el balance inicial en efectivo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={openForm.handleSubmit((values) => openMutation.mutate(values))}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="branchId">Sucursal</Label>
              <Select
                onValueChange={(value) => openForm.setValue('branchId', value as string)}
              >
                <SelectTrigger id="branchId" className="w-full">
                  <SelectValue placeholder="Elegí una sucursal" />
                </SelectTrigger>
                <SelectContent>
                  {branchesQuery.data?.map((branch) => (
                    <SelectItem key={branch.id} value={String(branch.id)}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {openForm.formState.errors.branchId && (
                <p className="text-sm text-destructive">
                  {openForm.formState.errors.branchId.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="openingBalance">Balance inicial</Label>
              <Input
                id="openingBalance"
                type="number"
                step="0.01"
                {...openForm.register('openingBalance', { valueAsNumber: true })}
              />
              {openForm.formState.errors.openingBalance && (
                <p className="text-sm text-destructive">
                  {openForm.formState.errors.openingBalance.message}
                </p>
              )}
            </div>
            <Button type="submit" disabled={openMutation.isPending}>
              {openMutation.isPending ? 'Abriendo…' : 'Abrir caja'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
