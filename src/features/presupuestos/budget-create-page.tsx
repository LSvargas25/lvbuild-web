import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { Controller, FormProvider, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { EntitySelect } from '@/components/entity-select'
import { FormField } from '@/components/form-field'
import { fieldA11y } from '@/lib/a11y'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ChapterFields } from '@/features/presupuestos/budget-form/chapter-fields'
import {
  budgetSchema,
  defaultBudgetValues,
  directCost,
  emptyChapter,
  toCreateBudgetRequest,
  type BudgetFormValues,
} from '@/features/presupuestos/budget-form/schema'
import { createBudget } from '@/lib/api/budgets'
import { catalogQueries } from '@/lib/api/catalogs'
import { getErrorMessage } from '@/lib/api/errors'
import { formatCRC } from '@/lib/format'

export function BudgetCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const customersQuery = useQuery(catalogQueries.customers)
  const branchesQuery = useQuery(catalogQueries.branches)

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: defaultBudgetValues,
  })
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = form
  const chapters = useFieldArray({ control, name: 'chapters' })
  const watchedChapters = useWatch({ control, name: 'chapters' })

  const mutation = useMutation({
    mutationFn: createBudget,
    onSuccess: (budget) => {
      toast.success('Presupuesto creado como borrador')
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      navigate(`/presupuestos/${budget.id}`)
    },
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudo crear el presupuesto.')),
  })

  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={handleSubmit((values) => mutation.mutate(toCreateBudgetRequest(values)))}
        className="flex max-w-4xl flex-col gap-4"
      >
        <Card>
          <CardHeader>
            <CardTitle>Nuevo presupuesto</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField id="budget-name" label="Nombre del presupuesto" error={errors.name?.message}>
                <Input {...fieldA11y('budget-name', errors.name?.message)} {...register('name')} />
              </FormField>
              <FormField id="budget-customer" label="Cliente" error={errors.customerId?.message}>
                <Controller
                  control={control}
                  name="customerId"
                  render={({ field }) => (
                    <EntitySelect
                      id="budget-customer"
                      items={customersQuery.data}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Elige un cliente"
                      invalid={!!errors.customerId}
                      describedBy={errors.customerId ? 'budget-customer-error' : undefined}
                    />
                  )}
                />
              </FormField>
              <FormField id="budget-branch" label="Sucursal" error={errors.branchId?.message}>
                <Controller
                  control={control}
                  name="branchId"
                  render={({ field }) => (
                    <EntitySelect
                      id="budget-branch"
                      items={branchesQuery.data}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Elige una sucursal"
                      invalid={!!errors.branchId}
                      describedBy={errors.branchId ? 'budget-branch-error' : undefined}
                    />
                  )}
                />
              </FormField>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  id="budget-utility"
                  label="Utilidad (%)"
                  error={errors.utilityPercentage?.message}
                >
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    inputMode="decimal"
                    {...fieldA11y('budget-utility', errors.utilityPercentage?.message)}
                    {...register('utilityPercentage', { valueAsNumber: true })}
                  />
                </FormField>
                <FormField
                  id="budget-indirect"
                  label="Costos indirectos (₡)"
                  error={errors.indirectCostsTotal?.message}
                >
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    {...fieldA11y('budget-indirect', errors.indirectCostsTotal?.message)}
                    {...register('indirectCostsTotal', { valueAsNumber: true })}
                  />
                </FormField>
              </div>
            </div>

            <section aria-labelledby="chapters-heading" className="flex flex-col gap-4 border-t pt-4">
              <h2 id="chapters-heading" className="text-sm font-medium">
                Capítulos
              </h2>
              {chapters.fields.map((field, index) => (
                <ChapterFields
                  key={field.id}
                  index={index}
                  canRemove={chapters.fields.length > 1}
                  onRemove={() => chapters.remove(index)}
                />
              ))}
              {errors.chapters?.root?.message && (
                <p className="text-sm text-destructive">{errors.chapters.root.message}</p>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => chapters.append(emptyChapter())}
              >
                <Plus aria-hidden="true" />
                Agregar capítulo
              </Button>
            </section>

            <div className="flex flex-wrap justify-between gap-2 border-t pt-3 text-sm font-semibold">
              <span>Costo directo estimado</span>
              <span className="font-mono tabular-nums" aria-live="polite">
                {formatCRC(directCost(watchedChapters ?? []))}
              </span>
            </div>

            <Button type="submit" disabled={mutation.isPending} className="sm:w-fit">
              {mutation.isPending ? 'Creando…' : 'Crear presupuesto (borrador)'}
            </Button>
          </CardContent>
        </Card>
      </form>
    </FormProvider>
  )
}
