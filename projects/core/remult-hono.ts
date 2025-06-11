import { Hono, type Context, type Env } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { streamSSE, type SSEStreamingApi } from 'hono/streaming'
import type { BlankInput } from 'hono/types'
import {
  createRemultServer,
  type GenericRequestHandler,
  type RemultServerCore,
  type RemultServerOptions,
  type SpecificRoute,
} from './server/index.js'
import type { TypicalResponse } from './server/remult-api-server.js'
import {
  RouteImplementation,
  type ServerCoreOptions,
} from './server/remult-api-server.js'
import { mergeOptions, type SerializeOptions } from './src/remult-cookie.js'

class HonoRouteImplementation extends RouteImplementation<
  Context<Env, '', BlankInput>
> {
  constructor(
    private app: Hono,
    coreOptions: ServerCoreOptions<Context<Env, '', BlankInput>>,
  ) {
    super(coreOptions)
  }

  route(path: string): SpecificRoute<Context<Env, '', BlankInput>> {
    const parentRoute = super.route(path)
    return this.createHonoRoute(path, parentRoute)
  }

  createRouteHandlers(
    path: string,
    m: Map<string, GenericRequestHandler<Context<Env, '', BlankInput>>>,
  ): SpecificRoute<Context<Env, '', BlankInput>> {
    const parentRoute = super.createRouteHandlers(path, m)
    return this.createHonoRoute(path, parentRoute, m)
  }

  private createHonoRoute(
    path: string,
    parentRoute: SpecificRoute<Context<Env, '', BlankInput>>,
    methodMap?: Map<
      string,
      GenericRequestHandler<Context<Env, '', BlankInput>>
    >,
  ): SpecificRoute<Context<Env, '', BlankInput>> {
    const registerMethod = (
      method: 'get' | 'post' | 'put' | 'delete',
      handler: GenericRequestHandler<Context<Env, '', BlankInput>>,
    ) => {
      methodMap?.set(method, handler)
      this.app[method](path, this.createHonoHandler(handler))
      return route
    }

    const route = {
      get: (handler: GenericRequestHandler<Context<Env, '', BlankInput>>) =>
        registerMethod('get', handler),
      post: (handler: GenericRequestHandler<Context<Env, '', BlankInput>>) =>
        registerMethod('post', handler),
      put: (handler: GenericRequestHandler<Context<Env, '', BlankInput>>) =>
        registerMethod('put', handler),
      delete: (handler: GenericRequestHandler<Context<Env, '', BlankInput>>) =>
        registerMethod('delete', handler),
      staticFolder: (
        folderPath: string,
        options?: {
          packageName?: string
          contentTypes?: Record<string, string>
          editFile?: (filePath: string, content: string) => string
        },
      ) => {
        parentRoute.staticFolder(folderPath, options)

        if (methodMap) {
          const handler = methodMap.get('get')
          if (handler) {
            this.app.get(path, this.createHonoHandler(handler))
          }
        }

        return route
      },
    } as SpecificRoute<Context<Env, '', BlankInput>>

    return route
  }

  private createHonoHandler(
    handler: GenericRequestHandler<Context<Env, '', BlankInput>>,
  ) {
    function toOptions(options: SerializeOptions) {
      const fwOptions: any = { ...options }
      return fwOptions
    }

    return (c: Context<Env, '', BlankInput>) => {
      return new Promise<void | Response>((resolve, reject) => {
        try {
          let result: any
          let sse: SSEStreamingApi
          const gRes: TypicalResponse = {
            cookie: (name: string) => {
              return {
                set: (value: string, options = {}) => {
                  setCookie(c, name, value, toOptions(mergeOptions(options)))
                },
                get: (options = {}) => {
                  return getCookie(c, name)
                },
                delete: (options = {}) => {
                  deleteCookie(c, name, toOptions(mergeOptions(options)))
                },
              }
            },
            res: {
              redirect: (url, statusCode = 307) => {
                resolve(c.redirect(url as any, statusCode as any))
              },
              json: (data: any) => {
                resolve(c.json(data))
              },
              status: (status: number) => {
                result = c.status(status as any)
                return gRes.res
              },
              end: () => {
                if (sse) sse.close()
                else resolve(c.body(null))
              },
              send: (data) => {
                resolve(c.html(data))
              },
            },
            // setHeaders: (headers) => {
            //   Object.entries(headers).forEach(([key, value]) => {
            //     c.header(key, value)
            //   })
            // },
            sse: {
              write: (data: string) => {
                sse.write(data)
              },
              writeHead: (status: number, headers: any) => {
                resolve(
                  streamSSE(c, (s) => {
                    sse = s
                    return new Promise((res) => {
                      ;(c as any)['_tempOnClose'] = (x: VoidFunction) =>
                        sse.onAbort(() => x())
                    })
                  }),
                )
              },
            },
          }

          handler(c as any, gRes, () => {})
        } catch (err) {
          reject(err)
        }
      })
    }
  }
}

export function remultApi(
  options: RemultServerOptions<Context<Env, '', BlankInput>>,
): RemultHonoServer {
  const app = new Hono()
  const api = createRemultServer(options, {
    buildGenericRequestInfo: (c: Context<Env, '', BlankInput>) => {
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
        },
      }
    },
    getRequestBody: async (c: Context<Env, '', BlankInput>) => {
      return c.req.json()
    },
  })

  const router = new HonoRouteImplementation(app, {
    buildGenericRequestInfo: (c: Context<Env, '', BlankInput>) => {
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
        },
      }
    },
    getRequestBody: async (c: Context<Env, '', BlankInput>) => {
      return c.req.json()
    },
  })

  api.registerRouter(router)
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

/** @deprecated use remultApi instead */
export const remultHono = remultApi
