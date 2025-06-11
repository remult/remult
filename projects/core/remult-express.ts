import * as express from 'express'
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

class ExpressRouteImplementation extends RouteImplementation<express.Request> {
  constructor(
    private app: express.Router,
    coreOptions: ServerCoreOptions<express.Request>,
  ) {
    super(coreOptions)
  }

  route(path: string): SpecificRoute<express.Request> {
    const parentRoute = super.route(path)
    return this.createExpressRoute(path, parentRoute)
  }

  createRouteHandlers(
    path: string,
    m: Map<string, GenericRequestHandler<express.Request>>,
  ): SpecificRoute<express.Request> {
    const parentRoute = super.createRouteHandlers(path, m)
    return this.createExpressRoute(path, parentRoute, m)
  }

  private createExpressRoute(
    path: string,
    parentRoute: SpecificRoute<express.Request>,
    methodMap?: Map<string, GenericRequestHandler<express.Request>>,
  ): SpecificRoute<express.Request> {
    const registerMethod = (
      method: 'get' | 'post' | 'put' | 'delete',
      handler: GenericRequestHandler<express.Request>,
    ) => {
      methodMap?.set(method, handler)
      this.app[method](path, this.createExpressHandler(handler))
      return route
    }

    const route = {
      delete: (handler: GenericRequestHandler<express.Request>) =>
        registerMethod('delete', handler),
      get: (handler: GenericRequestHandler<express.Request>) =>
        registerMethod('get', handler),
      post: (handler: GenericRequestHandler<express.Request>) =>
        registerMethod('post', handler),
      put: (handler: GenericRequestHandler<express.Request>) =>
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
            this.app.get(path, this.createExpressHandler(handler))
          }
        }

        return route
      },
    } as SpecificRoute<express.Request>

    return route
  }

  private createExpressHandler(
    handler: GenericRequestHandler<express.Request>,
  ) {
    return (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      const response = this.createExpressResponse(req, res)
      handler(req, response, next)
    }
  }

  private createExpressResponse(
    req: express.Request,
    res: express.Response,
  ): TypicalResponse {
    return {
      cookie: (name) => {
        return {
          set: (value, options = {}) => {
            res.header('Set-Cookie', serialize(name, value, options))
          },
          get: (options = {}) => {
            const cookieHeader = req.headers.cookie
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
          res.end()
        },
        send(html, headers) {
          if (headers?.['Content-Type']) {
            res.type(headers['Content-Type'])
          }
          res.send(html)
        },
        json(data) {
          res.json(data)
        },
        // setHeaders: (headers) => {
        //   Object.entries(headers).forEach(([key, value]) => {
        //     res.header(key, value)
        //   })
        // },
      },
      sse: {
        write(data: string) {
          res.write(data)
        },
        writeHead(status: number, headers: any) {
          res.writeHead(status, headers)
        },
      },
    }
  }
}

export function remultApi(
  options?: RemultServerOptions<express.Request> & {
    bodyParser?: boolean
    bodySizeLimit?: string
  },
): remultApiServer {
  const app = express.Router()

  if (!options) {
    options = {}
  }
  if (options.bodySizeLimit === undefined) {
    options.bodySizeLimit = '10mb'
  }
  if (options?.bodyParser !== false) {
    app.use(express.json({ limit: options.bodySizeLimit }))
    app.use(
      express.urlencoded({ extended: true, limit: options.bodySizeLimit }),
    )
  }

  const server = createRemultServer<express.Request>(options, {
    buildGenericRequestInfo: (req) => req,
    getRequestBody: async (req) => req.body,
  })

  const router = new ExpressRouteImplementation(app, {
    buildGenericRequestInfo: (req) => req,
    getRequestBody: async (req) => req.body,
  })

  server.registerRouter(router)

  return Object.assign(app, {
    getRemult: (req: express.Request) => server.getRemult(req),
    openApiDoc: (options: { title: string }) => server.openApiDoc(options),
    withRemult: (
      req: express.Request,
      res: express.Response,
      next: VoidFunction,
    ) => {
      server.withRemultAsync(req, async () => {
        next()
      })
    },
    withRemultAsync: <T>(req: express.Request, what: () => Promise<T>) =>
      server.withRemultAsync<T>(req, what),
  })
}

export type remultApiServer = express.RequestHandler &
  RemultServerCore<express.Request> & {
    withRemult: (
      req: express.Request,
      res: express.Response,
      next: VoidFunction,
    ) => void
  } & Pick<RemultServer<express.Request>, 'withRemultAsync'>

/** @deprecated use remultApi instead */
export const remultExpress = remultApi
