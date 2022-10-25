import * as express from 'express';
import { RemultServer, RemultServerOptions } from './server/expressBridge';
import { AMessageChannel, ServerEventChannelSubscribeDTO } from './src/live-query/LiveQuerySubscriber';
import { ServerEventDispatcher } from './src/live-query/LiveQueryPublisher';
export declare function remultExpress(options?: RemultServerOptions<express.Request> & {
    bodyParser?: boolean;
    bodySizeLimit?: string;
    messageChannels?: AMessageChannel<any>[];
}): express.RequestHandler & RemultServer;
export declare class ServerEventsController implements ServerEventDispatcher {
    subscribeToChannel({ channel, remove, clientId }: ServerEventChannelSubscribeDTO): void;
    consoleInfo(): void;
    connections: clientConnection[];
    constructor(channels: AMessageChannel<any>[]);
    sendChannelMessage<T>(channel: string, message: any): void;
    openHttpServerStream(req: import('express').Request, res: import('express').Response): clientConnection;
}
declare class clientConnection {
    response: import('express').Response;
    channels: Record<string, boolean>;
    close(): void;
    closed: boolean;
    write(eventData: string, eventType?: string): void;
    connectionId: any;
    constructor(response: import('express').Response);
    sendLiveMessage(): void;
}
export {};
