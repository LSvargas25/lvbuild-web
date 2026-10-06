import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { EntitySelect } from '@/components/entity-select'
import { FormField } from '@/components/form-field'
import { fieldA11y } from '@/lib/a11y'
import { LoadingState } from '@/components/page-state'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/button-link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  clearOpenRegisterId,
  getOpenRegisterId,
  setOpenRegisterId,
} from '@/features/comercial/cash-register-storage'
import { catalogQueries, commercialBranches, nameOf } from '@/lib/api/catalogs'
import { closeCashRegister, getCashRegister, openCashRegister } from '@/lib/api/commercial'
import { getErrorMessage } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/dates'
import { formatCRC } from '@/lib/format'
import { money, requiredId } from '@/lib/validation'

const openSchema = z.object({
  branchId: requiredId('Elige una sucursal'),
  openingBalance: money(),
})
type OpenFormValues = z.infer<typeof openSchema>

const closeSchema = z.object({ closingBalance: money() })
type CloseFormValues = z.infer<typeof closeSchema>

export function CashRegisterPage() {
  const queryClient = useQueryClient()
  const [registerId, setRegisterId] = useState(() => getOpenRegisterId())

  const branchesQuery = useQuery(catalogQueries.branches)
  const registerQuery = useQuery({
    queryKey: ['cash-register', registerId],
    queryFn: () => getCashRegister(registerId!),
    enabled: registerId !== null,
  })

  const openForm = useForm<OpenFormValues>({
    resolver: zodResolver(openSchema),
    defaultValues: { branchId: '', openingBalance: 0 },
  })
  const closeForm = useForm<CloseFormValues>({
    resolver: zodResolver(closeSchema),
    defaultValues: { closingBalance: 0 },
  })

  const openMutation = useMutation({
    mutationFn: (values: OpenFormValues) =>
      openCashRegister({ branchId: Number(values.branchId), openingBalance: values.openingBalance }),
    onSuccess: (register) => {
      setOpenRegisterId(register.id)
      setRegisterId(register.id)
      toast.success('Caja abierta')
    },
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudo abrir la caja.')),
  })

  const closeMutation = useMutation({
    mutationFn: (values: CloseFormValues) => closeCashRegister(registerId!, values),
    onSuccess: () => {
      clearOpenRegisterId()
      queryClient.invalidateQueries({ queryKey: ['cash-register'] })
      toast.success('Caja cerrada')
    },
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudo cerrar la caja.')),
  })

  if (registerId !== null && registerQuery.isPending) return <LoadingState />

  const register = registerQuery.data

  if (register?.status === 'Closed') {
    return (
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Caja cerrada</CardTitle>
          <CardDescription>
            {nameOf(branchesQuery.data, register.branchId)} · cerrada el {formatDateTime(register.closingDate)}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Balance esperado</dt>
              <dd className="font-mono tabular-nums">{formatCRC(register.expectedBalance)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Contado</dt>
              <dd className="font-mono tabular-nums">{formatCRC(register.closingBalance)}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>Diferencia</dt>
              <dd className="font-mono tabular-nums">{formatCRC(register.difference)}</dd>
            </div>
          </dl>
          <Button
            className="w-fit"
            onClick={() => {
              setRegisterId(null)
              closeForm.reset()
              openForm.reset()
            }}
          >
            Abrir nueva caja
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (register?.status === 'Open') {
    const closingError = closeForm.formState.errors.closingBalance?.message
    return (
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Caja abierta <Badge variant="secondary">#{register.id}</Badge>
          </CardTitle>
          <CardDescription>
            {nameOf(branchesQuery.data, register.branchId)} · desde {formatDateTime(register.openingDate)} ·
            balance inicial {formatCRC(register.openingBalance)}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ButtonLink className="w-fit" to="/comercial/facturas/nueva">
            Ir a facturar
          </ButtonLink>
          <form
            noValidate
            onSubmit={closeForm.handleSubmit((values) => closeMutation.mutate(values))}
            className="flex flex-col gap-3 border-t pt-4"
          >
            <FormField id="closingBalance" label="Efectivo contado al cerrar (₡)" error={closingError}>
              <Input
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                {...fieldA11y('closingBalance', closingError)}
                {...closeForm.register('closingBalance', { valueAsNumber: true })}
              />
            </FormField>
            <Button type="submit" variant="secondary" className="w-fit" disabled={closeMutation.isPending}>
              {closeMutation.isPending ? 'Cerrando…' : 'Cerrar caja'}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  const openErrors = openForm.formState.errors
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Abrir caja</CardTitle>
        <CardDescription>Elige la sucursal y el efectivo inicial.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          onSubmit={openForm.handleSubmit((values) => openMutation.mutate(values))}
          className="flex flex-col gap-4"
        >
          <FormField id="branchId" label="Sucursal" error={openErrors.branchId?.message}>
            <Controller
              control={openForm.control}
              name="branchId"
              render={({ field }) => (
                <EntitySelect
                  id="branchId"
                  items={commercialBranches(branchesQuery.data)}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Elige una sucursal"
                  invalid={!!openErrors.branchId}
                  describedBy={openErrors.branchId ? 'branchId-error' : undefined}
                />
              )}
            />
          </FormField>
          <FormField id="openingBalance" label="Efectivo inicial (₡)" error={openErrors.openingBalance?.message}>
            <Input
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              {...fieldA11y('openingBalance', openErrors.openingBalance?.message)}
              {...openForm.register('openingBalance', { valueAsNumber: true })}
            />
          </FormField>
          <Button type="submit" disabled={openMutation.isPending}>
            {openMutation.isPending ? 'Abriendo…' : 'Abrir caja'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
