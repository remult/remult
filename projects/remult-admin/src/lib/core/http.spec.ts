import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildHeaders, createHttpClient } from './http.js'

const noStorage = () => null

describe('buildHeaders', () => {
  it('bearer wins over key', () => {
    const h = buildHeaders({
      bearerAuth: 'abc',
      keyForBearerAuth: 'token',
      customHeaders: '',
      readLocalStorage: () => 'fromLs',
    })
    expect(h).toEqual({ authorization: 'Bearer abc' })
  })

  it('key reads localStorage', () => {
    const read = vi.fn(() => 'fromLs')
    const h = buildHeaders({
      bearerAuth: '',
      keyForBearerAuth: 'token',
      customHeaders: '',
      readLocalStorage: read,
    })
    expect(read).toHaveBeenCalledWith('token')
    expect(h).toEqual({ authorization: 'Bearer fromLs' })
  })

  it('key with nothing stored sends no authorization', () => {
    const h = buildHeaders({
      bearerAuth: '',
      keyForBearerAuth: 'token',
      customHeaders: '',
      readLocalStorage: noStorage,
    })
    expect(h).toEqual({})
  })

  it('parses custom headers, ignores blank lines, keeps values with ":"', () => {
    const h = buildHeaders({
      bearerAuth: '',
      keyForBearerAuth: '',
      customHeaders: 'a: 1\n\n  \nb: 2\nx-url: http://host:3000/p\nnocolon\n',
      readLocalStorage: noStorage,
    })
    expect(h).toEqual({ a: '1', b: '2', 'x-url': 'http://host:3000/p' })
  })

  it('merges init headers', () => {
    const h = buildHeaders(
      {
        bearerAuth: 'abc',
        keyForBearerAuth: '',
        customHeaders: '',
        readLocalStorage: noStorage,
      },
      { 'Content-Type': 'application/json' },
    )
    expect(h).toEqual({
      'content-type': 'application/json',
      authorization: 'Bearer abc',
    })
  })
})

describe('createHttpClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>
  beforeEach(() => {
    vi.useFakeTimers()
    fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response('[]', { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  const client = (onForbidden = vi.fn()) =>
    createHttpClient({ getHeaders: () => ({ authorization: 'Bearer t' }), onForbidden })

  it('dedupes two GETs on the same url within 2s', async () => {
    const http = client()
    const r1 = await http('/api/tasks')
    const r2 = await http('/api/tasks')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(await r1.json()).toEqual([])
    expect(await r2.json()).toEqual([])
  })

  it('fetches again after the dedupe window', async () => {
    const http = client()
    await http('/api/tasks')
    vi.advanceTimersByTime(2001)
    await http('/api/tasks')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('never caches POST', async () => {
    const http = client()
    await http('/api/tasks', { method: 'POST', body: '{}' })
    await http('/api/tasks', { method: 'POST', body: '{}' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it.each(['POST', 'PUT', 'DELETE'])(
    '%s invalidates the GET cache',
    async (method) => {
      const http = client()
      await http('/api/tasks')
      await http('/api/tasks/1', { method })
      await http('/api/tasks')
      const gets = fetchMock.mock.calls.filter(
        ([, init]) => (init?.method ?? 'GET') === 'GET',
      )
      expect(gets).toHaveLength(2)
    },
  )

  it('sends headers from getHeaders merged with init headers', async () => {
    const http = client()
    await http('/api/tasks', { headers: { 'content-type': 'application/json' } })
    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(init.headers).toEqual({
      'content-type': 'application/json',
      authorization: 'Bearer t',
    })
  })

  it.each([401, 403])('%s on /api/tasks calls onForbidden("tasks")', async (status) => {
    fetchMock.mockImplementation(async () => new Response('', { status }))
    const onForbidden = vi.fn()
    const http = client(onForbidden)
    await http('/api/tasks')
    expect(onForbidden).toHaveBeenCalledWith('tasks')
  })

  it('does not keep failed responses in the cache', async () => {
    fetchMock.mockImplementationOnce(async () => new Response('', { status: 403 }))
    const http = client()
    await http('/api/tasks')
    await http('/api/tasks')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
