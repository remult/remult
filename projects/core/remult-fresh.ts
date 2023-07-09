import {} from './server/core'
import {
  RemultServerOptions,
  RemultServer,
  createRemultServerCore,
  GenericRequestInfo,
  RemultServerCore,
} from './server/expressBridge'
import { Remult } from './src/context'

export function remultFresh(
  options: RemultServerOptions<FreshRequest>,
  response: FreshResponse,
): RemultFresh {
  const server = createRemultServerCore<FreshRequest>(options, {
    buildGenericRequestInfo: (r) => r,
    getRequestBody: (req) => req.json(),
  })
  return {
    getRemult: (r) => server.getRemult(r),
    openApiDoc: (x) => server.openApiDoc(x),
    handle: async (req: FreshRequest, ctx: FreshContext) => {
      let init: ResponseInit = {}
      const res = await server.handle(req)
      if (res) {
        init.status = res.statusCode
        if (res.data) {
          return response.json(res.data, init)
        } else return new response(undefined, init)
      } else {
        return ctx.next()
      }
    },
  }
}

export interface RemultFresh extends RemultServerCore<FreshRequest> {
  handle(req: FreshRequest, ctx: FreshContext): Promise<any>
}
export interface FreshRequest {
  url: string
  method: string
  json: () => Promise<any>
}
export interface FreshContext {
  next: () => Promise<any>
}
export interface FreshResponse {
  new (body?: any | undefined, init?: ResponseInit): any
  json(data: unknown, init?: ResponseInit): any
}
