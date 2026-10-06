import { getAllPages } from '@/lib/api/paging'
import type { Branch, Product } from '@/types/commercial'
import type { Customer } from '@/types/customers'
import type { Worker } from '@/types/sitelogs'

/**
 * Catálogos compartidos. Se cachean con estas claves de React Query para que todas las
 * pantallas reutilicen la misma copia.
 */
export const catalogQueries = {
  branches: { queryKey: ['branches'], queryFn: () => getAllPages<Branch>('/branches') },
  customers: { queryKey: ['customers'], queryFn: () => getAllPages<Customer>('/customers') },
  workers: { queryKey: ['workers'], queryFn: () => getAllPages<Worker>('/workers') },
  products: { queryKey: ['products'], queryFn: () => getAllPages<Product>('/products') },
} as const

/** Nombre de una entidad por id, o `#id` si el catálogo no la tiene (o no cargó). */
export function nameOf(items: { id: number; name: string }[] | undefined, id: number | null) {
  if (id == null) return '—'
  return items?.find((item) => item.id === id)?.name ?? `#${id}`
}
