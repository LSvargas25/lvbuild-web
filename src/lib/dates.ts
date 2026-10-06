/**
 * Fechas en la zona de Costa Rica (UTC-6, sin horario de verano).
 *
 * La API devuelve dos tipos de fecha:
 * - Fechas de calendario (columnas `date`: semanas de bitácora, inicio de proyecto, fecha de
 *   oferta…) sin zona: `2026-10-05` o `2026-10-05T00:00:00`. Son un día, no un instante.
 * - Marcas de tiempo (`timestamptz`) en UTC: `2026-10-05T20:15:00Z`. Son un instante.
 *
 * Nunca usar `new Date('YYYY-MM-DD')` (lo interpreta como medianoche UTC y en Costa Rica
 * muestra el día anterior) ni `toISOString().slice(0, 10)` para "hoy" (después de las 18:00
 * en Costa Rica ya es el día siguiente en UTC).
 */

export const TIME_ZONE = 'America/Costa_Rica'

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/
const HAS_ZONE = /(Z|[+-]\d{2}:?\d{2})$/i

const isoDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const displayDateFormatter = new Intl.DateTimeFormat('es-CR', {
  timeZone: 'UTC',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const displayDateTimeFormatter = new Intl.DateTimeFormat('es-CR', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function parseIsoDate(iso: string): Date {
  const match = ISO_DATE.exec(iso)
  if (!match) throw new Error(`Fecha inválida: ${iso}`)
  const [, y, m, d] = match
  return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)))
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Hoy en Costa Rica, como `YYYY-MM-DD`. */
export function todayLocalISO(now: Date = new Date()): string {
  return isoDateFormatter.format(now)
}

/** Suma (o resta) días a una fecha de calendario `YYYY-MM-DD`. */
export function addDays(iso: string, days: number): string {
  const date = parseIsoDate(iso)
  date.setUTCDate(date.getUTCDate() + days)
  return toIso(date)
}

/** Lunes de la semana de la fecha dada (`YYYY-MM-DD`). */
export function mondayOf(iso: string): string {
  const day = parseIsoDate(iso).getUTCDay()
  return addDays(iso, day === 0 ? -6 : 1 - day)
}

/** Días entre dos fechas de calendario (`to - from`). */
export function daysBetween(from: string, to: string): number {
  return Math.round((parseIsoDate(to).getTime() - parseIsoDate(from).getTime()) / 86_400_000)
}

/** Parte de calendario (`YYYY-MM-DD`) de una fecha de la API, sin convertir de zona. */
export function toISODate(value: string): string {
  return toIso(parseIsoDate(value))
}

/**
 * Día de Costa Rica (`YYYY-MM-DD`) de un valor de la API: las fechas de calendario se toman tal
 * cual y las marcas de tiempo UTC se convierten a la zona local.
 */
export function localDateOf(value: string): string {
  return HAS_ZONE.test(value) ? todayLocalISO(new Date(value)) : toISODate(value)
}

/** Fecha para mostrar (`dd/mm/aaaa`). */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return displayDateFormatter.format(parseIsoDate(localDateOf(value)))
}

/** Fecha y hora de Costa Rica para una marca de tiempo de la API. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  return displayDateTimeFormatter.format(new Date(HAS_ZONE.test(value) ? value : `${value}Z`))
}
