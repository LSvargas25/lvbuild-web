import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { NamedEntity } from '@/types/common'

interface EntitySelectProps<T extends NamedEntity> {
  id?: string
  items: T[] | undefined
  /** Id seleccionado como string ('' = ninguno), igual que los valores de formulario. */
  value: string
  onValueChange: (value: string) => void
  placeholder: string
  /** Texto de cada opción; por defecto `name`. */
  getLabel?: (item: T) => string
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
  ariaLabel?: string
  className?: string
}

/** Select de sucursal / cliente / trabajador / producto: muestra el nombre, guarda el id. */
export function EntitySelect<T extends NamedEntity>({
  id,
  items,
  value,
  onValueChange,
  placeholder,
  getLabel = (item) => item.name,
  disabled,
  invalid,
  describedBy,
  ariaLabel,
  className,
}: EntitySelectProps<T>) {
  const loading = items === undefined

  return (
    <Select value={value || null} onValueChange={(v) => onValueChange((v as string | null) ?? '')}>
      <SelectTrigger
        id={id}
        className={cn('w-full', className)}
        disabled={disabled || loading}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-label={ariaLabel}
      >
        <SelectValue placeholder={loading ? 'Cargando…' : placeholder}>
          {(selected: string | null) => {
            const item = items?.find((i) => String(i.id) === selected)
            return item ? getLabel(item) : loading ? 'Cargando…' : placeholder
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {items?.map((item) => (
          <SelectItem key={item.id} value={String(item.id)}>
            {getLabel(item)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
