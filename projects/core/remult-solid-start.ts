import { getRequestEvent, type RequestEvent } from 'solid-js/web'
import type { ResponseRequiredForSSE } from './SseSubscriptionServer.js'
import type {
  GenericResponse,
  RemultServerCore,
  RemultServerOptions,
} from './server/index.js'
import { createRemultServer } from './server/index.js'
import type { APIEvent } from '@solidjs/start/server' // don't remove - augments requestEvent

export function remultApi(
  options: RemultServerOptions<RequestEvent>,
): RemultSolidStartServer {
  let result = createRemultServer<RequestEvent>(options, {
    buildGenericRequestInfo: (event) => ({
      internal: {
        url: event.request.url,
        method: event.request.method,
        on: (e: 'close', do1: VoidFunction) => {
          if (e === 'close') {
            event.locals['_tempOnClose'] = do1
          }
        },
      },
      public: { headers: new Headers(event.request.headers) },
    }),
    getRequestBody: (event) => event.request.json(),
  })
  const serverHandler = async (evt: RequestEvent) => {
    const event = (await getRequestEvent()) ?? evt
    let sseResponse: Response | undefined = undefined
    if (event) event.locals['_tempOnClose'] = () => {}

    const response: GenericResponse & ResponseRequiredForSSE = {
      end: () => {},
      json: () => {},
      send: () => {},
      status: () => {
        return response
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
    if (sseResponse !== undefined) {
      return sseResponse
    }
    if (responseFromRemultHandler) {
      if (responseFromRemultHandler.html)
        return new Response(responseFromRemultHandler.html, {
          status: responseFromRemultHandler.statusCode,
          headers: {
            'Content-Type': 'text/html',
          },
        })
      const res = new Response(JSON.stringify(responseFromRemultHandler.data), {
        status: responseFromRemultHandler.statusCode,
      })
      return res
    }
    return new Response('Not Found', {
      status: 404,
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
