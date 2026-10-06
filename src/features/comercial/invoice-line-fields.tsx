import { Trash2 } from 'lucide-react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { EntitySelect } from '@/components/entity-select'
import { fieldA11y } from '@/lib/a11y'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { InvoiceFormValues } from '@/features/comercial/invoice-form'
import { formatCRC } from '@/lib/format'
import type { Product } from '@/types/commercial'

interface InvoiceLineFieldsProps {
  index: number
  products: Product[] | undefined
  canRemove: boolean
  onRemove: () => void
}

export function InvoiceLineFields({ index, products, canRemove, onRemove }: InvoiceLineFieldsProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<InvoiceFormValues>()
  const line = useWatch({ control, name: `lines.${index}` })
  const product = products?.find((p) => String(p.id) === line?.productId)
  const productError = errors.lines?.[index]?.productId?.message
  const quantityError = errors.lines?.[index]?.quantity?.message
  const lineNumber = index + 1

  return (
    <div className="flex flex-wrap items-start gap-2">
      <div className="flex min-w-56 flex-1 flex-col gap-1">
        <Controller
          control={control}
          name={`lines.${index}.productId`}
          render={({ field }) => (
            <EntitySelect
              id={`invoice-line-${index}-product`}
              ariaLabel={`Producto de la línea ${lineNumber}`}
              items={products}
              value={field.value}
              onValueChange={field.onChange}
              placeholder="Elige un producto"
              getLabel={(p) =>
                `${p.name} — ${formatCRC(p.unitPrice)}${p.unitOfMeasure ? `/${p.unitOfMeasure}` : ''}`
              }
              invalid={!!productError}
              describedBy={productError ? `invoice-line-${index}-product-error` : undefined}
            />
          )}
        />
        {productError && (
          <p id={`invoice-line-${index}-product-error`} className="text-sm text-destructive">
            {productError}
          </p>
        )}
      </div>
      <div className="flex w-28 flex-col gap-1">
        <Input
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          aria-label={`Cantidad de la línea ${lineNumber}`}
          {...fieldA11y(`invoice-line-${index}-quantity`, quantityError)}
          {...register(`lines.${index}.quantity`, { valueAsNumber: true })}
        />
        {quantityError && (
          <p id={`invoice-line-${index}-quantity-error`} className="text-sm text-destructive">
            {quantityError}
          </p>
        )}
      </div>
      <span className="w-32 pt-1.5 text-right font-mono text-sm tabular-nums">
        {formatCRC((product?.unitPrice ?? 0) * (Number(line?.quantity) || 0))}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        disabled={!canRemove}
        aria-label={`Quitar línea ${lineNumber}`}
      >
        <Trash2 aria-hidden="true" />
        Quitar
      </Button>
    </div>
  )
}
