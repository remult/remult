import { createRemultServerCore, GenericRequest, RemultServer, RemultServerOptions, } from './expressBridge';
import { initAsyncHooks } from './initAsyncHooks';
export { queuedJobInfo, QueueStorage, GenericRequest, GenericRequestHandler, GenericResponse, GenericRouter, RemultServerOptions, SpecificRoute, RemultServer, InitRequestOptions } from './expressBridge';
export { JsonEntityFileStorage, JsonFileDataProvider } from './JsonEntityFileStorage';
export { DataProviderLiveQueryStorage } from '../live-query/data-provider-live-query-storage';
export function createRemultServer<RequestType extends GenericRequest = GenericRequest>(
  options?:
    RemultServerOptions<RequestType>,
): RemultServer {
  initAsyncHooks();
  return createRemultServerCore(options);
}