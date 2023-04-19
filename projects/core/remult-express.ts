import * as express from 'express';

import { createRemultServer } from './server/index';
import { RemultServer, RemultServerImplementation, RemultServerOptions } from './server/expressBridge';

export function remultExpress(options?:
    RemultServerOptions<express.Request> & {
        bodyParser?: boolean;
        bodySizeLimit?: string;



    }): express.RequestHandler & RemultServer<express.Request> {
    let app = express.Router();

    if (!options) {
        options = {};
    }
    if (options.bodySizeLimit === undefined) {
        options.bodySizeLimit = '10mb';
    }
    if (options?.bodyParser !== false) {
        app.use(express.json({ limit: options.bodySizeLimit }));
        app.use(express.urlencoded({ extended: true, limit: options.bodySizeLimit }));
    }
    const server = createRemultServer<express.Request>(options, {
        buildGenericRequest: req => req
    }) as RemultServerImplementation<express.Request>;
    server.registerRouter(app);

    return Object.assign(app, {
        getRemult: (req) => server.getRemult(req),
        openApiDoc: (options: { title: string }) => server.openApiDoc(options),
        registerRouter: x => server.registerRouter(x),
        withRemult: (...args) => server.withRemult(...args)
    } as RemultServer<express.Request>);

}
