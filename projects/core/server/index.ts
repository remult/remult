import { cast } from '../src/isOfType.js'
import { initAsyncHooks } from './initAsyncHooks.js'
import type {
  RemultServer,
  RemultServerOptions,
  ServerCoreOptions,
} from './remult-api-server.js'
import {
  createRemultServerCore,
  type GenericRequestInfo,
} from './remult-api-server.js'
export { DataProviderLiveQueryStorage } from '../live-query/data-provider-live-query-storage.js'
export { SseSubscriptionServer } from '../SseSubscriptionServer.js'
export {
  JsonEntityFileStorage,
  JsonFileDataProvider,
} from './JsonEntityFileStorage.js'
export { Module } from './Module.js'
export type { ModuleInput } from './Module.js'
export { createRemultServerCore } from './remult-api-server.js'
export type {
  GenericRequestHandler,
  GenericRequestInfo,
  GenericResponse,
  InitRequestOptions,
  InternalGenericRequestHandler,
  InternalGenericRouter,
  InternalSpecificRoute,
  queuedJobInfo,
  QueueStorage,
  RemultServer,
  RemultServerCore,
  RemultServerOptions,
  Routes,
  SpecificRoute,
  TypicalResponse,
} from './remult-api-server.js'
export { TestApiDataProvider } from './test-api-data-provider.js'

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
