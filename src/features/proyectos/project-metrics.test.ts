import { describe, expect, it } from 'vitest'
import { budgetUsage, timeProgress, usageTone } from '@/features/proyectos/project-metrics'

describe('timeProgress', () => {
  const start = '2026-10-01T00:00:00'
  const end = '2026-10-31T00:00:00'

  it('measures elapsed calendar time between start and end', () => {
    expect(timeProgress(start, end, '2026-10-01')).toBe(0)
    expect(timeProgress(start, end, '2026-10-16')).toBe(50)
    expect(timeProgress(start, end, '2026-10-31')).toBe(100)
  })

  it('clamps before the start and after the end', () => {
    expect(timeProgress(start, end, '2026-09-01')).toBe(0)
    expect(timeProgress(start, end, '2026-12-01')).toBe(100)
  })

  it('handles projects that start and end on the same day', () => {
    expect(timeProgress('2026-10-10', '2026-10-10', '2026-10-09')).toBe(0)
    expect(timeProgress('2026-10-10', '2026-10-10', '2026-10-10')).toBe(100)
  })
})

describe('budgetUsage', () => {
  it('returns the spent percentage with one decimal', () => {
    expect(budgetUsage(250, 1000)).toBe(25)
    expect(budgetUsage(1, 3)).toBe(33.3)
    expect(budgetUsage(1500, 1000)).toBe(150)
  })

  it('returns null without a budget', () => {
    expect(budgetUsage(100, undefined)).toBeNull()
    expect(budgetUsage(100, 0)).toBeNull()
  })
})

describe('usageTone', () => {
  it('flags spending ahead of progress and over budget', () => {
    expect(usageTone(40, 50)).toBe('ok')
    expect(usageTone(70, 50)).toBe('warning')
    expect(usageTone(110, 90)).toBe('danger')
    expect(usageTone(null, 50)).toBe('muted')
  })
})
