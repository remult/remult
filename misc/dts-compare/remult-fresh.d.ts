import { RemultServerOptions, RemultServerCore } from './server/expressBridge';
export declare function remultFresh(options: RemultServerOptions<FreshRequest>, response: FreshResponse): RemultFresh;
export interface RemultFresh extends RemultServerCore<FreshRequest> {
    handle(req: FreshRequest, ctx: FreshContext): Promise<any>;
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
