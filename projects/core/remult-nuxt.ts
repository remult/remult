import type { ResponseRequiredForSSE } from './SseSubscriptionServer.js'
import type { H3Event } from 'h3'
import { readBody, setResponseStatus } from 'h3'
import type {
  GenericResponse,
  RemultServerCore,
  RemultServerOptions,
  RemultServer,
} from './server/index.js'
import { createRemultServer } from './server/index.js'
import { parse, serialize } from './src/remult-cookie.js'
import { toResponse } from './server/toResponse.js'

export function remultApi(
  options: RemultServerOptions<H3Event>,
): RemultNuxtServer {
  const result = createRemultServer<H3Event>(options, {
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
  })

  const handler = async (event: H3Event) => {
    let sseResponse: Response | undefined = undefined

    const response: GenericResponse & ResponseRequiredForSSE = {
      setCookie: (name, value, options = {}) => {
        event.node.res.setHeader('Set-Cookie', serialize(name, value, options))
      },
      getCookie: (name, options) => {
        const cookieHeader = event.node.req.headers.cookie
        return cookieHeader ? parse(cookieHeader, options)[name] : undefined
      },
      deleteCookie: (name, options = {}) => {
        const cookieOptions = { ...options, maxAge: 0 }
        event.node.res.setHeader(
          'Set-Cookie',
          serialize(name, '', cookieOptions),
        )
      },
      redirect: (url, statusCode = 307) => {
        event.node.res.writeHead(statusCode, { Location: url })
      },
      end: () => {},
      send: (html, headers) => {
        if (headers?.['Content-Type']) {
          event.node.res.setHeader('Content-Type', headers['Content-Type'])
        }
      },
      json: () => {},
      status: () => {
        return response
      },
      // setHeaders: (headers) => {
      //   Object.entries(headers).forEach(([key, value]) => {
      //     event.node.res.setHeader(key, value)
      //   })
      // },
      write: (data) => {
        event.node.res.write(data)
      },
      writeHead: (status, headers) => {
        event.node.res.writeHead(status, headers)
        sseResponse = new Response(null, { headers })
      },
    }
    // TODO: bring back SSE here ?
    // if (sse) {
    //   await new Promise((resolve) => {
    //     event.node.req.on('close', () => resolve({}))
    //   })
    // }

    const remultHandlerResponse = await result.handle(event, response)
    return toResponse({
      // sseResponse,
      remultHandlerResponse,
      requestUrl: event.web?.request?.url.toString(),
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
