import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getBranches, getInvoicesByBranch } from '@/lib/api/commercial'
import type { InvoiceStatus } from '@/types/commercial'

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  Draft: 'Borrador',
  Issued: 'Emitida',
  Cancelled: 'Anulada',
}

export function InvoicesListPage() {
  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: getBranches })
  const [branchId, setBranchId] = useState<number | null>(null)

  const activeBranchId = branchId ?? branchesQuery.data?.[0]?.id ?? null

  const invoicesQuery = useQuery({
    queryKey: ['invoices', activeBranchId],
    queryFn: () => getInvoicesByBranch(activeBranchId!),
    enabled: activeBranchId !== null,
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Select
          value={activeBranchId ? String(activeBranchId) : undefined}
          onValueChange={(value) => setBranchId(Number(value))}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Sucursal" />
          </SelectTrigger>
          <SelectContent>
            {branchesQuery.data?.map((branch) => (
              <SelectItem key={branch.id} value={String(branch.id)}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button render={<Link to="/comercial/facturas/nueva" />}>+ Nueva factura</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Factura</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoicesQuery.data?.items.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>
                <Link
                  to={`/comercial/facturas/${invoice.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {invoice.invoiceNumber ?? `#${invoice.id}`}
                </Link>
              </TableCell>
              <TableCell>{new Date(invoice.date).toLocaleDateString('es-CR')}</TableCell>
              <TableCell>
                <Badge variant={invoice.status === 'Cancelled' ? 'destructive' : 'secondary'}>
                  {STATUS_LABEL[invoice.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                ₡{invoice.total.toLocaleString('es-CR')}
              </TableCell>
            </TableRow>
          ))}
          {invoicesQuery.data?.items.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No hay facturas en esta sucursal todavía.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
