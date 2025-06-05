import type {
  GetServerSideProps,
  GetServerSidePropsResult,
  NextApiHandler,
  NextApiRequest,
  PreviewData,
} from 'next'
import type { ParsedUrlQuery } from 'querystring'
import type { ResponseRequiredForSSE } from './SseSubscriptionServer.js'
import type {
  GenericResponse,
  RemultServerCore,
  RemultServerOptions,
} from './server/index.js'
import { createRemultServer } from './server/index.js'
import { parse, serialize } from './src/remult-cookie.js'
import { toResponse } from './server/toResponse.js'

export function remultNext(
  options: RemultServerOptions<NextApiRequest>,
): RemultNextServer {
  const result = createRemultServer(options, {
    buildGenericRequestInfo: (req) => req,
    getRequestBody: async (req) => req.body,
  })

  return Object.assign(
    (req: NextApiRequest, res: any) => result.handle(req, res).then(() => {}),
    result,
    {
      getRemult: (req: NextApiRequest) => result.getRemult(req),
      openApiDoc: (options: any) => result.openApiDoc(options),
      withRemult: <T>(req: NextApiRequest, what: () => Promise<T>) =>
        result.withRemultAsync(req, what),
    },
    {
      getServerSideProps: (getServerPropsFunction: any) => {
        return (context: any) => {
          return new Promise<GetServerSidePropsResult<any>>(
            (resolve, reject) => {
              result.withRemult(context, undefined!, async () => {
                try {
                  const r = await getServerPropsFunction(context)
                  resolve(JSON.parse(JSON.stringify(r)))
                } catch (e) {
                  reject(e)
                }
              })
            },
          )
        }
      },
      handle: (handler: NextApiHandler) => {
        return async (req: any, res: any) => {
          await new Promise<void>(async (resolve) => {
            result.withRemult(req, res, async () => {
              await handler(req, res)
              resolve()
            })
          })
        }
      },
    },
  )
}

export type RemultNextServer = RemultServerCore<NextApiRequest> &
  NextApiHandler & {
    getServerSideProps<
      P extends { [key: string]: any } = { [key: string]: any },
      Q extends ParsedUrlQuery = ParsedUrlQuery,
      D extends PreviewData = PreviewData,
    >(
      getServerPropsFunction: GetServerSideProps<P, Q, D>,
    ): GetServerSideProps<P, Q, D>
    withRemult<T>(
      req: NextApiRequest | undefined,
      what: () => Promise<T>,
    ): Promise<T>
    /** Creates a `next.js` handler with remult defined in the correct context
     * @see
     * https://remult.dev/tutorials/react-next/appendix-1-get-server-side-props.html#using-remult-in-a-next-js-api-handler
     */
    handle<T>(handler: NextApiHandler<T>): NextApiHandler<T>
  }

const encoder = new TextEncoder()

export function remultApi(
  options?: RemultServerOptions<Request>,
): RemultNextAppServer {
  const result = createRemultServer<Request>(options!, {
    getRequestBody: (req) => req.json(),
    buildGenericRequestInfo: (req) => ({
      url: req?.url,
      method: req?.method,
      on: (e: 'close', do1: VoidFunction) => {
        if (e === 'close') {
          ;(req as any)['_tempOnClose'] = do1
        }
      },
    }),
  })

  const handler = async (req: Request) => {
    let sseResponse: Response | undefined = undefined
    ;(req as any)['_tempOnClose'] = () => {}

    const response: GenericResponse & ResponseRequiredForSSE = {
      // setCookie: (name, value, options = {}) => {
      //   // For Next.js app router, we can't set cookies directly in the response handler
      //   // This would need to be handled at the route level using next/headers
      //   console.warn('setCookie not fully supported in Next.js app router - use cookies() from next/headers instead')
      // },
      // getCookie: (name, options) => {
      //   const cookieHeader = req.headers.get('cookie')
      //   return cookieHeader ? parse(cookieHeader, options)[name] : undefined
      // },
      // deleteCookie: (name, options = {}) => {
      //   // Similar limitation as setCookie
      //   console.warn('deleteCookie not fully supported in Next.js app router - use cookies() from next/headers instead')
      // },
      // redirect: () => {},
      end: () => {},
      json: () => {},
      send: () => {},
      status: () => {
        return response
      },
      // setHeaders: () => {
      //   // No-op for Next.js app router - headers must be set in route handler return
      // },
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
                  controller.enqueue(encoder.encode(message))
                }
                response.write = (data) => {
                  controller.enqueue(encoder.encode(data))
                }
              },
              cancel: () => {
                response.write = () => {}
                ;(req as any)['_tempOnClose']()
              },
            })
            sseResponse = new Response(stream, { headers })
          }
        }
      },
    }

    const responseFromRemultHandler = await result.handle(req, response)
    return toResponse({
      sseResponse,
      remultHandlerResponse: responseFromRemultHandler,
      requestUrl: req.url,
    })
  }

  return {
    getRemult: (req) => result.getRemult(req),
    openApiDoc: (options: { title: string }) => result.openApiDoc(options),
    GET: handler,
    POST: handler,
    PUT: handler,
    DELETE: handler,
    withRemult: <T>(what: () => Promise<T>) =>
      result.withRemultAsync<T>({} as any, what),
  }
}

export type RemultNextAppServer = RemultServerCore<Request> & {
  GET: (req: Request) => Promise<Response | undefined>
  PUT: (req: Request) => Promise<Response | undefined>
  POST: (req: Request) => Promise<Response | undefined>
  DELETE: (req: Request) => Promise<Response | undefined>
  withRemult<T>(what: () => Promise<T>): Promise<T>
}

/** @deprecated use remultApi instead */
export const remultNextApp = remultApi
