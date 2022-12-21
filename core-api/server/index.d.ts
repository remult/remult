import { GenericRequest, RemultServer, RemultServerOptions } from './expressBridge';
export { queuedJobInfo, QueueStorage, GenericRequest, GenericRequestHandler, GenericResponse, GenericRouter, RemultServerOptions, SpecificRoute, RemultServer } from './expressBridge';
export { JsonEntityFileStorage, JsonFileDataProvider } from './JsonEntityFileStorage';
export declare function createRemultServer<RequestType extends GenericRequest = GenericRequest>(options?: RemultServerOptions<RequestType>): RemultServer;
