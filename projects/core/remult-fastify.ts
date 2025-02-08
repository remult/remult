import type {
  FastifyInstance,
  FastifyPluginCallback,
  FastifyRequest,
  RouteHandlerMethod,
} from 'fastify'
import type { ResponseRequiredForSSE } from './SseSubscriptionServer.js'
import type {
  GenericRequestHandler,
  GenericResponse,
  GenericRouter,
  RemultServerCore,
  RemultServerOptions,
  SpecificRoute,
  RemultServer,
} from './server/remult-api-server.js'
import { createRemultServer } from './server/index.js'

export function remultFastify(
  options: RemultServerOptions<FastifyRequest>,
): RemultFastifyServer {
  function fastifyHandler(handler: GenericRequestHandler<FastifyRequest>) {
    const response: RouteHandlerMethod = (req, res) => {
      const myRes: GenericResponse & ResponseRequiredForSSE = {
        setCookie: () => {},
        redirect: () => {},
        status(statusCode) {
          res.status(statusCode)
          return myRes
        },
        end() {
          res.send()
        },
        send(html) {
          res.type('text/html').send(html)
        },
        json(data) {
          res.send(data)
        },
        write(data: string) {
          res.raw.write(data)
        },
        writeHead(status: number, headers: any) {
          res.raw.writeHead(status, headers)
        },
      }
      Object.assign(req, {
        on(event: 'close', listener: () => {}) {
          req.raw.on(event, listener)
        },
      })
      handler(req, myRes, () => {})
    }
    return response
  }
  const api = createRemultServer(options, {
    buildGenericRequestInfo: (req) => req,
    getRequestBody: async (req) => req.body,
  })
  const pluginFunction: FastifyPluginCallback = async (
    instance: FastifyInstance,
    op,
  ) => {
    //@ts-ignore
    let fastifyRouter: GenericRouter = {
      route(path: string) {
        let r = {
          delete(handler) {
            instance.delete(path, fastifyHandler(handler))
            return r
          },
          get(handler) {
            instance.get(path, fastifyHandler(handler))
            return r
          },
          post(handler) {
            instance.post(path, fastifyHandler(handler))
            return r
          },
          put(handler) {
            instance.put(path, fastifyHandler(handler))
            return r
          },
        } as SpecificRoute<FastifyRequest>
        return r
      },
    }
    api.registerRouter(fastifyRouter)
  }

  return Object.assign(pluginFunction, {
    getRemult: (x: FastifyRequest) => api.getRemult(x),
    openApiDoc: (x: any) => api.openApiDoc(x),
    withRemult: <T>(req: FastifyRequest, what: () => Promise<T>) =>
      api.withRemultAsync<T>(req, what),
  })
}

export type RemultFastifyServer = FastifyPluginCallback &
  RemultServerCore<FastifyRequest> & {
    withRemult: RemultServer<FastifyRequest>['withRemultAsync']
  }
