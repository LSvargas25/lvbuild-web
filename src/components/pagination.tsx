import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PagedResult } from '@/types/common'

interface PaginationProps {
  page: PagedResult<unknown> | undefined
  onPageChange: (pageNumber: number) => void
}

/** Anterior / siguiente con "Página X de Y · N resultados". Se oculta si cabe en una página. */
export function Pagination({ page, onPageChange }: PaginationProps) {
  if (!page || page.totalCount <= page.pageSize) return null

  const totalPages = Math.max(1, Math.ceil(page.totalCount / page.pageSize))

  return (
    <nav aria-label="Paginación" className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground">
        Página {page.pageNumber} de {totalPages} · {page.totalCount} resultados
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page.pageNumber - 1)}
          disabled={page.pageNumber <= 1}
        >
          <ChevronLeft aria-hidden="true" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page.pageNumber + 1)}
          disabled={page.pageNumber >= totalPages}
        >
          Siguiente
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  )
}
