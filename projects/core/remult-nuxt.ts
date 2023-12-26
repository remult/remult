import { ResponseRequiredForSSE } from 'SseSubscriptionServer.js'
import type { H3Event } from 'h3'
import { readBody } from 'h3'
import {
  GenericResponse,
  RemultServerCore,
  RemultServerOptions,
  createRemultServer,
  RemultServer,
} from './server/index.js'

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
      end: () => {},
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
      return r.data
    }
  }

  return Object.assign(handler, {
    getRemult: (req) => result.getRemult(req),
    openApiDoc: (options: { title: string }) => result.openApiDoc(options),
    withRemult<T>(event: H3Event, what: () => Promise<T>): Promise<T> {
      return result.withRemultAsync(event, what)
    },
  })
}

export type RemultNuxtServer = RemultServerCore<H3Event> &
  ((event: H3Event) => Promise<any>) & {
    withRemult: RemultServer<H3Event>['withRemultAsync']
  }
