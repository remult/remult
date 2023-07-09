import type { RequestEvent, Handle } from '@sveltejs/kit'
import {
  createRemultServer,
  RemultServer,
  GenericResponse,
  RemultServerOptions,
  RemultServerCore,
} from './server'
import { ResponseRequiredForSSE } from './SseSubscriptionServer'

export function remultSveltekit(
  options?: RemultServerOptions<RequestEvent>,
): RemultSveltekitServer {
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
  const handler: Handle = async ({ event, resolve }) => {
    if (event.url.pathname.startsWith(options.rootPath)) {
      let sseResponse: Response | undefined = undefined
      event.locals['_tempOnClose'] = () => {}

      const response: GenericResponse & ResponseRequiredForSSE = {
        end: () => {},
        json: () => {},
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
                  event.locals['_tempOnClose']()
                },
              })
              sseResponse = new Response(stream, { headers })
            }
          }
        },
      }

      const responseFromRemultHandler = await result.handle(event, response)
      if (sseResponse !== undefined) {
        return sseResponse
      }
      if (responseFromRemultHandler) {
        return new Response(JSON.stringify(responseFromRemultHandler.data), {
          status: responseFromRemultHandler.statusCode,
        })
      }
    }
    return new Promise<Response>((res) => {
      result.withRemult(event, undefined!, async () => {
        res(await resolve(event))
      })
    })
  }
  return Object.assign(handler, {
    getRemult: (req) => result.getRemult(req),
    openApiDoc: (options: { title: string }) => result.openApiDoc(options),
  })
}

export type RemultSveltekitServer = RemultServerCore<RequestEvent> & Handle
