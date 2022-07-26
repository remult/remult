import { GenericRequest, GenericMiddleware, GenericResponse, GenericRouter, buildRemultServer, RemultServerOptions, SpecificRoute, RemultServer } from './server/expressBridge';
export declare function remultMiddleware(options?: RemultServerOptions): RemultMiddleware;
export interface RemultMiddleware extends GenericMiddleware, RemultServer {
    handle(req: GenericRequest, gRes?: GenericResponse): Promise<MiddlewareResponse>;
}
export interface MiddlewareResponse {
    data?: any;
    statusCode?: number;
}
export { GenericRequest, GenericMiddleware as GenericRequestHandler, GenericResponse, GenericRouter, buildRemultServer, RemultServerOptions as RemultMiddlewareOptions, SpecificRoute, RemultServer };
