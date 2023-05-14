/// <reference types="node" />
import { GenericResponse } from './server/index';
import { Remult } from './src/context';
import { SubscriptionServer } from './src/live-query/SubscriptionServer';
export declare class SseSubscriptionServer implements SubscriptionServer {
    private canUserConnectToChannel?;
    constructor(canUserConnectToChannel?: (channel: string, remult: Remult) => boolean);
    publishMessage<T>(channel: string, message: any): Promise<void>;
}
export interface ResponseRequiredForSSE {
    write(data: string): void;
    writeHead(status: number, headers: any): void;
    flush?(): void;
}
export declare class clientConnection {
    response: GenericResponse & ResponseRequiredForSSE;
    channels: Record<string, boolean>;
    timeOutRef: NodeJS.Timeout;
    close(): void;
    closed: boolean;
    write(eventData: string, eventType?: string): void;
    connectionId: any;
    constructor(response: GenericResponse & ResponseRequiredForSSE);
    sendLiveMessage(): void;
}
