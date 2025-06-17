import type { ParseOptions, SerializeOptions } from '../src/remult-cookie.js'
import type { ResponseRequiredForSSE } from '../SseSubscriptionServer.js'
import type { GenericResponse } from './remult-api-server.js'

export interface GenericRequest {
  url?: URL
  headers: Record<string, string>
  json?: Object
}

export interface TypicalRouteInfo {
  req?: GenericRequest
  res: GenericResponse
  cookie(name: string): {
    set(value: string, opts?: SerializeOptions): void
    get(opts?: ParseOptions): string | undefined
    delete(opts?: SerializeOptions): void
  }
  setHeaders(headers: Record<string, string>): void
  sse: ResponseRequiredForSSE
}

export type GenericRequestHandler = (
  stuffForRouter: TypicalRouteInfo,
  next: VoidFunction,
) => void

export const getBaseTypicalRouteInfo = (o: {
  url?: URL | string
  headers?: Headers | Record<string, string>
}) => {
  const { url, headers } = o

  let urlToUse: URL | undefined
  try {
    urlToUse = url ? (typeof url === 'string' ? new URL(url) : url) : undefined
  } catch (error) {}

  let headersToUse: Record<string, string> = {}
  if (headers) {
    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        headersToUse[key] = value
      })
    } else {
      headersToUse = headers
    }
  }

  const b: TypicalRouteInfo = {
    req: {
      url: urlToUse,
      headers: headersToUse,
    },
    res: {
      end: () => {},
      json: () => {},
      send: () => {},
      redirect: () => {},
      status: () => {
        return b.res
      },
    },
    sse: {
      write: () => {},
      writeHead: () => {},
    },
    cookie: () => {
      return {
        set: () => {},
        get: () => {
          return undefined
        },
        delete: (options = {}) => {},
      }
    },
    setHeaders: () => {},
  }
  return b
}
