import * as express from 'express';
import { buildRemultServer, RemultServerOptions } from './server/expressBridge';

export function remultExpress(options?:
    RemultServerOptions & {
        bodyParser?: boolean;
        bodySizeLimit?: string;
    }) {
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

    const server = buildRemultServer(app, options);
    return Object.assign(app, {
        getRemult: (req) => server.getRemult(req),
        openApiDoc: (options: { title: string }) => server.openApiDoc(options),
        addArea: x => server.addArea(x)
    });

}