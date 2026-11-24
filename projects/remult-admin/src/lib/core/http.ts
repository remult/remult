const REGEX_NEWLINE = /\r?\n/

function toRecord(init?: HeadersInit): Record<string, string> {
  const out: Record<string, string> = {}
  if (init) new Headers(init).forEach((v, k) => (out[k.toLowerCase()] = v))
  return out
}

function parseCustomHeaders(text: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of text.split(REGEX_NEWLINE)) {
    const i = line.indexOf(':')
    if (i <= 0) continue
    const key = line.slice(0, i).trim()
    if (key) out[key] = line.slice(i + 1).trim()
  }
  return out
}

export function buildHeaders(
  o: {
    bearerAuth: string
    keyForBearerAuth: string
    customHeaders: string
    readLocalStorage: (k: string) => string | null
  },
  init?: HeadersInit,
): Record<string, string> {
  const headers = toRecord(init)
  const token = o.bearerAuth
    ? o.bearerAuth
    : o.keyForBearerAuth
      ? o.readLocalStorage(o.keyForBearerAuth)
      : null
  if (token) headers.authorization = 'Bearer ' + token
  return { ...headers, ...parseCustomHeaders(o.customHeaders ?? '') }
}

function urlOf(input: RequestInfo | URL) {
  return input instanceof Request ? input.url : String(input)
}

/** First path segment after `apiUrl` (remult's entity key), else the last segment. */
function entityKeyOf(url: string, apiUrl?: string) {
  const path = new URL(url, 'http://local').pathname
  const segments = path.split('/').filter(Boolean)
  if (apiUrl) {
    const base = new URL(apiUrl, 'http://local').pathname
      .split('/')
      .filter(Boolean)
    if (
      base.every((s, i) => segments[i] === s) &&
      segments.length > base.length
    )
      return segments[base.length]
  }
  return segments.at(-1) ?? ''
}

export function createHttpClient(o: {
  getHeaders: () => Record<string, string>
  onForbidden: (entityKey: string) => void
  onUnauthorized?: () => void
  dedupeMs?: number
  apiUrl?: string
}): typeof fetch {
  const dedupeMs = o.dedupeMs ?? 2000
  const cache = new Map<string, { promise: Promise<Response>; at: number }>()

  const send = async (input: RequestInfo | URL, init?: RequestInit) => {
    const res = await fetch(input, {
      ...init,
      headers: { ...toRecord(init?.headers), ...o.getHeaders() },
    })
    // a 401 is about the token, not the entity: only fall back to Forbidden without a handler
    if (res.status === 401 && o.onUnauthorized) o.onUnauthorized()
    else if (res.status === 401 || res.status === 403)
      o.onForbidden(entityKeyOf(urlOf(input), o.apiUrl))
    return res
  }

  const client = async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = (
      init?.method ?? (input instanceof Request ? input.method : 'GET')
    ).toUpperCase()

    if (method !== 'GET') {
      // a write makes every cached read stale; clear again after, for GETs that raced it
      cache.clear()
      try {
        return await send(input, init)
      } finally {
        cache.clear()
      }
    }

    const key = urlOf(input)
    const now = Date.now()
    const hit = cache.get(key)
    if (hit && now - hit.at < dedupeMs) return (await hit.promise).clone()

    const promise = send(input, init)
    const entry = { promise, at: now }
    cache.set(key, entry)
    try {
      const res = await promise
      // never replay an error: a retry after entering a token must hit the server
      if (!res.ok && cache.get(key) === entry) cache.delete(key)
      return res.clone()
    } catch (err) {
      if (cache.get(key) === entry) cache.delete(key)
      throw err
    }
  }
  return client as typeof fetch
}
