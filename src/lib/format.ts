const crcFormatter = new Intl.NumberFormat('es-CR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/** Monto en colones: `₡1 250 000,5`. */
export function formatCRC(value: number | null | undefined): string {
  if (value == null) return '—'
  const formatted = crcFormatter.format(Math.abs(value))
  return value < 0 ? `-₡${formatted}` : `₡${formatted}`
}

/** Porcentaje con hasta un decimal: `12,5 %`. */
export function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—'
  return `${value.toLocaleString('es-CR', { maximumFractionDigits: 1 })} %`
}
