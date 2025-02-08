import type {
  Request,
  Plugin,
  Server,
  ResponseToolkit,
  ReqRefDefaults,
} from '@hapi/hapi'
import {
  createRemultServer,
  type SpecificRoute,
  type RemultServerCore,
  type RemultServerOptions,
  type GenericRequestHandler,
  type GenericResponse,
  type GenericRouter,
  type RemultServer,
} from './server/index.js'
import type { ResponseRequiredForSSE } from './SseSubscriptionServer.js'
import { PassThrough } from 'stream'

export function remultHapi(
  options: RemultServerOptions<Request>,
): RemultHapiServer {
  const api = createRemultServer(options, {
    buildGenericRequestInfo: (req) => ({
      method: req.method,
      params: req.params,
      query: req.query,
      url: req.url.pathname,
      on: (e: 'close', do1: VoidFunction) => {
        req.raw.req.on('close', do1)
      },
    }),
    getRequestBody: async (req) => req.payload,
  })

  const routesPlugin: Plugin<undefined> = {
    name: 'remultPlugin',
    register: async (server: Server) => {
      function hapiHandler(handler: GenericRequestHandler<Request>) {
        return (request: Request<ReqRefDefaults>, h: ResponseToolkit) => {
          return new Promise((res, rej) => {
            let status = 200

            let stream: PassThrough

            let r: GenericResponse & ResponseRequiredForSSE = {
              setCookie: () => {},
              redirect: () => {},
              status(statusCode) {
                status = statusCode
                return r
              },
              end() {
                res(h.response().code(status))
              },
              send(html) {
                res(h.response(html).code(status))
              },
              json(data) {
                res(h.response(data === null ? 'null' : data).code(status))
              },
              write(data) {
                stream.write(data)
              },
              writeHead(status, headers) {
                stream = new PassThrough()
                res(
                  h
                    .response(stream)
                    .header('content-type', 'text/event-stream')
                    .header('content-encoding', 'identity'),
                )
              },
            }
            try {
              Object.assign(request, {
                on(event: 'close', listener: () => {}) {
                  request.raw.req.on('close', () => {
                    listener()
                    console.log('Connection closed')
                  })
                },
              })
              handler(request as any, r, () => {})
            } catch (err) {
              rej(err)
            }
          })
        }
      }

      let hapiRouter: GenericRouter<Request> = {
        route(path) {
          path = path.replace(/:id\b/g, '{id}')
          let r = {
            get(handler) {
              server.route({
                method: 'GET',
                path,
                handler: hapiHandler(handler),
              })
              return r
            },
            post(handler) {
              server.route({
                method: 'POST',
                path,
                handler: hapiHandler(handler),
              })
              return r
            },
            put(handler) {
              server.route({
                method: 'PUT',
                path,
                handler: hapiHandler(handler),
              })
              return r
            },
            delete(handler) {
              server.route({
                method: 'DELETE',
                path,
                handler: hapiHandler(handler),
              })
              return r
            },
          } as SpecificRoute<Request>
          return r
        },
      }
      api.registerRouter(hapiRouter)
    },
  }

  return Object.assign(routesPlugin, {
    getRemult: (x: Request) => api.getRemult(x),
    openApiDoc: (x: any) => api.openApiDoc(x),
    withRemult: <T>(req: Request, what: () => Promise<T>) =>
      api.withRemultAsync<T>(req, what),
  })
}

export type RemultHapiServer = Plugin<any, any> &
  RemultServerCore<Request> & {
    withRemult: RemultServer<Request>['withRemultAsync']
  }
