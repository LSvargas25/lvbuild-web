import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getSession } from '@/lib/api/auth-storage'
import { apiClient, setSessionExpiredHandler } from '@/lib/api/client'
import { API, server } from '@/test/server'
import { makeSession, signIn } from '@/test/render'

afterEach(() => setSessionExpiredHandler(null))

describe('apiClient', () => {
  it('sends the access token as a Bearer header', async () => {
    signIn()
    let authorization: string | null = null
    server.use(
      http.get(`${API}/ping`, ({ request }) => {
        authorization = request.headers.get('Authorization')
        return HttpResponse.json({ ok: true })
      }),
    )

    await apiClient.get('/ping')

    expect(authorization).toBe('Bearer access-1')
  })

  it('refreshes once for concurrent 401s and retries every request (single-flight)', async () => {
    signIn()
    let refreshCalls = 0
    server.use(
      http.get(`${API}/data/:id`, ({ request, params }) =>
        request.headers.get('Authorization') === 'Bearer access-2'
          ? HttpResponse.json({ id: params.id })
          : new HttpResponse(null, { status: 401 }),
      ),
      http.post(`${API}/auth/refresh-token`, async ({ request }) => {
        refreshCalls++
        const body = (await request.json()) as { refreshToken: string }
        expect(body.refreshToken).toBe('refresh-1')
        await new Promise((resolve) => setTimeout(resolve, 20))
        return HttpResponse.json(makeSession(['ProjectAdmin'], { accessToken: 'access-2', refreshToken: 'refresh-2' }))
      }),
    )

    const results = await Promise.all([1, 2, 3].map((id) => apiClient.get(`/data/${id}`)))

    expect(results.map((r) => r.data.id)).toEqual(['1', '2', '3'])
    expect(refreshCalls).toBe(1)
    expect(getSession()?.accessToken).toBe('access-2')
    expect(getSession()?.refreshToken).toBe('refresh-2')
  })

  it('clears the session and notifies when the refresh fails', async () => {
    signIn()
    const onExpired = vi.fn()
    setSessionExpiredHandler(onExpired)
    server.use(
      http.get(`${API}/data`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${API}/auth/refresh-token`, () => new HttpResponse(null, { status: 401 })),
    )

    await expect(apiClient.get('/data')).rejects.toBeTruthy()

    expect(getSession()).toBeNull()
    expect(onExpired).toHaveBeenCalledTimes(1)
  })

  it('does not treat a failed login as an expired session', async () => {
    const onExpired = vi.fn()
    setSessionExpiredHandler(onExpired)
    const hrefBefore = window.location.href
    let refreshCalls = 0
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json({ statusCode: 401, message: 'Invalid email or password.' }, { status: 401 }),
      ),
      http.post(`${API}/auth/refresh-token`, () => {
        refreshCalls++
        return new HttpResponse(null, { status: 401 })
      }),
    )

    await expect(apiClient.post('/auth/login', { email: 'x@y.z', password: 'bad' })).rejects.toMatchObject({
      response: { status: 401 },
    })

    expect(onExpired).not.toHaveBeenCalled()
    expect(refreshCalls).toBe(0)
    expect(window.location.href).toBe(hrefBefore)
  })

  it('passes other errors through untouched', async () => {
    signIn()
    server.use(http.get(`${API}/data`, () => HttpResponse.json({ message: 'boom' }, { status: 500 })))

    await expect(apiClient.get('/data')).rejects.toMatchObject({ response: { status: 500 } })
    expect(getSession()).not.toBeNull()
  })
})
