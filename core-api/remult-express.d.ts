import * as express from 'express';
import { RemultServer, RemultServerOptions } from './server/expressBridge';
export declare function remultExpress(options?: RemultServerOptions & {
    bodyParser?: boolean;
    bodySizeLimit?: string;
}): express.RequestHandler & RemultServer;
