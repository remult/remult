import {
  createRemultServerCore,
  GenericRequestInfo,
  RemultServer,
  RemultServerOptions,
  ServerCoreOptions,
} from './expressBridge'
import { initAsyncHooks } from './initAsyncHooks'
export {
  queuedJobInfo,
  QueueStorage,
  GenericRequestInfo,
  GenericRequestHandler,
  RemultServerCore,
  GenericResponse,
  GenericRouter,
  RemultServerOptions,
  SpecificRoute,
  RemultServer,
  InitRequestOptions,
} from './expressBridge'
export {
  JsonEntityFileStorage,
  JsonFileDataProvider,
} from './JsonEntityFileStorage'
export { DataProviderLiveQueryStorage } from '../live-query/data-provider-live-query-storage'
export { SseSubscriptionServer } from '../SseSubscriptionServer'
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
