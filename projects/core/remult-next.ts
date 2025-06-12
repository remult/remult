import type {
  GetServerSideProps,
  GetServerSidePropsResult,
  NextApiHandler,
  NextApiRequest,
  PreviewData,
} from 'next'
import type { ParsedUrlQuery } from 'querystring'
import type { RemultServerCore, RemultServerOptions } from './server/index.js'
import { createRemultServer } from './server/index.js'
import type { ServerCoreOptions } from './server/remult-api-server.js'
import {
  getBaseTypicalRouteInfo,
  type TypicalRouteInfo,
} from './server/route-helpers.js'
import { toResponse } from './server/toResponse.js'
import { mergeOptions, parse, serialize } from './src/remult-cookie.js'

// Next.js API Route implementation
export function remultNext(
  options: RemultServerOptions<NextApiRequest>,
): RemultNextServer {
  const coreOptions: ServerCoreOptions<NextApiRequest> = {
    buildGenericRequestInfo: (req) => req,
    getRequestBody: async (req) => req.body,
  }
  let result = createRemultServer(options, coreOptions)

  const handler: NextApiHandler = async (req: NextApiRequest, res) => {
    let sseResponse: boolean = false
    ;(req as any)['_tempOnClose'] = () => {}

    const tri = getBaseTypicalRouteInfo({
      url: req.url,
      headers: req.headers as Record<string, string>,
    })

    const triToUse: TypicalRouteInfo = {
      req: tri.req,
      res: {
        redirect: (url, statusCode = 307) => {
          res.redirect(statusCode, url)
        },
        end: (data?: any) => {
          if (data !== undefined) {
            if (res.send) {
              res.send(data)
            } else {
              if (res.write) {
                res.write(data)
              }
              res.end()
            }
          } else {
            res.end()
          }
        },
        json: (data) => {
          if (res.json) {
            res.json(data)
          } else {
            if ((res as any).setHeader) {
              res.setHeader('Content-Type', 'application/json')
            }
            if (res.write) {
              res.write(JSON.stringify(data))
            }
            res.end()
          }
        },
        send: (data) => {
          if (res.send) {
            res.send(data)
          } else {
            if (res.write) {
              res.write(data)
            }
            res.end()
          }
        },
        status: (statusCode: number) => {
          if (res.status) {
            res.status(statusCode)
          } else {
            res.statusCode = statusCode
          }
          return triToUse.res
        },
      },
      sse: {
        write: (data) => {
          if (res.write) {
            res.write(data)
          }
        },
        writeHead: (status: number, headers?: any) => {
          if (res.writeHead) {
            res.writeHead(status, headers)
          } else {
            res.statusCode = status
            if (headers && res.setHeader) {
              for (const [key, value] of Object.entries(headers)) {
                res.setHeader(key, value as string)
              }
            }
          }
          if (status === 200 && headers) {
            const contentType = headers['Content-Type']
            if (contentType === 'text/event-stream') {
              sseResponse = true
              triToUse.sse.write = (data) => {
                if (res.write) {
                  res.write(data)
                }
              }
            }
          }
        },
      },
      cookie: (name) => {
        return {
          set: (value, options = {}) => {
            res.setHeader(
              'Set-Cookie',
              serialize(name, value, mergeOptions(options)),
            )
          },
          get: (options = {}) => {
            const cookieHeader = req.headers.cookie
            return cookieHeader ? parse(cookieHeader, options)[name] : undefined
          },
          delete: (options = {}) => {
            res.setHeader(
              'Set-Cookie',
              serialize(name, '', mergeOptions({ ...options, maxAge: 0 })),
            )
          },
        }
      },
      setHeaders: (headers) => {
        Object.entries(headers).forEach(([key, value]) => {
          res.setHeader(key, value)
        })
      },
    }

    // Handle the 'on' method separately for the request object
    ;(req as any).on = (event: string, listener: any) => {
      if (event === 'close') {
        ;(req as any)['_tempOnClose'] = listener
      }
    }

    const responseFromRemultHandler = await result.handle(req, triToUse)

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
  const coreOptions: ServerCoreOptions<Request> = {
    buildGenericRequestInfo: (req) => ({
      url: req?.url,
      method: req?.method,

      on: (e: 'close', do1: VoidFunction) => {
        if (e === 'close') {
          ;(req as any)['_tempOnClose'] = do1
        }
      },
    }),
    getRequestBody: (req) => req.json(),
  }
  let result = createRemultServer<Request>(options!, coreOptions)

  const handler = async (req: Request) => {
    {
      let sseResponse: Response | undefined = undefined
      ;(req as any)['_tempOnClose'] = () => {}

      const tri = getBaseTypicalRouteInfo({
        url: req.url,
        headers: req.headers,
      })

      tri.res.redirect = (url, statusCode = 307) => {
        return (req as any).redirect(url, statusCode)
      }

      const triToUse: TypicalRouteInfo = {
        req: tri.req,
        res: tri.res,
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
                      controller.enqueue(encoder.encode(message))
                    }
                    triToUse.sse.write = (data) => {
                      controller.enqueue(encoder.encode(data))
                    }
                  },
                  cancel: () => {
                    triToUse.sse.write = () => {}
                    ;(req as any)['_tempOnClose']()
                  },
                })
                sseResponse = new Response(stream, { headers })
              }
            }
          },
        },
        cookie: (name) => {
          return {
            set: (value, options = {}) => {
              ;(triToUse as any).setHeader(
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
              ;(triToUse as any).setHeader(
                'Set-Cookie',
                serialize(name, '', mergeOptions({ ...options, maxAge: 0 })),
              )
            },
          }
        },
        setHeaders: (headers) => {
          Object.entries(headers).forEach(([key, value]) => {
            ;(triToUse as any).setHeader(key, value)
          })
        },
      }

      const remultHandlerResponse = await result.handle(req, triToUse)
      const response = toResponse({
        sseResponse,
        remultHandlerResponse,
        requestUrl: req.url,
      })
      return response
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
