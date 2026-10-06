import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { EntitySelect } from '@/components/entity-select'
import { FormField } from '@/components/form-field'
import { fieldA11y } from '@/lib/a11y'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  siteLogDefaults,
  siteLogSchema,
  toCreateSiteLogRequest,
  type SiteLogFormValues,
} from '@/features/bitacoras/sitelog-form-schema'
import { getBudget } from '@/lib/api/budgets'
import { catalogQueries } from '@/lib/api/catalogs'
import { getErrorMessage } from '@/lib/api/errors'
import { getProject } from '@/lib/api/projects'
import { createSiteLog } from '@/lib/api/sitelogs'
import { addDays, formatDate, mondayOf } from '@/lib/dates'
import { formatCRC } from '@/lib/format'

export function SiteLogCreatePage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const workersQuery = useQuery(catalogQueries.workers)
  const projectQuery = useQuery({
    queryKey: ['project', Number(projectId)],
    queryFn: () => getProject(Number(projectId)),
  })
  const budgetId = projectQuery.data?.budgetId
  const budgetQuery = useQuery({
    queryKey: ['budget', budgetId],
    queryFn: () => getBudget(budgetId!),
    enabled: budgetId !== undefined,
  })

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SiteLogFormValues>({
    resolver: zodResolver(siteLogSchema),
    defaultValues: siteLogDefaults(),
  })
  const workers = useFieldArray({ control, name: 'workers' })
  const [weekStart, watchedWorkers] = useWatch({ control, name: ['weekStart', 'workers'] })

  const mutation = useMutation({
    mutationFn: (values: SiteLogFormValues) =>
      createSiteLog(toCreateSiteLogRequest(Number(projectId), values)),
    onSuccess: (log) => {
      toast.success('Bitácora creada como borrador')
      queryClient.invalidateQueries({ queryKey: ['site-logs', Number(projectId)] })
      navigate(`/bitacoras/${log.id}`)
    },
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudo crear la bitácora.')),
  })

  const validWeek = /^\d{4}-\d{2}-\d{2}$/.test(weekStart)
  const monday = validWeek ? mondayOf(weekStart) : null
  const estimatedPayroll = (watchedWorkers ?? []).reduce((sum, row) => {
    const rate = workersQuery.data?.find((w) => String(w.id) === row.workerId)?.hourlyRate ?? 0
    return sum + rate * (Number(row.hoursWorked) || 0)
  }, 0)
  const chapters = budgetQuery.data?.chapters.map((c) => ({ id: c.id, name: c.name }))

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <PageHeader
        title="Nueva bitácora semanal"
        description={budgetQuery.data ? budgetQuery.data.name : `Proyecto #${projectId}`}
      />
      <Card>
        <CardContent>
          <form
            noValidate
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            className="flex flex-col gap-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                id="sitelog-week"
                label="Semana (cualquier día)"
                error={errors.weekStart?.message}
                hint={monday ? `Lunes ${formatDate(monday)} a domingo ${formatDate(addDays(monday, 6))}` : undefined}
              >
                <Input
                  type="date"
                  {...fieldA11y('sitelog-week', errors.weekStart?.message)}
                  {...register('weekStart')}
                />
              </FormField>
              <FormField id="sitelog-chapter" label="Capítulo (opcional)">
                <Controller
                  control={control}
                  name="chapterId"
                  render={({ field }) => (
                    <EntitySelect
                      id="sitelog-chapter"
                      items={chapters}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Todo el proyecto"
                    />
                  )}
                />
              </FormField>
              <FormField
                id="sitelog-tasks"
                label="Trabajo realizado"
                error={errors.taskDescription?.message}
                className="sm:col-span-2"
              >
                <Textarea
                  rows={3}
                  {...fieldA11y('sitelog-tasks', errors.taskDescription?.message)}
                  {...register('taskDescription')}
                />
              </FormField>
              <FormField id="sitelog-pending" label="Pendientes (opcional)" className="sm:col-span-2">
                <Textarea id="sitelog-pending" rows={2} {...register('pendingTasks')} />
              </FormField>
            </div>

            <div className="border-t pt-4">
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-3 text-sm font-medium">Trabajadores y horas</legend>
              {workers.fields.map((field, index) => {
                const rowErrors = errors.workers?.[index]
                const workerError = rowErrors?.workerId?.message
                const hoursError = rowErrors?.hoursWorked?.message
                return (
                  <div key={field.id} className="flex flex-wrap items-start gap-2">
                    <div className="flex min-w-56 flex-1 flex-col gap-1">
                      <Controller
                        control={control}
                        name={`workers.${index}.workerId`}
                        render={({ field: f }) => (
                          <EntitySelect
                            id={`sitelog-worker-${index}`}
                            ariaLabel={`Trabajador ${index + 1}`}
                            items={workersQuery.data}
                            value={f.value}
                            onValueChange={f.onChange}
                            placeholder="Elige un trabajador"
                            getLabel={(w) => `${w.name} (${formatCRC(w.hourlyRate)}/h)`}
                            invalid={!!workerError}
                            describedBy={workerError ? `sitelog-worker-${index}-error` : undefined}
                          />
                        )}
                      />
                      {workerError && (
                        <p id={`sitelog-worker-${index}-error`} className="text-sm text-destructive">
                          {workerError}
                        </p>
                      )}
                    </div>
                    <div className="flex w-28 flex-col gap-1">
                      <Input
                        type="number"
                        min={0}
                        step="0.5"
                        inputMode="decimal"
                        aria-label={`Horas del trabajador ${index + 1}`}
                        {...fieldA11y(`sitelog-hours-${index}`, hoursError)}
                        {...register(`workers.${index}.hoursWorked`, { valueAsNumber: true })}
                      />
                      {hoursError && (
                        <p id={`sitelog-hours-${index}-error`} className="text-sm text-destructive">
                          {hoursError}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => workers.remove(index)}
                      disabled={workers.fields.length === 1}
                      aria-label={`Quitar trabajador ${index + 1}`}
                    >
                      <Trash2 aria-hidden="true" />
                      Quitar
                    </Button>
                  </div>
                )
              })}
              {errors.workers?.root?.message && (
                <p className="text-sm text-destructive">{errors.workers.root.message}</p>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => workers.append({ workerId: '', hoursWorked: 40 })}
              >
                <Plus aria-hidden="true" />
                Agregar trabajador
              </Button>
            </fieldset>
            </div>

            <div className="flex flex-wrap justify-between gap-2 border-t pt-3 text-sm font-semibold">
              <span>Planilla estimada</span>
              <span className="font-mono tabular-nums">{formatCRC(estimatedPayroll)}</span>
            </div>

            <Button type="submit" disabled={mutation.isPending} className="sm:w-fit">
              {mutation.isPending ? 'Creando…' : 'Crear bitácora (borrador)'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
