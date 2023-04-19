import { } from "./server/core";
import { RemultServerOptions, RemultServer, createRemultServerCore, GenericRequest } from "./server/expressBridge";
import { Remult } from "./src/context";

export function remultFresh(options: RemultServerOptions<FreshRequest>, response: FreshResponse): RemultFresh {
    const server = createRemultServerCore<FreshRequest>(options, {
        buildGenericRequest: r => r
    });
    return {
        getRemult: r => server.getRemult(r),
        openApiDoc: x => server.openApiDoc(x),
        handle: async (req: FreshRequest, ctx: FreshContext) => {
            const theReq = {
                method: req.method,
                url: req.url,
                body: undefined
            };

            switch (req.method.toLocaleLowerCase()) {
                case "put":
                case "post":
                    theReq.body = await req.json();
                    break;
            }
            let init: ResponseInit = {};
            const res = await server.handle(req);
            if (res) {
                init.status = res.statusCode;
                if (res.data) {
                    return response.json(res.data, init);
                }
                else
                    return new response(undefined, init);
            }
            else {
                return ctx.next();
            };
        }
    }
};

export interface RemultFresh {
    getRemult(req: FreshRequest): Promise<Remult>;
    openApiDoc(options: { title: string }): any;
    handle(req: FreshRequest, ctx: FreshContext): Promise<any>
}
export interface FreshRequest {
    url: string,
    method: string,
    json: () => Promise<any>
}
export interface FreshContext {
    next: () => Promise<any>,
}
export interface FreshResponse {
    new(body?: any | undefined, init?: ResponseInit): any;
    json(data: unknown, init?: ResponseInit): any;
};

