import type {
  RemultServer,
  RemultServerOptions,
  ServerCoreOptions,
} from './expressBridge'
import { createRemultServerCore } from './expressBridge'
import { initAsyncHooks } from './initAsyncHooks'
export { SseSubscriptionServer } from '../SseSubscriptionServer'
export { DataProviderLiveQueryStorage } from '../live-query/data-provider-live-query-storage'
export {
  JsonEntityFileStorage,
  JsonFileDataProvider,
} from './JsonEntityFileStorage'
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
} from './expressBridge'
export function createRemultServer<RequestType>(
  options: RemultServerOptions<RequestType>,
  serverCoreOptions?: ServerCoreOptions<RequestType>,
): RemultServer<RequestType> {
  initAsyncHooks()
  return createRemultServerCore(
    options,
    serverCoreOptions || {
      buildGenericRequestInfo: (req) => req,
      getRequestBody: async (req) => (req as any).body,
    },
  )
}
