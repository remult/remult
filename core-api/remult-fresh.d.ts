import { RemultServerOptions } from "./server/expressBridge";
import { Remult } from "./src/context";
export declare function remultFresh(options: RemultServerOptions<FreshRequest>, response: FreshResponse): RemultFresh;
export interface RemultFresh {
    getRemult(req: FreshRequest): Promise<Remult>;
    openApiDoc(options: {
        title: string;
    }): any;
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
