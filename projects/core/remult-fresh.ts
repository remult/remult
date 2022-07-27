import { remultServer } from "./remult-middleware";
import { RemultServerOptions, RemultServer } from "./server/expressBridge";

export function remultFresh(options: RemultServerOptions, response: FreshResponse): RemultFresh {
    const server = remultServer(options);
    const orig = server.handle;
    return {
        ...server, ...{
            handle: async (req: FreshRequest, ctx: FreshContext) => {
                const theReq = {
                    method: req.method,
                    url: req.url,
                    body: undefined

                };

                switch (req.method.toLocaleLowerCase()) {
                    case "put":
                    case "post":
                        console.log(req);
                        theReq.body = await req.json();
                        break;
                }
                let init: ResponseInit = {};
                const res = await orig(theReq);
                if (res) {
                    if (res.statusCode)
                        init.status = res.statusCode;
                    if (res.data) {
                        console.log({ init, res });
                        return response.json(res.data, init);
                    }
                    else
                        return new response(undefined, init);
                }
                else return ctx.next();
            }
        }
    };
}




export interface RemultFresh extends RemultServer {
    handle(req: FreshRequest, ctx: FreshContext): Promise<FreshResponse>
}
interface FreshRequest {
    url: string,
    method: string,
    json: () => Promise<any>
}
interface FreshContext {
    next: () => Promise<any>
}
interface FreshResponse {
    new(body?: any | undefined, init?: ResponseInit): any;
    json(data: unknown, init?: ResponseInit): any;
};

