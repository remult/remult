import type {
  FastifyInstance,
  FastifyPluginCallback,
  RouteHandlerMethod,
  FastifyRequest,
} from 'fastify'
import { createRemultServer } from './server/index'
import {
  GenericRequestHandler,
  GenericResponse,
  GenericRouter,
  RemultServer,
  RemultServerOptions,
  SpecificRoute,
  RemultServerCore,
} from './server/expressBridge'
import { ResponseRequiredForSSE } from './SseSubscriptionServer'

export function remultFastify(
  options: RemultServerOptions<FastifyRequest>,
): RemultFastifyServer {
  function fastifyHandler(handler: GenericRequestHandler) {
    const response: RouteHandlerMethod = (req, res) => {
      const myRes: GenericResponse & ResponseRequiredForSSE = {
        status(statusCode) {
          res.status(statusCode)
          return myRes
        },
        end() {
          res.send()
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
      route(path) {
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
        } as SpecificRoute
        return r
      },
    }
    api.registerRouter(fastifyRouter)
  }

  return Object.assign(pluginFunction, {
    getRemult: (x) => api.getRemult(x),
    openApiDoc: (x) => api.openApiDoc(x),
    withRemult: <T>(req, what) => api.withRemultPromise<T>(req, what),
  })
}

export type RemultFastifyServer = FastifyPluginCallback &
  RemultServerCore<FastifyRequest> & {
    withRemult<T>(req: FastifyRequest, what: () => Promise<T>): Promise<T>
  }
