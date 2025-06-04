import { getRequestEvent, type RequestEvent } from 'solid-js/web'
import type { ResponseRequiredForSSE } from './SseSubscriptionServer.js'
import type {
  GenericResponse,
  RemultServerCore,
  RemultServerOptions,
} from './server/index.js'
import { createRemultServer, remultHandlerToResponse } from './server/index.js'
import type { APIEvent } from '@solidjs/start/server' // don't remove - augments requestEvent
import { parse, serialize } from './src/remult-cookie.js'

export function remultApi(
  options: RemultServerOptions<RequestEvent>,
): RemultSolidStartServer {
  const result = createRemultServer<RequestEvent>(options, {
    buildGenericRequestInfo: (event) => ({
      url: event.request.url,
      method: event.request.method,
      on: (e: 'close', do1: VoidFunction) => {
        if (e === 'close') {
          event.locals['_tempOnClose'] = do1
        }
      },
    }),
    getRequestBody: (event) => event.request.json(),
  })

  const serverHandler = async () => {
    const event = await getRequestEvent()
    let sseResponse: Response | undefined = undefined
    if (event) event.locals['_tempOnClose'] = () => {}

    const response: GenericResponse & ResponseRequiredForSSE = {
      end: () => {},
      json: () => {},
      send: () => {},
      redirect: () => {},
      setCookie: (name, value, options = {}) => {
        event?.response.headers.set(
          'Set-Cookie',
          serialize(name, value, options),
        )
      },
      getCookie: (name, options) => {
        const cookieHeader = event?.request.headers.get('cookie')
        return cookieHeader ? parse(cookieHeader, options)[name] : undefined
      },
      deleteCookie: (name, options = {}) => {
        const cookieOptions = { ...options, maxAge: 0 }
        event?.response.headers.set(
          'Set-Cookie',
          serialize(name, '', cookieOptions),
        )
      },
      status: () => {
        return response
      },
      setHeaders: (headers) => {
        Object.entries(headers).forEach(([key, value]) => {
          event?.response.headers.set(key, value)
        })
      },
      write: () => {},
      writeHead: (status, headers) => {
        if (status === 200 && headers) {
          const contentType = headers['Content-Type']
          if (contentType === 'text/event-stream') {
            const messages: string[] = []
            response.write = (x) => messages.push(x)
            const stream = new ReadableStream({
              start: (controller) => {
                for (const message of messages) {
                  controller.enqueue(message)
                }
                response.write = (data) => {
                  controller.enqueue(data)
                }
              },
              cancel: () => {
                response.write = () => {}
                event?.locals?.['_tempOnClose']?.()
              },
            })
            sseResponse = new Response(stream, { headers })
          }
        }
      },
    }

    const responseFromRemultHandler = await result.handle(event!, response)
    return remultHandlerToResponse(
      responseFromRemultHandler,
      sseResponse,
      event!.request.url,
    )
  }

  const handler = {} // Placeholder for potential future use

  return Object.assign(handler, {
    getRemult: (req: RequestEvent) => result.getRemult(req),
    openApiDoc: (options: { title: string }) => result.openApiDoc(options),
    async withRemult<T>(what: () => Promise<T>): Promise<T> {
      return result.withRemultAsync(await getRequestEvent(), what)
    },
    GET: serverHandler,
    PUT: serverHandler,
    POST: serverHandler,
    DELETE: serverHandler,
  })
}

type RequestHandler = (event: RequestEvent) => Promise<Response>

export type RemultSolidStartServer = RemultServerCore<RequestEvent> & {
  withRemult<T>(what: () => Promise<T>): Promise<T>
  GET: RequestHandler
  PUT: RequestHandler
  POST: RequestHandler
  DELETE: RequestHandler
}

/** @deprecated use remultApi instead */
export const remultSolidStart = remultApi
