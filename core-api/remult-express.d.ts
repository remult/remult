import { RemultMiddlewareOptions } from './server/expressBridge';
export declare function remultExpress(options?: RemultMiddlewareOptions & {
    bodyParser?: boolean;
    bodySizeLimit?: string;
}): import("./server/expressBridge").RemultExpressBridge;
