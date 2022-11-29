import { createRemultServerCore, GenericRequest, RemultServer, RemultServerOptions } from './expressBridge';
import { initAsyncHooks } from './initAsyncHooks';
export { queuedJobInfo, QueueStorage, GenericRequest, GenericRequestHandler, GenericResponse, GenericRouter, RemultServerOptions, SpecificRoute, RemultServer } from './expressBridge';
export { JsonEntityFileStorage, JsonFileDataProvider } from './JsonEntityFileStorage';

export function createRemultServer<RequestType extends GenericRequest = GenericRequest>(
  options?:
    RemultServerOptions<RequestType>,
): RemultServer {
  initAsyncHooks();
  return createRemultServerCore(options);
}