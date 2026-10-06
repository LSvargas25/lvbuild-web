import { describe, expect, it } from 'vitest'
import { formatCRC, formatPercent } from '@/lib/format'

// es-CR separa miles con un espacio fino; se normaliza para comparar.
const plain = (value: string) => value.replace(/\s/g, ' ')

describe('formatCRC', () => {
  it('formats colones with up to two decimals', () => {
    expect(plain(formatCRC(1250000))).toBe('₡1 250 000')
    expect(plain(formatCRC(1234.5))).toBe('₡1 234,5')
    expect(formatCRC(0)).toBe('₡0')
  })

  it('puts the sign before the currency symbol', () => {
    expect(plain(formatCRC(-25000))).toBe('-₡25 000')
  })

  it('shows a dash for missing values', () => {
    expect(formatCRC(null)).toBe('—')
    expect(formatCRC(undefined)).toBe('—')
  })
})

describe('formatPercent', () => {
  it('rounds to one decimal', () => {
    expect(plain(formatPercent(12.345))).toBe('12,3 %')
    expect(formatPercent(null)).toBe('—')
    expect(formatPercent(Number.NaN)).toBe('—')
  })
})
