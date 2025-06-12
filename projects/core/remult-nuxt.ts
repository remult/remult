import type { H3Event } from 'h3'
import { getRequestURL, readBody, setCookie } from 'h3'
import type {
  RemultServer,
  RemultServerCore,
  RemultServerOptions,
} from './server/index.js'
import { createRemultServer } from './server/index.js'
import type {
  ServerCoreOptions,
  TypicalResponse,
} from './server/remult-api-server.js'
import { toResponse } from './server/toResponse.js'
import {
  mergeOptions,
  parse,
  type SerializeOptions,
} from './src/remult-cookie.js'

export function remultApi(
  options: RemultServerOptions<H3Event>,
): RemultNuxtServer {
  const coreOptions: ServerCoreOptions<H3Event> = {
    buildGenericRequestInfo: (event) => {
      return {
        method: event.node.req.method,
        url: event.node.req.url,
        on: (a: 'close', b: () => void) =>
          event.node.req.on('close', () => {
            b()
          }),
      }
    },
    getRequestBody: async (event) => await readBody(event),
  }
  const result = createRemultServer<H3Event>(options, coreOptions)

  function toOptions(options: SerializeOptions) {
    const fwOptions: any = { ...options }
    // Convert sameSite to the format Hono expects
    // if (typeof fwOptions.sameSite === 'boolean') {
    //   fwOptions.sameSite = fwOptions.sameSite ? 'strict' : 'lax'
    // }
    return fwOptions
  }

  const handler = async (event: H3Event) => {
    let sseResponse: Response | undefined = undefined

    const trToUse: TypicalResponse = {
      res: {
        redirect: () => {},
        end: () => {},
        send: (html, headers) => {
          if (headers?.['Content-Type']) {
            event.node.res.setHeader('Content-Type', headers['Content-Type'])
          }
        },
        json: () => {},
        status: () => {
          return trToUse.res
        },
      },
      sse: {
        write: (data) => {
          event.node.res.write(data)
        },
        writeHead: (status, headers) => {
          event.node.res.writeHead(status, headers)
          sseResponse = new Response(null, { headers })
        },
      },
      cookie: (name) => {
        return {
          set: (value, options = {}) => {
            setCookie(event, name, value, toOptions(mergeOptions(options)))
          },
          get: (options = {}) => {
            const cookieHeader = event.node.req.headers.cookie
            return cookieHeader ? parse(cookieHeader, options)[name] : undefined
          },
          delete: (options = {}) => {
            setCookie(
              event,
              name,
              '',
              toOptions(mergeOptions({ ...options, maxAge: 0 })),
            )
          },
        }
      },
      setHeaders: (headers) => {
        Object.entries(headers).forEach(([key, value]) => {
          event.node.res.setHeader(key, value)
        })
      },
    }
    // TODO: bring back SSE here ?
    // if (sse) {
    //   await new Promise((resolve) => {
    //     event.node.req.on('close', () => resolve({}))
    //   })
    // }

    const remultHandlerResponse = await result.handle(event, trToUse)
    return toResponse({
      // sseResponse,
      remultHandlerResponse,
      requestUrl: getRequestURL(event).toString(),
    })
  }

  return Object.assign(handler, {
    getRemult: (req: H3Event) => result.getRemult(req),
    openApiDoc: (options: { title: string }) => result.openApiDoc(options),
    withRemult<T>(request: H3Event, what: () => Promise<T>): Promise<T> {
      return result.withRemultAsync(request, what)
    },
    GET: handler,
    PUT: handler,
    POST: handler,
    DELETE: handler,
  })
}

export type RemultNuxtServer = RemultServerCore<H3Event> &
  ((event: H3Event) => Promise<any>) & {
    withRemult: RemultServer<H3Event>['withRemultAsync']
    GET: (event: H3Event) => Promise<any>
    PUT: (event: H3Event) => Promise<any>
    POST: (event: H3Event) => Promise<any>
    DELETE: (event: H3Event) => Promise<any>
  }

/** @deprecated use remultApi instead */
export const remultNuxt = remultApi
