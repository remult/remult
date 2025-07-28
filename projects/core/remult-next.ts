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
import { getURL } from './urlBuilder.js'

export function remultNext(
  options: RemultServerOptions<NextApiRequest>,
): RemultNextServer {
  let result = createRemultServer(options, {
    buildGenericRequestInfo: (req) => ({
      internal: { ...req, on: req.on },
      public: {
        headers: new Headers(req.headers as Record<string, string>),
        url: getURL(req.url),
      },
    }),
    getRequestBody: async (req) => req.body,
  })
  return Object.assign(
    (req: NextApiRequest, res: GenericResponse) =>
      result.handle(req, res).then(() => {}),
    result,
    {
      getRemult: (req: NextApiRequest) => result.getRemult(req),
      openApiDoc: (arg: any) => result.openApiDoc(arg),
      withRemult: <T>(req: NextApiRequest, what: () => Promise<T>) =>
        result.withRemultAsync(req, what),
    },
    {
      getServerSideProps: (getServerPropsFunction: any) => {
        return (context: any) => {
          return new Promise<GetServerSidePropsResult<any>>((res, err) => {
            result.withRemult(context, undefined!, async () => {
              try {
                let r = await getServerPropsFunction(context)
                res(JSON.parse(JSON.stringify(r)))
              } catch (e) {
                err(e)
              }
            })
          })
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
  let result = createRemultServer<Request>(options!, {
    getRequestBody: (req) => req.json(),
    buildGenericRequestInfo: (req) => ({
      internal: {
        url: req?.url,
        method: req?.method,
        on: (e: 'close', do1: VoidFunction) => {
          if (e === 'close') {
            ;(req as any)['_tempOnClose'] = do1
          }
        },
      },
      public: { headers: req.headers, url: getURL(req.url) },
    }),
  })
  const handler = async (req: Request) => {
    {
      let sseResponse: Response | undefined = undefined
      ;(req as any)['_tempOnClose'] = () => {}

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
        return new Response(JSON.stringify(responseFromRemultHandler.data), {
          status: responseFromRemultHandler.statusCode,
        })
      }
      if (!responseFromRemultHandler) {
        return new Response('', {
          status: 404,
        })
      }
    }
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
// [ ] V1.5 Add handle, similar to handle in next page router.
export type RemultNextAppServer = RemultServerCore<Request> & {
  GET: (req: Request) => Promise<Response | undefined>
  PUT: (req: Request) => Promise<Response | undefined>
  POST: (req: Request) => Promise<Response | undefined>
  DELETE: (req: Request) => Promise<Response | undefined>
  withRemult<T>(what: () => Promise<T>): Promise<T>
}

/** @deprecated use remultApi instead */
export const remultNextApp = remultApi
