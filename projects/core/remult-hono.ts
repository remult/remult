import { type Context, type Env, Hono } from 'hono'
import type { BlankInput } from 'hono/types'
import { streamSSE, type SSEStreamingApi } from 'hono/streaming'
import {
  createRemultServer,
  type RemultServerOptions,
  type RemultServerCore,
  type GenericRouter,
  type SpecificRoute,
  type GenericRequestHandler,
  type GenericResponse,
} from './server/index.js'
import type { ResponseRequiredForSSE } from './SseSubscriptionServer.js'
export function remultHono(
  options: RemultServerOptions<Context<Env, '', BlankInput>>,
): RemultHonoServer {
  let app = new Hono()
  const api = createRemultServer(options, {
    buildGenericRequestInfo: (c) => {
      return {
        method: c.req.method,
        params: c.req.param(),
        query: new Proxy(c.req, {
          get: (target, prop) => {
            const r = c.req.queries(prop as string)
            if (r?.length == 1) return r[0]
            return r
          },
        }),
        url: c.req.url,
        on: (e: 'close', do1: VoidFunction) => {
          ;(c as any)['_tempOnClose'](() => do1())
          //   c.req.on('close', do1)
        },
      }
    },
    getRequestBody: async (c) => {
      return c.req.json()
    },
  })

  let honoRouter: GenericRouter<Context<Env, '', BlankInput>> = {
    route(path) {
      let r = {
        get(handler) {
          app.get(path, honoHandler(handler))
          return r
        },
        post(handler) {
          app.post(path, honoHandler(handler))
          return r
        },
        put(handler) {
          app.put(path, honoHandler(handler))
          return r
        },
        delete(handler) {
          app.delete(path, honoHandler(handler))
          return r
        },
      } as SpecificRoute<Context<Env, '', BlankInput>>
      return r

      function honoHandler(
        handler: GenericRequestHandler<Context<Env, '', BlankInput>>,
      ) {
        return (c: Context<Env, '', BlankInput>) => {
          return new Promise<void | Response>((res, rej) => {
            try {
              let result: any
              let sse: SSEStreamingApi
              const gRes: GenericResponse & ResponseRequiredForSSE = {
                redirect: () => {},
                json: (data: any) => {
                  res(c.json(data))
                },
                status: (status: number) => {
                  result = c.status(status as any)
                  return gRes
                },
                end: () => {
                  if (sse) sse.close()
                  else res(c.body(null))
                },
                send: (data: string) => {
                  res(c.html(data))
                },
                write: (data: string) => {
                  sse.write(data)
                },
                writeHead: (status: number, headers: any) => {
                  res(
                    streamSSE(c, (s) => {
                      sse = s
                      return new Promise((res) => {
                        ;(c as any)['_tempOnClose'] = (x: VoidFunction) =>
                          sse.onAbort(() => x())
                      })
                    }),
                  )
                },
              }

              handler(c as any, gRes, () => {})
            } catch (err) {
              rej(err)
            }
          })
        }
      }
    },
  }
  api.registerRouter(honoRouter)
  return Object.assign(app, {
    getRemult: (c) => api.getRemult(c),
    openApiDoc: (options) => api.openApiDoc(options),
    withRemult: async (c, what) => api.withRemultAsync(c, what),
  } as Pick<RemultHonoServer, 'getRemult' | 'openApiDoc' | 'withRemult'>)
}
export type RemultHonoServer = Hono &
  RemultServerCore<Context<Env, '', BlankInput>> & {
    withRemult: <T>(
      c: Context<Env, '', BlankInput>,
      what: () => Promise<T>,
    ) => Promise<T>
  }
