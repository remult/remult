import * as express from 'express';
import { RemultServer, RemultServerOptions } from './server/expressBridge';
import { Remult } from './src/context';
import { AMessageChannel, ChannelSubscribe } from './src/live-query/LiveQuery';
import { ServerEventDispatcher, ServerEventMessage } from './src/live-query/LiveQueryManager';
export declare function remultExpress(options?: RemultServerOptions<express.Request> & {
    bodyParser?: boolean;
    bodySizeLimit?: string;
    messageChannels?: AMessageChannel<any>[];
}): express.RequestHandler & RemultServer;
export declare class ServerEventsController implements ServerEventDispatcher {
    private channels;
    private messageHistoryLength;
    consoleInfo(): void;
    subscribeToChannel(remult: Remult, info: ChannelSubscribe, res: import('express').Response): void;
    connections: clientConnection[];
    constructor(channels: AMessageChannel<any>[], messageHistoryLength?: number);
    sendQueryMessage({ message, clientId, queryId }: ServerEventMessage): void;
    sendChannelMessage<T>(channel: string, message: any): void;
    openHttpServerStream(req: import('express').Request, res: import('express').Response): clientConnection;
    messages: {
        id: number;
        message: any;
        eventType: string;
    }[];
    SendMessage(message: any, eventType?: string): void;
}
declare class clientConnection {
    response: import('express').Response;
    clientId: string;
    channels: Record<string, boolean>;
    close(): void;
    closed: boolean;
    write(id: number, message: any, eventType: string): void;
    constructor(response: import('express').Response, clientId: string);
    sendLiveMessage(): void;
}
export {};
