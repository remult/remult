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
import { mergeOptions, parse, serialize } from './src/remult-cookie.js'

export function remultNext(
  options: RemultServerOptions<NextApiRequest>,
): RemultNextServer {
  let result = createRemultServer(options, {
    buildGenericRequestInfo: (req) => req,
    getRequestBody: async (req) => req.body,
  })

  const handler: NextApiHandler = async (req: NextApiRequest, res) => {
    let sseResponse: boolean = false
    ;(req as any)['_tempOnClose'] = () => {}

    const response: GenericResponse & ResponseRequiredForSSE = {
      cookie: (name) => {
        return {
          set: (value, options = {}) => {
            ;(res as any).setHeader(
              'Set-Cookie',
              serialize(name, value, mergeOptions(options)),
            )
          },
          get: (options = {}) => {
            const cookieHeader = req.headers.cookie
            return cookieHeader ? parse(cookieHeader, options)[name] : undefined
          },
          delete: (options = {}) => {
            ;(res as any).setHeader(
              'Set-Cookie',
              serialize(name, '', mergeOptions({ ...options, maxAge: 0 })),
            )
          },
        }
      },
      redirect: (url, statusCode = 307) => {
        res.redirect(statusCode, url)
      },
      end: (data?: any) => {
        if (data !== undefined) {
          if ((res as any).send) {
            ;(res as any).send(data)
          } else {
            if ((res as any).write) {
              ;(res as any).write(data)
            }
            res.end()
          }
        } else {
          res.end()
        }
      },
      json: (data: any) => {
        if ((res as any).json) {
          ;(res as any).json(data)
        } else {
          if ((res as any).setHeader) {
            ;(res as any).setHeader('Content-Type', 'application/json')
          }
          if ((res as any).write) {
            ;(res as any).write(JSON.stringify(data))
          }
          res.end()
        }
      },
      send: (data: any) => {
        if ((res as any).send) {
          ;(res as any).send(data)
        } else {
          if ((res as any).write) {
            ;(res as any).write(data)
          }
          res.end()
        }
      },
      status: (statusCode: number) => {
        if ((res as any).status) {
          ;(res as any).status(statusCode)
        } else {
          ;(res as any).statusCode = statusCode
        }
        return response
      },
      write: (data: any) => {
        if ((res as any).write) {
          ;(res as any).write(data)
        }
      },
      writeHead: (status: number, headers?: any) => {
        if ((res as any).writeHead) {
          ;(res as any).writeHead(status, headers)
        } else {
          ;(res as any).statusCode = status
          if (headers && (res as any).setHeader) {
            for (const [key, value] of Object.entries(headers)) {
              ;(res as any).setHeader(key, value as string)
            }
          }
        }
        if (status === 200 && headers) {
          const contentType = headers['Content-Type']
          if (contentType === 'text/event-stream') {
            sseResponse = true
            response.write = (data) => {
              if ((res as any).write) {
                ;(res as any).write(data)
              }
            }
          }
        }
      },
    }

    // Handle the 'on' method separately for the request object
    ;(req as any).on = (event: string, listener: any) => {
      if (event === 'close') {
        ;(req as any)['_tempOnClose'] = listener
      }
    }

    const responseFromRemultHandler = await result.handle(req, response)

    if (sseResponse) {
      // SSE response is already handled by writeHead
      return
    }

    if (responseFromRemultHandler) {
      if (responseFromRemultHandler.redirectUrl) {
        res.redirect(
          responseFromRemultHandler.statusCode || 307,
          responseFromRemultHandler.redirectUrl,
        )
        return
      }

      if (responseFromRemultHandler.html) {
        res.setHeader('Content-Type', 'text/html')
        res.status(responseFromRemultHandler.statusCode || 200)
        res.write(responseFromRemultHandler.html)
        res.end()
        return
      }

      res.status(responseFromRemultHandler.statusCode || 200)
      res.setHeader('Content-Type', 'application/json')
      res.write(JSON.stringify(responseFromRemultHandler.data))
      res.end()
      return
    }

    if (!responseFromRemultHandler) {
      if ((res as any).status) {
        ;(res as any).status(404)
      } else {
        ;(res as any).statusCode = 404
      }
      res.end()
    }
  }

  return Object.assign(
    handler,
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

      const res: GenericResponse & ResponseRequiredForSSE = {
        cookie: (name) => {
          return {
            set: (value, options = {}) => {
              ;(res as any).setHeader(
                'Set-Cookie',
                serialize(name, value, mergeOptions(options)),
              )
            },
            get: (options = {}) => {
              const cookieHeader = (req as any).headers.cookie
              return cookieHeader
                ? parse(cookieHeader, options)[name]
                : undefined
            },
            delete: (options = {}) => {
              ;(res as any).setHeader(
                'Set-Cookie',
                serialize(name, '', mergeOptions({ ...options, maxAge: 0 })),
              )
            },
          }
        },
        redirect: (url, statusCode = 307) => {
          ;(req as any).redirect(url, statusCode)
        },
        end: () => {},
        json: () => {},
        send: () => {},
        status: () => {
          return res
        },
        write: () => {},
        writeHead: (status, headers) => {
          if (status === 200 && headers) {
            const contentType = headers['Content-Type']
            if (contentType === 'text/event-stream') {
              const messages: string[] = []
              res.write = (x) => messages.push(x)
              const stream = new ReadableStream({
                start: (controller) => {
                  for (const message of messages) {
                    controller.enqueue(encoder.encode(message))
                  }
                  res.write = (data) => {
                    controller.enqueue(encoder.encode(data))
                  }
                },
                cancel: () => {
                  res.write = () => {}
                  ;(req as any)['_tempOnClose']()
                },
              })
              sseResponse = new Response(stream, { headers })
            }
          }
        },
      }

      const responseFromRemultHandler = await result.handle(req, res)
      if (sseResponse !== undefined) {
        return sseResponse
      }
      if (responseFromRemultHandler) {
        if (responseFromRemultHandler.redirectUrl) {
          res.redirect(
            responseFromRemultHandler.redirectUrl,
            responseFromRemultHandler.statusCode || 307,
          )
          return
        }

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
