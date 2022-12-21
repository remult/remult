import { itemChange, SubServer } from '../context';
import { Repository, FindOptions } from '../remult3';
interface StoredQuery {
    id: string;
    findOptionsJson: any;
    lastIds: any[];
    requestJson: any;
    entityKey: string;
}
export declare class LiveQueryStorageInMemoryImplementation implements LiveQueryStorage {
    debugFileSaver: (x: any) => void;
    debug(): void;
    keepAliveAndReturnUnknownIds(ids: string[]): Promise<string[]>;
    queries: (StoredQuery & {
        lastUsed: string;
    })[];
    constructor();
    store(query: StoredQuery): void;
    remove(id: any): void;
    provideListeners(entityKey: string, handle: (args: {
        query: StoredQuery;
        setLastIds(ids: any[]): Promise<void>;
    }) => Promise<void>): Promise<void>;
}
export declare type PerformWithRequest = (serializedRequest: any, entityKey: string, what: (repo: Repository<any>) => Promise<void>) => Promise<void>;
export declare class LiveQueryPublisher {
    subServer: () => SubServer;
    performWithRequest: PerformWithRequest;
    constructor(subServer: () => SubServer, performWithRequest: PerformWithRequest);
    stopLiveQuery(id: any): void;
    sendChannelMessage<messageType>(channel: string, message: messageType): void;
    defineLiveQueryChannel(serializeRequest: () => any, entityKey: string, findOptions: FindOptions<any>, ids: any[], userId: string, repo: Repository<any>): string;
    runPromise(p: Promise<any>): void;
    debugFileSaver: (x: any) => void;
    itemChanged(entityKey: string, changes: itemChange[]): void;
}
export interface MessagePublisher {
    sendChannelMessage<T>(channel: string, message: T): void;
}
export interface LiveQueryStorage {
    keepAliveAndReturnUnknownIds(ids: string[]): Promise<string[]>;
    store(query: StoredQuery): void;
    remove(id: any): void;
    provideListeners(entityKey: string, handle: (args: {
        query: StoredQuery;
        setLastIds(ids: any[]): Promise<void>;
    }) => Promise<void>): Promise<void>;
}
export {};
