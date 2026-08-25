import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
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
import { getOpenRegisterId } from '@/features/comercial/cash-register-storage'
import { createInvoice, getCashRegister, getProducts } from '@/lib/api/commercial'
import type { InvoicePaymentType } from '@/types/commercial'

interface DraftLine {
  productId: number | null
  quantity: number
}

export function NewInvoicePage() {
  const navigate = useNavigate()
  const registerId = getOpenRegisterId()
  const [lines, setLines] = useState<DraftLine[]>([{ productId: null, quantity: 1 }])
  const [paymentType, setPaymentType] = useState<InvoicePaymentType>('Contado')

  const registerQuery = useQuery({
    queryKey: ['cash-register', registerId],
    queryFn: () => getCashRegister(registerId!),
    enabled: registerId !== null,
  })
  const productsQuery = useQuery({ queryKey: ['products'], queryFn: getProducts })

  const mutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: (invoice) => {
      toast.success('Factura creada como borrador')
      navigate(`/comercial/facturas/${invoice.id}`)
    },
    onError: () => toast.error('No se pudo crear la factura. Revisá el stock disponible.'),
  })

  if (registerId === null) {
    return (
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>No hay caja abierta</CardTitle>
          <CardDescription>Abrí una caja antes de facturar.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button render={<Link to="/comercial/caja" />}>Ir a caja</Button>
        </CardContent>
      </Card>
    )
  }

  const products = productsQuery.data ?? []

  function priceOf(productId: number | null) {
    return products.find((p) => p.id === productId)?.unitPrice ?? 0
  }

  const subtotal = lines.reduce((sum, line) => sum + priceOf(line.productId) * line.quantity, 0)
  const tax = subtotal * 0.13
  const total = subtotal + tax

  function updateLine(index: number, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)))
  }

  function addLine() {
    setLines((prev) => [...prev, { productId: null, quantity: 1 }])
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit() {
    const details = lines
      .filter((line): line is { productId: number; quantity: number } => line.productId !== null)
      .map((line) => ({ productId: line.productId, quantity: line.quantity }))

    if (details.length === 0) {
      toast.error('Agregá al menos un producto.')
      return
    }

    mutation.mutate({
      branchId: registerQuery.data!.branchId,
      cashRegisterId: registerId!,
      customerId: null,
      paymentType,
      details,
    })
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Nueva factura</CardTitle>
          <CardDescription>Consumidor final · Sucursal #{registerQuery.data?.branchId}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Tipo de pago</Label>
            <Select
              value={paymentType}
              onValueChange={(value) => setPaymentType(value as InvoicePaymentType)}
            >
              <SelectTrigger className="w-40">
                <SelectValue>
                  {(value: InvoicePaymentType) => (value === 'Credito' ? 'Crédito' : 'Contado')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Contado">Contado</SelectItem>
                <SelectItem value="Credito">Crédito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-3">
            <Label>Productos</Label>
            {lines.map((line, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="flex flex-1 flex-col gap-1.5">
                  <Select
                    value={line.productId ? String(line.productId) : undefined}
                    onValueChange={(value) => updateLine(index, { productId: Number(value) })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Elegí un producto">
                        {(value: string | null) => {
                          const product = products.find((p) => String(p.id) === value)
                          return product
                            ? `${product.name} — ₡${product.unitPrice.toLocaleString('es-CR')}/${product.unitOfMeasure}`
                            : 'Elegí un producto'
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={String(product.id)}>
                          {product.name} — ₡{product.unitPrice.toLocaleString('es-CR')}/
                          {product.unitOfMeasure}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  type="number"
                  min={0.01}
                  step="0.01"
                  className="w-24"
                  value={line.quantity}
                  onChange={(e) => updateLine(index, { quantity: Number(e.target.value) })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLine(index)}
                  disabled={lines.length === 1}
                >
                  Quitar
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addLine}>
              + Agregar producto
            </Button>
          </div>

          <div className="flex flex-col gap-1 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono tabular-nums">₡{subtotal.toLocaleString('es-CR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA (13%)</span>
              <span className="font-mono tabular-nums">₡{tax.toLocaleString('es-CR')}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total estimado</span>
              <span className="font-mono tabular-nums">₡{total.toLocaleString('es-CR')}</span>
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Creando…' : 'Crear factura (borrador)'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
