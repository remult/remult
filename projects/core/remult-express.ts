import * as express from 'express'

import { createRemultServer } from './server/index'
import type {
  RemultServer,
  RemultServerCore,
  RemultServerImplementation,
  RemultServerOptions,
} from './server/expressBridge'

export function remultExpress(
  options?: RemultServerOptions<express.Request> & {
    bodyParser?: boolean
    bodySizeLimit?: string
  },
): RemultExpressServer {
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
  const server = createRemultServer<express.Request>(options, {
    buildGenericRequestInfo: (req) => req,
    getRequestBody: async (req) => req.body,
  }) as RemultServerImplementation<express.Request>
  server.registerRouter(app)

  return Object.assign(app, {
    getRemult: (req) => server.getRemult(req),
    openApiDoc: (options: { title: string }) => server.openApiDoc(options),
    withRemult: (req, res, next) => server.withRemult(req, res, next),
    // [ ]- add with remult promise
  })
}

export type RemultExpressServer = express.RequestHandler &
  RemultServerCore<express.Request> & {
    withRemult: (
      req: express.Request,
      res: express.Response,
      next: VoidFunction,
    ) => void
  }
