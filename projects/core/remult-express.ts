import * as express from 'express';
import { buildRemultServer, RemultServer, RemultServerOptions } from './server/expressBridge';

export function remultExpress(options?:
    RemultServerOptions & {
        bodyParser?: boolean;
        bodySizeLimit?: string;
    }): express.RequestHandler & RemultServer {
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

    const server = buildRemultServer(options);
    server.registerRouter(app);
    return Object.assign(app, {
        getRemult: (req) => server.getRemult(req),
        openApiDoc: (options: { title: string }) => server.openApiDoc(options),
        registerRouter: x => server.registerRouter(x)
    } as RemultServer);

}