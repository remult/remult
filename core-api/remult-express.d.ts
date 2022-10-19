import * as express from 'express';
import { RemultServer, RemultServerOptions } from './server/expressBridge';
import { ServerEventDispatcher, ServerEventMessage } from './src/live-query/LiveQueryManager';
export declare function remultExpress(options?: RemultServerOptions<express.Request> & {
    bodyParser?: boolean;
    bodySizeLimit?: string;
}): express.RequestHandler & RemultServer & {
    sec: ServerEventsController;
};
export declare class ServerEventsController implements ServerEventDispatcher {
    private messageHistoryLength;
    connections: clientConnection[];
    constructor(messageHistoryLength?: number);
    send({ message, clientId, queryId }: ServerEventMessage): void;
    subscribe(req: import('express').Request, res: import('express').Response): clientConnection;
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
    close(): void;
    closed: boolean;
    write(id: number, message: any, eventType: string): void;
    constructor(response: import('express').Response, clientId: string);
    sendLiveMessage(): void;
}
export {};
