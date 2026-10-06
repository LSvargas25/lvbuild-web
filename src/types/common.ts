/** Página de resultados de la API (`PagedResult<T>` del backend). */
export interface PagedResult<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

/** Entidad mínima para listas de selección. */
export interface NamedEntity {
  id: number
  name: string
}
