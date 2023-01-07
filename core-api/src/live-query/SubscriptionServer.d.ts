export declare class InMemoryLiveQueryStorage implements LiveQueryStorage {
    debugFileSaver: (x: any) => void;
    debug(): void;
    keepAliveAndReturnUnknownQueryIds(ids: string[]): Promise<string[]>;
    queries: (StoredQuery & {
        lastUsed: string;
    })[];
    constructor();
    add(query: StoredQuery): void;
    remove(id: any): void;
    forEach(entityKey: string, handle: (args: {
        query: StoredQuery;
        setData(data: any): Promise<void>;
    }) => Promise<void>): Promise<void>;
}
export interface SubscriptionServer {
    publishMessage<T>(channel: string, message: T): void;
}
export interface LiveQueryStorage {
    add(query: StoredQuery): void;
    remove(queryId: any): void;
    forEach(entityKey: string, callback: (args: {
        query: StoredQuery;
        setData(data: any): Promise<void>;
    }) => Promise<void>): Promise<void>;
    keepAliveAndReturnUnknownQueryIds(queryIds: string[]): Promise<string[]>;
}
export interface StoredQuery {
    entityKey: string;
    id: string;
    data: any;
}
export interface QueryData {
    findOptionsJson: any;
    requestJson: any;
    lastIds: any[];
}
