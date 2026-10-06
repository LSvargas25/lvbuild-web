import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import { MAX_TRANSIENT_RETRIES, retryDelayMs, shouldRetryQuery } from '@/lib/api/retry'

function axiosError(status: number | null) {
  const config = { headers: new AxiosHeaders() }
  return new AxiosError(
    'Request failed',
    undefined,
    config,
    undefined,
    status === null ? undefined : { status, statusText: '', headers: {}, config, data: undefined },
  )
}

describe('shouldRetryQuery', () => {
  it('never retries client errors', () => {
    for (const status of [400, 401, 403, 404, 409]) {
      expect(shouldRetryQuery(0, axiosError(status))).toBe(false)
    }
  })

  it('keeps retrying network failures and 502/503/504 while the server wakes up', () => {
    for (const error of [axiosError(null), axiosError(502), axiosError(503), axiosError(504)]) {
      expect(shouldRetryQuery(0, error)).toBe(true)
      expect(shouldRetryQuery(MAX_TRANSIENT_RETRIES - 1, error)).toBe(true)
      expect(shouldRetryQuery(MAX_TRANSIENT_RETRIES, error)).toBe(false)
    }
  })

  it('retries other server errors only once', () => {
    expect(shouldRetryQuery(0, axiosError(500))).toBe(true)
    expect(shouldRetryQuery(1, axiosError(500))).toBe(false)
  })
})

describe('retryDelayMs', () => {
  it('backs off exponentially up to 10 s, covering a ~50 s cold start', () => {
    const delays = Array.from({ length: MAX_TRANSIENT_RETRIES }, (_, i) => retryDelayMs(i))
    expect(delays.slice(0, 5)).toEqual([1000, 2000, 4000, 8000, 10_000])
    expect(Math.max(...delays)).toBe(10_000)
    expect(delays.reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(50_000)
  })
})
