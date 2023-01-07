import * as express from 'express';
import { RemultServer, RemultServerOptions } from './server/expressBridge';
import { Remult } from './src/context';
import { SubscriptionServer } from './src/live-query/SubscriptionServer';
export declare function remultExpress(options?: RemultServerOptions<express.Request> & {
    bodyParser?: boolean;
    bodySizeLimit?: string;
}): express.RequestHandler & RemultServer;
export declare class SseSubscriptionServer implements SubscriptionServer {
    private canUserConnectToChannel?;
    constructor(canUserConnectToChannel?: (channel: string, remult: Remult) => boolean);
    publishMessage<T>(channel: string, message: any): void;
    registerRoutes(router: express.Router, apiPath: string, server: RemultServer): void;
}
