import { apiClient } from '@/lib/api/client'
import type { PagedResult } from '@/types/common'

export const DEFAULT_PAGE_SIZE = 20
const CATALOG_PAGE_SIZE = 100

export function getPage<T>(
  url: string,
  pageNumber = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  params: Record<string, unknown> = {},
) {
  return apiClient
    .get<PagedResult<T>>(url, { params: { ...params, pageNumber, pageSize } })
    .then((res) => res.data)
}

/** Recorre todas las páginas: para catálogos (sucursales, clientes, trabajadores, productos). */
export async function getAllPages<T>(url: string, params: Record<string, unknown> = {}): Promise<T[]> {
  const items: T[] = []
  for (let pageNumber = 1; ; pageNumber++) {
    const page = await getPage<T>(url, pageNumber, CATALOG_PAGE_SIZE, params)
    items.push(...page.items)
    if (page.items.length === 0 || items.length >= page.totalCount) return items
  }
}
