import type {
  RemultServer,
  RemultServerOptions,
  ServerCoreOptions,
  ServerHandleResponse,
} from './remult-api-server.js'
import {
  createRemultServerCore,
  type GenericRequestInfo,
} from './remult-api-server.js'
import { initAsyncHooks } from './initAsyncHooks.js'
import { cast } from '../src/isOfType.js'
export { SseSubscriptionServer } from '../SseSubscriptionServer.js'
export { DataProviderLiveQueryStorage } from '../live-query/data-provider-live-query-storage.js'
export {
  JsonEntityFileStorage,
  JsonFileDataProvider,
} from './JsonEntityFileStorage.js'
export { TestApiDataProvider } from './test-api-data-provider.js'
export {
  GenericRequestHandler,
  GenericRequestInfo,
  GenericResponse,
  GenericRouter,
  InitRequestOptions,
  QueueStorage,
  RemultServer,
  RemultServerCore,
  RemultServerOptions,
  SpecificRoute,
  queuedJobInfo,
  Module,
  ModuleInput,
} from './remult-api-server.js'
export function createRemultServer<RequestType>(
  options: RemultServerOptions<RequestType>,
  serverCoreOptions?: ServerCoreOptions<RequestType>,
): RemultServer<RequestType> {
  initAsyncHooks()
  return createRemultServerCore<RequestType>(
    options,
    serverCoreOptions || {
      buildGenericRequestInfo: (req) => cast<GenericRequestInfo>(req, 'method'),
      getRequestBody: async (req) => (req as any).body,
    },
  )
}

export const remultHandlerToResponse = (
  responseFromRemultHandler: ServerHandleResponse | undefined,
  sseResponse: Response | undefined,
  requestUrl: string,
) => {
  if (sseResponse !== undefined) {
    return sseResponse
  }
  if (responseFromRemultHandler !== undefined) {
    if (responseFromRemultHandler.data)
      return new Response(JSON.stringify(responseFromRemultHandler.data), {
        status: responseFromRemultHandler.statusCode,
      })

    if (responseFromRemultHandler.redirectUrl)
      return Response.redirect(
        new URL(responseFromRemultHandler.redirectUrl, requestUrl),
        responseFromRemultHandler.statusCode,
      )

    if (responseFromRemultHandler.content)
      return new Response(responseFromRemultHandler.content, {
        status: responseFromRemultHandler.statusCode,
        headers: {
          ...(responseFromRemultHandler.headers ?? {
            'Content-Type': 'text/html',
          }),
        },
      })
  }
  return new Response('Not Found', {
    status: 404,
  })
}
