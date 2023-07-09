import type {
  GetServerSideProps,
  GetServerSidePropsResult,
  NextApiRequest,
  PreviewData,
  NextApiHandler,
} from 'next'
import type { ParsedUrlQuery } from 'querystring'
import {
  createRemultServer,
  GenericResponse,
  RemultServer,
  RemultServerCore,
  RemultServerOptions,
} from './server'
import { ResponseRequiredForSSE } from './SseSubscriptionServer'

export function remultNext(
  options?: RemultServerOptions<NextApiRequest>,
): RemultNextServer {
  let result = createRemultServer(options, {
    buildGenericRequestInfo: (req) => req,
    getRequestBody: async (req) => req.body,
  })
  return Object.assign(
    (req, res) => result.handle(req, res).then(() => {}),
    result,
    {
      getRemult: (req) => result.getRemult(req),
      openApiDoc: (arg) => result.openApiDoc(arg),
    },
    {
      getServerSideProps: (getServerPropsFunction) => {
        return (context) => {
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
        return async (req, res) => {
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
    /** Creates a `next.js` handler with remult defined in the correct context
     * @see
     * https://remult.dev/tutorials/react-next/appendix-1-get-server-side-props.html#using-remult-in-a-next-js-api-handler
     */
    handle<T>(handler: NextApiHandler<T>): NextApiHandler<T>
  }

const encoder = new TextEncoder()

export function remultNextApp(
  options?: RemultServerOptions<Request>,
): RemultNextAppServer {
  let result = createRemultServer<Request>(options!, {
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
    {
      let sseResponse: Response | undefined = undefined
      ;(req as any)['_tempOnClose'] = () => {}

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
    withRemult: <T>(what) => result.withRemultPromise<T>({} as any, what),
  }
}
//[ ] - Add handle, similar to handle in next page router.
export type RemultNextAppServer = RemultServerCore<Request> & {
  GET: (req: Request) => Promise<Response>
  PUT: (req: Request) => Promise<Response>
  POST: (req: Request) => Promise<Response>
  DELETE: (req: Request) => Promise<Response>
  withRemult<T>(what: () => Promise<T>): Promise<T>
}
