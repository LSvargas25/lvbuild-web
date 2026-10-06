import { apiClient } from '@/lib/api/client'
import { getAllPages } from '@/lib/api/paging'
import type { BranchOption, Product } from '@/types/commercial'
import type { Customer } from '@/types/customers'
import type { Worker } from '@/types/sitelogs'

/**
 * Catálogos compartidos. Se cachean con estas claves de React Query para que todas las
 * pantallas reutilicen la misma copia.
 */
export const catalogQueries = {
  // Sucursales activas, para todos los roles (el listado de /branches es solo de gerencia).
  branches: {
    queryKey: ['branches'],
    queryFn: () => apiClient.get<BranchOption[]>('/branches/options').then((res) => res.data),
  },
  customers: { queryKey: ['customers'], queryFn: () => getAllPages<Customer>('/customers') },
  workers: { queryKey: ['workers'], queryFn: () => getAllPages<Worker>('/workers') },
  products: { queryKey: ['products'], queryFn: () => getAllPages<Product>('/products') },
} as const

/**
 * Sucursales donde se puede abrir caja y facturar: la API solo lo permite en las comerciales
 * (oficinas y bodegas nunca tienen facturas).
 */
export function commercialBranches(branches: BranchOption[] | undefined): BranchOption[] {
  return (branches ?? []).filter((branch) => branch.branchType === 'Commercial')
}

/** Nombre de una entidad por id, o `#id` si el catálogo no la tiene (o no cargó). */
export function nameOf(items: { id: number; name: string }[] | undefined, id: number | null) {
  if (id == null) return '—'
  return items?.find((item) => item.id === id)?.name ?? `#${id}`
}
