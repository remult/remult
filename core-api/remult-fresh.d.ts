import { RemultServerOptions, GenericRequest } from "./server/expressBridge";
import { Remult } from "./src/context";
export declare function remultFresh<RequestType extends GenericRequest>(options: RemultServerOptions<RequestType>, response: FreshResponse): RemultFresh;
export interface RemultFresh {
    getRemult(req: GenericRequest): Promise<Remult>;
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
