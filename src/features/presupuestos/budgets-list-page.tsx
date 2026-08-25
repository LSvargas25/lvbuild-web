import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
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
import { STATUS_LABEL, STATUS_VARIANT } from '@/features/presupuestos/budget-status'
import { getBudgets } from '@/lib/api/budgets'

export function BudgetsListPage() {
  const budgetsQuery = useQuery({ queryKey: ['budgets'], queryFn: getBudgets })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Presupuestos</h1>
        <Button render={<Link to="/presupuestos/nuevo" />}>+ Nuevo presupuesto</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {budgetsQuery.data?.items.map((budget) => (
            <TableRow key={budget.id}>
              <TableCell>
                <Link
                  to={`/presupuestos/${budget.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {budget.name}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[budget.status]}>
                  {STATUS_LABEL[budget.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                ₡{budget.totalBudget.toLocaleString('es-CR')}
              </TableCell>
            </TableRow>
          ))}
          {budgetsQuery.data?.items.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                No hay presupuestos todavía.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
