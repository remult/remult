import * as express from 'express'

import type {
  RemultServer,
  RemultServerCore,
  RemultServerImplementation,
  RemultServerOptions,
} from './server/remult-api-server.js'
import { createRemultServer } from './server/index.js'

export function remultApi(
  options?: RemultServerOptions<express.Request> & {
    bodyParser?: boolean
    bodySizeLimit?: string
  },
): remultApiServer {
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
    getRemult: (req: express.Request) => server.getRemult(req),
    openApiDoc: (options: { title: string }) => server.openApiDoc(options),
    withRemult: (
      req: express.Request,
      res: express.Response,
      next: VoidFunction,
    ) => server.withRemult(req, res, next),
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
