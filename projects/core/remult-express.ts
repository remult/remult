import * as express from 'express';
import { remultMiddlewareBase, RemultMiddlewareOptions } from './server/expressBridge';

export function remultExpress(options?:
    RemultMiddlewareOptions & {
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
    
    return remultMiddlewareBase(app, options);

}