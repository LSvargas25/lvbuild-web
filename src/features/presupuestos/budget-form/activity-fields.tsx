import { Trash2 } from 'lucide-react'
import { useFormContext, useWatch } from 'react-hook-form'
import { FormField } from '@/components/form-field'
import { fieldA11y } from '@/lib/a11y'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { activityCost, type BudgetFormValues } from '@/features/presupuestos/budget-form/schema'
import { formatCRC } from '@/lib/format'

interface ActivityFieldsProps {
  chapterIndex: number
  activityIndex: number
  canRemove: boolean
  onRemove: () => void
}

const COST_FIELDS = [
  { key: 'materialQuantity', label: 'Cant. material' },
  { key: 'materialCost', label: 'Materiales (₡)' },
  { key: 'laborCost', label: 'Mano de obra (₡)' },
  { key: 'equipmentCost', label: 'Equipo (₡)' },
] as const

export function ActivityFields({ chapterIndex, activityIndex, canRemove, onRemove }: ActivityFieldsProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<BudgetFormValues>()
  const base = `chapters.${chapterIndex}.activities.${activityIndex}` as const
  const activity = useWatch({ control, name: base })
  const activityErrors = errors.chapters?.[chapterIndex]?.activities?.[activityIndex]
  const idPrefix = `chapter-${chapterIndex}-activity-${activityIndex}`
  const position = `actividad ${activityIndex + 1} del capítulo ${chapterIndex + 1}`

  return (
    <fieldset className="grid grid-cols-1 gap-3 rounded-md border border-dashed p-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-start">
      <legend className="sr-only">Actividad {activityIndex + 1}</legend>
      <FormField
        id={`${idPrefix}-description`}
        label="Actividad"
        labelClassName="text-xs text-muted-foreground"
        error={activityErrors?.description?.message}
        className="sm:col-span-2"
      >
        <Input
          {...fieldA11y(`${idPrefix}-description`, activityErrors?.description?.message)}
          {...register(`${base}.description`)}
        />
      </FormField>
      {COST_FIELDS.map(({ key, label }) => (
        <FormField
          key={key}
          id={`${idPrefix}-${key}`}
          label={label}
          labelClassName="text-xs text-muted-foreground"
          error={activityErrors?.[key]?.message}
          className="lg:col-span-1"
        >
          <Input
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            {...fieldA11y(`${idPrefix}-${key}`, activityErrors?.[key]?.message)}
            {...register(`${base}.${key}`, { valueAsNumber: true })}
          />
        </FormField>
      ))}
      <div className="flex items-center justify-between gap-2 sm:col-span-2 lg:col-span-6">
        <span className="text-sm text-muted-foreground">
          Costo directo:{' '}
          <span className="font-mono tabular-nums text-foreground">
            {formatCRC(activityCost(activity ?? {}))}
          </span>
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label={`Quitar ${position}`}
        >
          <Trash2 aria-hidden="true" />
          Quitar
        </Button>
      </div>
    </fieldset>
  )
}
