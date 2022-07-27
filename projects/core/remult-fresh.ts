import { } from "./server";
import { RemultServerOptions, RemultServer, buildRemultServer } from "./server/expressBridge";

export function remultFresh(options: RemultServerOptions, response: FreshResponse): RemultFresh {
    const server = buildRemultServer(options);
    const orig = server.handle;
    return Object.assign(
        server, {
        freshHandler: async (req: FreshRequest, ctx: FreshContext) => {
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
            const res = await orig(theReq);
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
    })
};





export interface RemultFresh extends RemultServer {
    freshHandler(req: FreshRequest, ctx: FreshContext): Promise<FreshResponse>
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

