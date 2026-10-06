import { Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { FormField } from '@/components/form-field'
import { fieldA11y } from '@/lib/a11y'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ActivityFields } from '@/features/presupuestos/budget-form/activity-fields'
import { emptyActivity, type BudgetFormValues } from '@/features/presupuestos/budget-form/schema'

interface ChapterFieldsProps {
  index: number
  canRemove: boolean
  onRemove: () => void
}

export function ChapterFields({ index, canRemove, onRemove }: ChapterFieldsProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<BudgetFormValues>()
  const activities = useFieldArray({ control, name: `chapters.${index}.activities` })
  const chapterErrors = errors.chapters?.[index]
  const idPrefix = `chapter-${index}`

  return (
    <fieldset className="flex flex-col gap-3 rounded-lg border p-3">
      <legend className="px-1 text-sm font-medium">Capítulo {index + 1}</legend>
      <div className="flex flex-wrap items-start gap-3">
        <FormField
          id={`${idPrefix}-name`}
          label="Nombre del capítulo"
          error={chapterErrors?.name?.message}
          className="min-w-48 flex-1"
        >
          <Input
            placeholder="Ej.: Obra gris"
            {...fieldA11y(`${idPrefix}-name`, chapterErrors?.name?.message)}
            {...register(`chapters.${index}.name`)}
          />
        </FormField>
        <FormField
          id={`${idPrefix}-weeks`}
          label="Semanas estimadas"
          error={chapterErrors?.estimatedWeeks?.message}
          className="w-36"
        >
          <Input
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            {...fieldA11y(`${idPrefix}-weeks`, chapterErrors?.estimatedWeeks?.message)}
            {...register(`chapters.${index}.estimatedWeeks`, { valueAsNumber: true })}
          />
        </FormField>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="sm:mt-6"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label={`Quitar capítulo ${index + 1}`}
        >
          <Trash2 aria-hidden="true" />
          Quitar capítulo
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:pl-3">
        {activities.fields.map((field, activityIndex) => (
          <ActivityFields
            key={field.id}
            chapterIndex={index}
            activityIndex={activityIndex}
            canRemove={activities.fields.length > 1}
            onRemove={() => activities.remove(activityIndex)}
          />
        ))}
        {chapterErrors?.activities?.root?.message && (
          <p className="text-sm text-destructive">{chapterErrors.activities.root.message}</p>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => activities.append(emptyActivity())}
        >
          <Plus aria-hidden="true" />
          Agregar actividad
        </Button>
      </div>
    </fieldset>
  )
}
