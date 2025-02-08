import type { ResponseRequiredForSSE } from 'SseSubscriptionServer.js'
import type { H3Event } from 'h3'
import { readBody, setResponseStatus } from 'h3'
import type {
  GenericResponse,
  RemultServerCore,
  RemultServerOptions,
  RemultServer,
} from './server/index.js'
import { createRemultServer } from './server/index.js'

export function remultNuxt(
  options: RemultServerOptions<H3Event>,
): RemultNuxtServer {
  const result = createRemultServer<H3Event>(options, {
    buildGenericRequestInfo: (event) => {
      return {
        method: event.node.req.method,
        url: event.node.req.url,
        on: (a: 'close', b: () => void) =>
          event.node.req.on('close', () => {
            b()
          }),
      }
    },
    getRequestBody: async (event) => await readBody(event),
  })
  const handler = async (event: H3Event) => {
    let sse = false

    const response: GenericResponse & ResponseRequiredForSSE = {
      setCookie: () => {},
      redirect: () => {},
      end: () => {},
      send: () => {},
      json: () => {},
      status: () => {
        return response
      },
      write: (what) => {
        event.node.res.write(what)
      },
      writeHead: (status, headers) => {
        sse = true
        event.node.res.writeHead(status, headers)
      },
    }
    const r = await result.handle(event, response)

    if (sse) {
      await new Promise((resolve) => {
        event.node.req.on('close', () => resolve({}))
      })
    }
    if (r) {
      if (r.statusCode !== 200) setResponseStatus(event, r.statusCode)
      if (r.html) return r.html
      return r.data == null ? 'null' : r.data
    }
  }

  return Object.assign(handler, {
    getRemult: (req: H3Event) => result.getRemult(req),
    openApiDoc: (options: { title: string }) => result.openApiDoc(options),
    withRemult<T>(request: H3Event, what: () => Promise<T>): Promise<T> {
      return result.withRemultAsync(request, what)
    },
  })
}

export type RemultNuxtServer = RemultServerCore<H3Event> &
  ((event: H3Event) => Promise<any>) & {
    withRemult: RemultServer<H3Event>['withRemultAsync']
  }
