import { describe, expect, it } from 'vitest'
import {
  addDays,
  daysBetween,
  formatDate,
  formatDateTime,
  localDateOf,
  mondayOf,
  todayLocalISO,
} from '@/lib/dates'

describe('todayLocalISO', () => {
  it('uses Costa Rica time, not UTC', () => {
    // 2026-10-06 03:00 UTC is still 2026-10-05 21:00 in Costa Rica (UTC-6).
    expect(todayLocalISO(new Date('2026-10-06T03:00:00Z'))).toBe('2026-10-05')
  })

  it('switches day at local midnight', () => {
    expect(todayLocalISO(new Date('2026-10-06T05:59:59Z'))).toBe('2026-10-05')
    expect(todayLocalISO(new Date('2026-10-06T06:00:00Z'))).toBe('2026-10-06')
  })
})

describe('addDays', () => {
  it('adds and subtracts calendar days across month and year boundaries', () => {
    expect(addDays('2026-10-05', 7)).toBe('2026-10-12')
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29')
  })
})

describe('mondayOf', () => {
  it.each([
    ['2026-10-05', '2026-10-05'], // lunes
    ['2026-10-08', '2026-10-05'], // jueves
    ['2026-10-11', '2026-10-05'], // domingo
    ['2026-11-01', '2026-10-26'], // domingo de otro mes
  ])('%s -> %s', (date, monday) => {
    expect(mondayOf(date)).toBe(monday)
  })
})

describe('daysBetween', () => {
  it('counts calendar days', () => {
    expect(daysBetween('2026-10-01', '2026-10-31')).toBe(30)
    expect(daysBetween('2026-10-31', '2026-10-01')).toBe(-30)
  })
})

describe('localDateOf / formatDate', () => {
  it('keeps calendar dates from the API as they are', () => {
    expect(localDateOf('2026-10-05T00:00:00')).toBe('2026-10-05')
    expect(formatDate('2026-10-05')).toBe('05/10/2026')
    expect(formatDate('2026-10-05T00:00:00')).toBe('05/10/2026')
  })

  it('converts UTC timestamps to the Costa Rica day', () => {
    expect(localDateOf('2026-10-06T02:00:00Z')).toBe('2026-10-05')
    expect(formatDate('2026-10-06T02:00:00.123Z')).toBe('05/10/2026')
  })

  it('shows a dash for missing values', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDateTime(undefined)).toBe('—')
  })
})

describe('formatDateTime', () => {
  it('shows the Costa Rica wall-clock time (es-CR uses a 12-hour clock)', () => {
    // 20:15 UTC = 14:15 en Costa Rica.
    expect(formatDateTime('2026-10-05T20:15:00Z')).toMatch(/^05\/10\/2026.*02:15\sp\.\sm\.$/)
  })
})
