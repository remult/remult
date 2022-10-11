import * as express from 'express';
import { RemultServer, RemultServerOptions } from './server/expressBridge';
export declare function remultExpress(options?: RemultServerOptions<express.Request> & {
    bodyParser?: boolean;
    bodySizeLimit?: string;
}): express.RequestHandler & RemultServer;
