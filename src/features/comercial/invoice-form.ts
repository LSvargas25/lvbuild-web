import { z } from 'zod'
import { positive, requiredId } from '@/lib/validation'
import type { CreateInvoiceRequest, Product } from '@/types/commercial'

/** IVA de Costa Rica; el backend aplica la misma tasa al emitir. */
export const TAX_RATE = 0.13

export const invoiceSchema = z.object({
  customerId: z.string(),
  paymentType: z.enum(['Contado', 'Credito']),
  lines: z
    .array(z.object({ productId: requiredId('Elige un producto'), quantity: positive() }))
    .min(1, 'Agrega al menos un producto'),
})

export type InvoiceFormValues = z.infer<typeof invoiceSchema>

export const emptyLine = () => ({ productId: '', quantity: 1 })

export function invoiceTotals(lines: InvoiceFormValues['lines'], products: Product[] | undefined) {
  const subtotal = lines.reduce((sum, line) => {
    const price = products?.find((p) => String(p.id) === line.productId)?.unitPrice ?? 0
    return sum + price * (Number(line.quantity) || 0)
  }, 0)
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100
  return { subtotal, tax, total: subtotal + tax }
}

export function toCreateInvoiceRequest(
  values: InvoiceFormValues,
  branchId: number,
  cashRegisterId: number,
): CreateInvoiceRequest {
  return {
    branchId,
    cashRegisterId,
    customerId: values.customerId ? Number(values.customerId) : null,
    paymentType: values.paymentType,
    details: values.lines.map((l) => ({ productId: Number(l.productId), quantity: l.quantity })),
  }
}
