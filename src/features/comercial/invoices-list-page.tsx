import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EntitySelect } from '@/components/entity-select'
import { PageHeader } from '@/components/page-header'
import { ErrorState, LoadingState } from '@/components/page-state'
import { Pagination } from '@/components/pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { catalogQueries, nameOf } from '@/lib/api/catalogs'
import { getInvoicesByBranch } from '@/lib/api/commercial'
import { formatDate } from '@/lib/dates'
import { formatCRC } from '@/lib/format'
import { INVOICE_STATUS } from '@/lib/status-labels'

export function InvoicesListPage() {
  const branchesQuery = useQuery(catalogQueries.branches)
  const customersQuery = useQuery(catalogQueries.customers)
  const [selectedBranch, setSelectedBranch] = useState('')
  const [page, setPage] = useState(1)

  const branchId = selectedBranch || String(branchesQuery.data?.[0]?.id ?? '')

  const invoicesQuery = useQuery({
    queryKey: ['invoices', branchId, page],
    queryFn: () => getInvoicesByBranch(Number(branchId), page),
    enabled: branchId !== '',
    placeholderData: keepPreviousData,
  })

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Facturación"
        actions={<Button render={<Link to="/comercial/facturas/nueva" />}>Nueva factura</Button>}
      />
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="invoices-branch" className="text-sm text-muted-foreground">
          Sucursal
        </label>
        <EntitySelect
          id="invoices-branch"
          className="w-60"
          items={branchesQuery.data}
          value={branchId}
          onValueChange={(value) => {
            setSelectedBranch(value)
            setPage(1)
          }}
          placeholder="Elige una sucursal"
        />
      </div>

      {branchesQuery.isError ? (
        <ErrorState error={branchesQuery.error} />
      ) : invoicesQuery.isError ? (
        <ErrorState error={invoicesQuery.error} />
      ) : !invoicesQuery.data ? (
        <LoadingState />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Factura</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoicesQuery.data.items.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <Link
                      to={`/comercial/facturas/${invoice.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {invoice.invoiceNumber || `Borrador #${invoice.id}`}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(invoice.date)}</TableCell>
                  <TableCell>
                    {invoice.customerId ? nameOf(customersQuery.data, invoice.customerId) : 'Consumidor final'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={INVOICE_STATUS[invoice.status].variant}>
                      {INVOICE_STATUS[invoice.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{formatCRC(invoice.total)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {invoice.status === 'Issued' ? formatCRC(invoice.balance) : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {invoicesQuery.data.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No hay facturas en esta sucursal todavía.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Pagination page={invoicesQuery.data} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
