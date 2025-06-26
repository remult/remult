import type {
  GenericRequest,
  RemultServer,
  RemultServerOptions,
  ServerCoreOptions,
} from './remult-api-server.js'
import {
  createRemultServerCore,
  type GenericRequestInternal,
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
  GenericRequestInternal,
  GenericResponse,
  GenericRouter,
  InitRequestOptions,
  QueueStorage,
  RemultServer,
  RemultServerCore,
  RemultServerOptions,
  SpecificRoute,
  queuedJobInfo,
} from './remult-api-server.js'
export { Module } from './module.js'
export type { ModuleInput } from './module.js'
export function createRemultServer<RequestType>(
  options: RemultServerOptions<RequestType>,
  serverCoreOptions?: ServerCoreOptions<RequestType>,
): RemultServer<RequestType> {
  initAsyncHooks()
  return createRemultServerCore<RequestType>(
    options,
    serverCoreOptions || {
      buildGenericRequestInfo: (req) => ({
        internal: cast<GenericRequestInternal>(req, 'method'),
        public: { headers: new Headers((req as any).headers) },
      }),
      getRequestBody: async (req) => (req as any).body,
    },
  )
}
