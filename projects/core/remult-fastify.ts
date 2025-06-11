import type {
  FastifyInstance,
  FastifyPluginCallback,
  FastifyRequest,
  RouteHandlerMethod,
} from 'fastify'
import { createRemultServer } from './server/index.js'
import type {
  GenericRequestHandler,
  RemultServer,
  RemultServerCore,
  RemultServerOptions,
  ServerCoreOptions,
  SpecificRoute,
  TypicalResponse,
} from './server/remult-api-server.js'
import { RouteImplementation } from './server/remult-api-server.js'
import { parse, serialize } from './src/remult-cookie.js'

class FastifyRouteImplementation extends RouteImplementation<FastifyRequest> {
  constructor(
    private instance: FastifyInstance,
    coreOptions: ServerCoreOptions<FastifyRequest>,
  ) {
    super(coreOptions)
  }

  route(path: string): SpecificRoute<FastifyRequest> {
    const parentRoute = super.route(path)
    return this.createFastifyRoute(path, parentRoute)
  }

  createRouteHandlers(
    path: string,
    m: Map<string, GenericRequestHandler<FastifyRequest>>,
  ): SpecificRoute<FastifyRequest> {
    const parentRoute = super.createRouteHandlers(path, m)
    return this.createFastifyRoute(path, parentRoute, m)
  }

  private createFastifyRoute(
    path: string,
    parentRoute: SpecificRoute<FastifyRequest>,
    methodMap?: Map<string, GenericRequestHandler<FastifyRequest>>,
  ): SpecificRoute<FastifyRequest> {
    const registerMethod = (
      method: 'get' | 'post' | 'put' | 'delete',
      handler: GenericRequestHandler<FastifyRequest>,
    ) => {
      methodMap?.set(method, handler)
      const fastifyHandler = this.createFastifyHandler(handler)

      switch (method) {
        case 'get':
          this.instance.get(path, fastifyHandler)
          break
        case 'post':
          this.instance.post(path, fastifyHandler)
          break
        case 'put':
          this.instance.put(path, fastifyHandler)
          break
        case 'delete':
          this.instance.delete(path, fastifyHandler)
          break
      }

      return route
    }

    const route = {
      delete: (handler: GenericRequestHandler<FastifyRequest>) =>
        registerMethod('delete', handler),
      get: (handler: GenericRequestHandler<FastifyRequest>) =>
        registerMethod('get', handler),
      post: (handler: GenericRequestHandler<FastifyRequest>) =>
        registerMethod('post', handler),
      put: (handler: GenericRequestHandler<FastifyRequest>) =>
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
            const fastifyHandler = this.createFastifyHandler(handler)
            this.instance.get(path, fastifyHandler)
          }
        }

        return route
      },
    } as SpecificRoute<FastifyRequest>

    return route
  }

  private createFastifyHandler(
    handler: GenericRequestHandler<FastifyRequest>,
  ): RouteHandlerMethod {
    return (req, res) => {
      // Add close event listener to the request
      Object.assign(req, {
        on(event: 'close', listener: () => {}) {
          req.raw.on(event, listener)
        },
      })

      const response = this.createFastifyResponse(res)
      handler(req, response, () => {})
    }
  }

  private createFastifyResponse(res: any): TypicalResponse {
    return {
      cookie: (name) => {
        return {
          set: (value, options = {}) => {
            res.header('Set-Cookie', serialize(name, value, options))
          },
          get: (options = {}) => {
            const cookieHeader = res.request.headers.cookie
            return cookieHeader ? parse(cookieHeader, options)[name] : undefined
          },
          delete: (options = {}) => {
            res.header(
              'Set-Cookie',
              serialize(name, '', { ...options, maxAge: 0 }),
            )
          },
        }
      },
      res: {
        redirect: (url, statusCode = 307) => {
          res.redirect(statusCode, url)
        },
        status(statusCode) {
          res.status(statusCode)
          return this
        },
        end() {
          res.send()
        },
        send(html, headers) {
          res.type(headers?.['Content-Type'] || 'text/html').send(html)
        },
        json(data) {
          res.send(data)
        },
        // setHeaders: (headers) => {
        //   Object.entries(headers).forEach(([key, value]) => {
        //     res.header(key, value)
        //   })
        // },
      },
      sse: {
        write(data: string) {
          res.raw.write(data)
        },
        writeHead(status: number, headers: any) {
          res.raw.writeHead(status, headers)
        },
      },
    }
  }
}

export function remultApi(
  options: RemultServerOptions<FastifyRequest>,
): RemultFastifyServer {
  const api = createRemultServer(options, {
    buildGenericRequestInfo: (req) => req,
    getRequestBody: async (req) => req.body,
  })

  const pluginFunction: FastifyPluginCallback = async (
    instance: FastifyInstance,
  ) => {
    const router = new FastifyRouteImplementation(instance, {
      buildGenericRequestInfo: (req) => req,
      getRequestBody: async (req) => req.body,
    })

    api.registerRouter(router)
  }

  return Object.assign(pluginFunction, {
    getRemult: (req: FastifyRequest) => api.getRemult(req),
    openApiDoc: (options: any) => api.openApiDoc(options),
    withRemult: <T>(req: FastifyRequest, action: () => Promise<T>) =>
      api.withRemultAsync<T>(req, action),
  })
}

export type RemultFastifyServer = FastifyPluginCallback &
  RemultServerCore<FastifyRequest> & {
    withRemult: RemultServer<FastifyRequest>['withRemultAsync']
  }

/** @deprecated use remultApi instead */
export const remultFastify = remultApi
