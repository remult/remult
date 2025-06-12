import type { Handle, RequestEvent, RequestHandler } from '@sveltejs/kit'
import type {
  RemultServer,
  RemultServerCore,
  RemultServerOptions,
} from './server/index.js'
import { createRemultServer } from './server/index.js'
import type {
  ServerCoreOptions,
  TypicalRouteInfo,
} from './server/remult-api-server.js'
import { toResponse } from './server/toResponse.js'
import { mergeOptions, parse } from './src/remult-cookie.js'

export function remultApi(
  options: RemultServerOptions<RequestEvent>,
): RemultSveltekitServer {
  const coreOptions: ServerCoreOptions<RequestEvent> = {
    buildGenericRequestInfo: (event) => ({
      url: event.request.url,
      method: event.request.method,
      on: (e: 'close', do1: VoidFunction) => {
        if (e === 'close') {
          ;(event.locals as any)['_tempOnClose'] = do1
        }
      },
    }),
    getRequestBody: (event) => event.request.json(),
  }
  const result = createRemultServer<RequestEvent>(options, coreOptions)

  const serverHandler: RequestHandler = async (event) => {
    let sseResponse: Response | undefined = undefined
    ;(event.locals as any)['_tempOnClose'] = () => {}

    const triToUse: TypicalRouteInfo = {
      res: {
        end: () => {},
        json: () => {},
        send: () => {},
        redirect: () => {},
        status: () => {
          return triToUse.res
        },
      },
      cookie: (name) => {
        return {
          set: (value, options = {}) => {
            event.cookies.set(name, value, mergeOptions(options))
          },
          get: (options = {}) => {
            const cookieHeader = event.request.headers.get('cookie')
            return cookieHeader ? parse(cookieHeader, options)[name] : undefined
          },
          delete: (options = {}) => {
            event.cookies.delete(name, mergeOptions({ ...options, maxAge: 0 }))
          },
        }
      },
      setHeaders: (headers) => {
        event.setHeaders(headers)
      },
      sse: {
        write: () => {},
        writeHead: (status, headers) => {
          if (status === 200 && headers) {
            const contentType = headers['Content-Type']
            if (contentType === 'text/event-stream') {
              const messages: string[] = []
              triToUse.sse.write = (x) => messages.push(x)
              const stream = new ReadableStream({
                start: (controller) => {
                  for (const message of messages) {
                    controller.enqueue(message)
                  }
                  triToUse.sse.write = (data) => {
                    controller.enqueue(data)
                  }
                },
                cancel: () => {
                  triToUse.sse.write = () => {}
                  ;(event.locals as any)['_tempOnClose']()
                },
              })
              sseResponse = new Response(stream, { headers })
            }
          }
        },
      },
    }

    const responseFromRemultHandler = await result.handle(event, triToUse)
    return toResponse({
      sseResponse,
      remultHandlerResponse: responseFromRemultHandler,
      requestUrl: event.url.toString(),
    })
  }

  const handler: Handle = async ({ event, resolve }) => {
    return result.withRemultAsync(event, async () => await resolve(event))
  }

  return Object.assign(handler, {
    getRemult: (req: RequestEvent) => result.getRemult(req),
    openApiDoc: (options: { title: string }) => result.openApiDoc(options),
    withRemult<T>(request: RequestEvent, what: () => Promise<T>): Promise<T> {
      return result.withRemultAsync(request, what)
    },
    hookHandler: handler,
    GET: serverHandler,
    PUT: serverHandler,
    POST: serverHandler,
    DELETE: serverHandler,
  })
}

export type RemultSveltekitServer = RemultServerCore<RequestEvent> &
  Handle & {
    withRemult: RemultServer<RequestEvent>['withRemultAsync']
    GET: RequestHandler
    PUT: RequestHandler
    POST: RequestHandler
    DELETE: RequestHandler
  }

/** @deprecated use remultApi instead */
export const remultSveltekit = remultApi
