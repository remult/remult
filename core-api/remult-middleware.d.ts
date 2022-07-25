import { GenericRequest, GenericRequestHandler, GenericResponse, GenericRouter, buildRemultServer, RemultMiddlewareOptions, SpecificRoute, RemultServer } from './server/expressBridge';
export declare function remultMiddleware(options?: RemultMiddlewareOptions): RemultMiddleware;
export interface RemultMiddleware extends GenericRequestHandler, RemultServer {
    handle(req: GenericRequest, gRes?: GenericResponse): Promise<MiddlewareResponse>;
}
export interface MiddlewareResponse {
    data?: any;
    statusCode?: number;
}
export { GenericRequest, GenericRequestHandler, GenericResponse, GenericRouter, buildRemultServer, RemultMiddlewareOptions, SpecificRoute, RemultServer };
