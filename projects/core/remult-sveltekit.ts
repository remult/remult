import type { Handle, RequestEvent, RequestHandler } from '@sveltejs/kit'
import type { ResponseRequiredForSSE } from './SseSubscriptionServer.js'
import type {
  GenericResponse,
  RemultServerCore,
  RemultServerOptions,
  RemultServer,
} from './server/index.js'
import { createRemultServer, remultHandlerToResponse } from './server/index.js'
import { parse, serialize } from './src/remult-cookie.js'

export function remultApi(
  options: RemultServerOptions<RequestEvent>,
): RemultSveltekitServer {
  const result = createRemultServer<RequestEvent>(options, {
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
  })

  const serverHandler: RequestHandler = async (event) => {
    let sseResponse: Response | undefined = undefined
    ;(event.locals as any)['_tempOnClose'] = () => {}

    const response: GenericResponse & ResponseRequiredForSSE = {
      end: () => {},
      json: () => {},
      send: () => {},
      redirect: () => {},
      setCookie: (name, value, options = {}) => {
        // Use the secure defaults from serialize function
        const cookieString = serialize(name, value, options)
        
        // Parse the cookie string to extract the individual parts for SvelteKit
        const parts = cookieString.split(';').map((part) => part.trim())
        const [nameValue] = parts
        const [, cookieValue] = nameValue.split('=')

        // Extract options from the cookie string
        const cookieOptions: any = {}
        parts.slice(1).forEach((part) => {
          const [key, val] = part.split('=')
          switch (key.toLowerCase()) {
            case 'path':
              cookieOptions.path = val
              break
            case 'max-age':
              cookieOptions.maxAge = parseInt(val)
              break
            case 'httponly':
              cookieOptions.httpOnly = true
              break
            case 'secure':
              cookieOptions.secure = true
              break
            case 'samesite':
              cookieOptions.sameSite = val.toLowerCase()
              break
          }
        })

        event.cookies.set(name, cookieValue, cookieOptions)
      },
      getCookie: (name, options) => {
        const cookieHeader = event.request.headers.get('cookie')
        return cookieHeader ? parse(cookieHeader, options)[name] : undefined
      },
      deleteCookie: (name, options = {}) => {
        const cookieOptions = { ...options, maxAge: 0 }
        const cookieString = serialize(name, '', cookieOptions)
        // Parse and apply similar to setCookie
        const parts = cookieString.split(';').map((part) => part.trim())
        const parsedOptions: any = { maxAge: 0 }
        parts.slice(1).forEach((part) => {
          const [key, val] = part.split('=')
          switch (key.toLowerCase()) {
            case 'path':
              parsedOptions.path = val
              break
            case 'httponly':
              parsedOptions.httpOnly = true
              break
            case 'secure':
              parsedOptions.secure = true
              break
            case 'samesite':
              parsedOptions.sameSite = val?.toLowerCase()
              break
          }
        })
        event.cookies.delete(name, parsedOptions)
      },
      status: () => {
        return response
      },
      setHeaders: (headers) => {
        event.setHeaders(headers)
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
                ;(event.locals as any)['_tempOnClose']()
              },
            })
            sseResponse = new Response(stream, { headers })
          }
        }
      },
    }

    const responseFromRemultHandler = await result.handle(event, response)

    return remultHandlerToResponse(
      responseFromRemultHandler,
      sseResponse,
      event.url.toString(),
    )
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
