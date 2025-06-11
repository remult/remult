import { getRequestEvent, type RequestEvent } from 'solid-js/web'
import type { RemultServerCore, RemultServerOptions } from './server/index.js'
import { createRemultServer } from './server/index.js'
import type { TypicalResponse } from './server/remult-api-server.js'
import { toResponse } from './server/toResponse.js'

import type { APIEvent } from '@solidjs/start/server' // don't remove - augments requestEvent
type localAPIEvent = APIEvent

export function remultApi(
  options: RemultServerOptions<RequestEvent>,
): RemultSolidStartServer {
  let result = createRemultServer<RequestEvent>(options, {
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

    const trToUse: TypicalResponse = {
      res: {
        redirect: (url, statusCode = 307) => {
          event?.locals.redirect(url, statusCode)
        },
        end: () => {},
        json: () => {},
        send: () => {},
        status: () => {
          return trToUse.res
        },
      },
      cookie: (name) => {
        return {
          set: (value, options = {}) => {
            event?.locals.setCookie(name, value, options)
          },
          get: (options = {}) => {
            return event?.locals.getCookie(name, options)
          },
          delete: (options = {}) => {
            event?.locals.deleteCookie(name, options)
          },
        }
      },
      sse: {
        write: () => {},
        writeHead: (status, headers) => {
          if (status === 200 && headers) {
            const contentType = headers['Content-Type']
            if (contentType === 'text/event-stream') {
              const messages: string[] = []
              trToUse.sse.write = (x) => messages.push(x)
              const stream = new ReadableStream({
                start: (controller) => {
                  for (const message of messages) {
                    controller.enqueue(message)
                  }
                  trToUse.sse.write = (data) => {
                    controller.enqueue(data)
                  }
                },
                cancel: () => {
                  trToUse.sse.write = () => {}
                  event?.locals?.['_tempOnClose']?.()
                },
              })
              sseResponse = new Response(stream, { headers })
            }
          }
        },
      },
    }

    const remultHandlerResponse = await result.handle(event!, trToUse)
    return toResponse({
      sseResponse,
      remultHandlerResponse,
      requestUrl: event!.request.url,
    })
  }

  const handler = {} //async ({ event, resolve }) => {
  //   if (event.url.pathname.startsWith(options!.rootPath!)) {
  //     const result = await serverHandler(event)
  //     if (result != null && result?.status != 404) return result
  //   }
  //   return new Promise<Response>((res) => {
  //     result.withRemult(event, undefined!, async () => {
  //       res(await resolve(event))
  //     })
  //   })
  // }
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
  // Handle &
  withRemult<T>(what: () => Promise<T>): Promise<T>
  GET: RequestHandler
  PUT: RequestHandler
  POST: RequestHandler
  DELETE: RequestHandler
}

/** @deprecated use remultApi instead */
export const remultSolidStart = remultApi
