import { Remult } from '../..';
import { Repository, EntityRef, FindOptions } from '../remult3';
import { LiveQueryProvider } from '../data-api';
import { ChannelSubscribe, liveQueryMessage } from './LiveQuerySubscriber';
export declare class LiveQueryPublisher implements LiveQueryProvider {
    private dispatcher;
    unsubscribe(data: ChannelSubscribe): void;
    constructor(dispatcher: ServerEventDispatcher);
    subscribe(repo: Repository<any>, clientId: string, findOptions: FindOptions<any>, remult: Remult, ids: any[]): string;
    clients: clientInfo[];
    runPromise(p: Promise<any>): void;
    saved(ref: EntityRef<any>): void;
    deleted(ref: EntityRef<any>): void;
}
export interface clientInfo {
    clientId: string;
    queries: ({
        id: string;
        repo: Repository<any>;
        findOptions: FindOptions<any>;
        ids: any[];
    })[];
}
export interface ServerEventDispatcher {
    sendQueryMessage(message: ServerEventMessage): void;
    sendChannelMessage<T>(channel: string, message: any): void;
}
export interface ServerEventMessage {
    clientId: string;
    queryId: string;
    message: liveQueryMessage;
}
