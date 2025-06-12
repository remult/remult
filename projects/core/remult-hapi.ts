import type {
  Plugin,
  ReqRefDefaults,
  Request,
  ResponseToolkit,
  Server,
  ServerStateCookieOptions,
} from '@hapi/hapi'
import { PassThrough } from 'stream'
import {
  createRemultServer,
  type InternalGenericRequestHandler,
  type InternalSpecificRoute,
  type RemultServer,
  type RemultServerCore,
  type RemultServerOptions,
} from './server/index.js'
import {
  RouteImplementation,
  type ServerCoreOptions,
} from './server/remult-api-server.js'
import {
  getBaseTypicalRouteInfo,
  type TypicalRouteInfo,
} from './server/route-helpers.js'
import {
  mergeOptions,
  parse,
  type SerializeOptions,
} from './src/remult-cookie.js'

class HapiRouteImplementation extends RouteImplementation<Request> {
  constructor(
    private server: Server,
    coreOptions: ServerCoreOptions<Request>,
  ) {
    super(coreOptions)
  }

  route(path: string): InternalSpecificRoute<Request> {
    const parentRoute = super.route(path)
    return this.createHapiRoute(path, parentRoute)
  }

  createRouteHandlers(
    path: string,
    m: Map<string, InternalGenericRequestHandler<Request>>,
  ): InternalSpecificRoute<Request> {
    const parentRoute = super.createRouteHandlers(path, m)
    return this.createHapiRoute(path, parentRoute, m)
  }

  private createHapiRoute(
    path: string,
    parentRoute: InternalSpecificRoute<Request>,
    methodMap?: Map<string, InternalGenericRequestHandler<Request>>,
  ): InternalSpecificRoute<Request> {
    const getHapiPath = (routePath: string) =>
      routePath.replace(/:id\b/g, '{id}').replace(/\*$/, '/{param*}')

    const registerMethod = (
      method: 'get' | 'post' | 'put' | 'delete',
      handler: InternalGenericRequestHandler<Request>,
    ) => {
      methodMap?.set(method, handler)
      this.server.route({
        method: method.toUpperCase(),
        path: getHapiPath(path),
        handler: this.createHapiHandler(handler),
      })
      return route
    }

    const route = {
      delete: (handler: InternalGenericRequestHandler<Request>) =>
        registerMethod('delete', handler),
      get: (handler: InternalGenericRequestHandler<Request>) =>
        registerMethod('get', handler),
      post: (handler: InternalGenericRequestHandler<Request>) =>
        registerMethod('post', handler),
      put: (handler: InternalGenericRequestHandler<Request>) =>
        registerMethod('put', handler),
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
            this.server.route({
              method: 'GET',
              path: getHapiPath(path),
              handler: this.createHapiHandler(handler),
            })
          }
        }

        return route
      },
    } as InternalSpecificRoute<Request>

    return route
  }

  private createHapiHandler(handler: InternalGenericRequestHandler<Request>) {
    function toOptions(options: SerializeOptions) {
      const fwOptions: ServerStateCookieOptions = {
        isSameSite:
          options.sameSite === 'strict'
            ? 'Strict'
            : options.sameSite === 'none'
            ? 'None'
            : 'Lax',
        ...options,
      }

      return fwOptions
    }

    return (request: Request<ReqRefDefaults>, h: ResponseToolkit) => {
      return new Promise((resolve, reject) => {
        let status = 200
        let stream: PassThrough

        const tri = getBaseTypicalRouteInfo({
          url: request.url.pathname,
          headers: request.headers,
        })

        const triToUse: TypicalRouteInfo = {
          req: tri.req,
          res: {
            redirect: (url, statusCode = 307) => {
              resolve(h.response().redirect(url).code(statusCode))
            },
            status(statusCode) {
              status = statusCode
              return triToUse.res
            },
            end() {
              resolve(h.response().code(status))
            },
            send(html, headers) {
              let hapiResponse = h.response(html).code(status)
              if (headers?.['Content-Type']) {
                hapiResponse = hapiResponse.type(headers['Content-Type'])
              }
              resolve(hapiResponse)
            },
            json(data) {
              resolve(h.response(data === null ? 'null' : data).code(status))
            },
          },
          sse: {
            write(data) {
              stream.write(data)
            },
            writeHead(statusCode, headers) {
              stream = new PassThrough()
              resolve(
                h
                  .response(stream)
                  .code(statusCode)
                  .header('content-type', 'text/event-stream')
                  .header('content-encoding', 'identity'),
              )
            },
          },
          cookie: (name) => {
            return {
              set: (value, options = {}) => {
                h.state(name, value, toOptions(mergeOptions(options)))
              },
              get: (options = {}) => {
                const cookieHeader = request.headers.cookie
                return cookieHeader
                  ? parse(cookieHeader, options)[name]
                  : undefined
              },
              delete: (options = {}) => {
                h.unstate(name, toOptions(mergeOptions(options)))
              },
            }
          },
          setHeaders: (headers) => {
            let hapiResponse = h.response().code(status)
            Object.entries(headers).forEach(([key, value]) => {
              hapiResponse = hapiResponse.header(key, value)
            })
            resolve(hapiResponse)
          },
        }

        // Add close event listener to the request
        Object.assign(request, {
          on(event: 'close', listener: () => {}) {
            request.raw.req.on('close', () => {
              listener()
              console.log('Connection closed')
            })
          },
        })

        try {
          handler(request as any, triToUse, () => {})
        } catch (err) {
          reject(err)
        }
      })
    }
  }
}

export function remultApi(
  options: RemultServerOptions<Request>,
): RemultHapiServer {
  const coreOptions: ServerCoreOptions<Request> = {
    buildGenericRequestInfo: (req: Request) => ({
      method: req.method,
      params: req.params,
      query: req.query,
      url: req.url.pathname,
      on: (e: 'close', do1: VoidFunction) => {
        req.raw.req.on('close', do1)
      },
    }),
    getRequestBody: async (req: Request) => req.payload,
  }
  const api = createRemultServer(options, coreOptions)

  const routesPlugin: Plugin<undefined> = {
    name: 'remultPlugin',
    register: async (server: Server) => {
      const router = new HapiRouteImplementation(server, coreOptions)
      api.registerRouter(router)
    },
  }

  return Object.assign(routesPlugin, {
    getRemult: (req: Request) => api.getRemult(req),
    openApiDoc: (options: any) => api.openApiDoc(options),
    withRemult: <T>(req: Request, action: () => Promise<T>) =>
      api.withRemultAsync<T>(req, action),
  })
}

export type RemultHapiServer = Plugin<any, any> &
  RemultServerCore<Request> & {
    withRemult: RemultServer<Request>['withRemultAsync']
  }

/** @deprecated use remultApi instead */
export const remultHapi = remultApi
