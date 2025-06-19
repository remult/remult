import * as express from 'express'

import type {
  RemultServer,
  RemultServerCore,
  RemultServerImplementation,
  RemultServerOptions,
  GenericRequestHandler,
  GenericResponse,
  GenericRouter,
  SpecificRoute,
} from './server/remult-api-server.js'
import { createRemultServer } from './server/index.js'
import type { ResponseRequiredForSSE } from './SseSubscriptionServer.js'

export function remultApi(
  options?: RemultServerOptions<express.Request> & {
    bodyParser?: boolean
    bodySizeLimit?: string
  },
): remultApiServer {
  function expressHandler(handler: GenericRequestHandler<express.Request>) {
    const response: express.RequestHandler = (req, res, next) => {
      const myRes: GenericResponse & ResponseRequiredForSSE = {
        status(statusCode) {
          res.status(statusCode)
          return myRes
        },
        end() {
          res.end()
        },
        send(html) {
          res.send(html)
        },
        json(data) {
          res.json(data)
        },
        write(data) {
          res.write(data)
        },
        writeHead(status, headers) {
          res.writeHead(status, headers)
        },
        redirect(url, status) {
          res.redirect(status ?? 307, url)
        },
      }
      handler(req, myRes, next)
    }
    return response
  }

  let app = express.Router()

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

  const api = createRemultServer<express.Request>(options, {
    buildGenericRequestInfo: (req) => ({
      ...req,
      headers: req.headers as Record<string, string>,
      on: req.on,
    }),
    getRequestBody: async (req) => req.body,
  }) as RemultServerImplementation<express.Request>

  let expressRouter: GenericRouter<express.Request> = {
    route(path: string) {
      let r = {
        delete(handler) {
          app.delete(path, expressHandler(handler))
          return r
        },
        get(handler) {
          app.get(path, expressHandler(handler))
          return r
        },
        post(handler) {
          app.post(path, expressHandler(handler))
          return r
        },
        put(handler) {
          app.put(path, expressHandler(handler))
          return r
        },
      } as SpecificRoute<express.Request>
      return r
    },
  }

  api.registerRouter(expressRouter)

  return Object.assign(app, {
    getRemult: (req: express.Request) => api.getRemult(req),
    openApiDoc: (options: { title: string }) => api.openApiDoc(options),
    withRemult: (
      req: express.Request,
      res: express.Response,
      next: VoidFunction,
    ) => api.withRemult(req, res, next),
    withRemultAsync: <T>(req: express.Request, what: () => Promise<T>) =>
      api.withRemultAsync<T>(req, what),
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
