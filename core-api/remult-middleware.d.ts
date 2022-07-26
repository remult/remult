import { GenericRequest, GenericMiddleware, GenericResponse, GenericRouter, buildRemultServer, RemultMiddlewareOptions, SpecificRoute, RemultServer } from './server/expressBridge';
export declare function remultMiddleware(options?: RemultMiddlewareOptions): RemultMiddleware;
export interface RemultMiddleware extends GenericMiddleware, RemultServer {
    handle(req: GenericRequest, gRes?: GenericResponse): Promise<MiddlewareResponse>;
}
export interface MiddlewareResponse {
    data?: any;
    statusCode?: number;
}
export { GenericRequest, GenericMiddleware as GenericRequestHandler, GenericResponse, GenericRouter, buildRemultServer, RemultMiddlewareOptions, SpecificRoute, RemultServer };
