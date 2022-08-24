import { Repository, EntityRef, FindOptions } from '../remult3';
import { LiveQueryProvider } from '../data-api';
import { liveQueryMessage } from './LiveQuery';
export declare class LiveQueryManager implements LiveQueryProvider {
    private dispatcher;
    constructor(dispatcher: ServerEventDispatcher);
    subscribe(repo: Repository<any>, clientId: string, findOptions: FindOptions<any>): string;
    clients: clientInfo[];
    sendMessage(key: string, message: liveQueryMessage): void;
    hasListeners(ref: EntityRef<any>): boolean;
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
    })[];
}
export interface ServerEventDispatcher {
    send(message: ServerEventMessage): void;
}
export interface ServerEventMessage {
    clientId: string;
    queryId: string;
    message: liveQueryMessage;
}
