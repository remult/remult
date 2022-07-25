import { RemultMiddlewareOptions, RemultServer } from "./server/expressBridge";
export declare function remultFresh(options: RemultMiddlewareOptions, response: FreshResponse): RemultFresh;
export interface RemultFresh extends RemultServer {
    handle(req: FreshRequest, ctx: FreshContext): Promise<FreshResponse>;
}
interface FreshRequest {
    url: string;
    method: string;
    json: () => Promise<any>;
}
interface FreshContext {
    next: () => Promise<any>;
}
interface FreshResponse {
    new (body?: any | undefined, init?: ResponseInit): any;
    json(data: unknown, init?: ResponseInit): any;
}
export {};
