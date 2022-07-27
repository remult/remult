import { RemultServerOptions, RemultServer } from "./server/expressBridge";
export declare function remultFresh(options: RemultServerOptions, response: FreshResponse): RemultFresh;
export interface RemultFresh extends RemultServer {
    freshHandler(req: FreshRequest, ctx: FreshContext): Promise<FreshResponse>;
}
export interface FreshRequest {
    url: string;
    method: string;
    json: () => Promise<any>;
}
export interface FreshContext {
    next: () => Promise<any>;
}
export interface FreshResponse {
    new (body?: any | undefined, init?: ResponseInit): any;
    json(data: unknown, init?: ResponseInit): any;
}
