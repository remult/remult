export interface SubscriptionServer {
    publishMessage<T>(channel: string, message: T): Promise<void>;
}
export interface LiveQueryStorage {
    add(query: StoredQuery): Promise<void>;
    remove(queryId: string): Promise<void>;
    forEach(entityKey: string, callback: (args: {
        query: StoredQuery;
        setData(data: any): Promise<void>;
    }) => Promise<void>): Promise<void>;
    keepAliveAndReturnUnknownQueryIds(queryIds: string[]): Promise<string[]>;
}
export declare class InMemoryLiveQueryStorage implements LiveQueryStorage {
    debugFileSaver: (x: any) => void;
    debug(): void;
    keepAliveAndReturnUnknownQueryIds(ids: string[]): Promise<string[]>;
    queries: (StoredQuery & {
        lastUsed: string;
    })[];
    constructor();
    add(query: StoredQuery): Promise<void>;
    removeCountForTesting: number;
    remove(id: any): Promise<void>;
    forEach(entityKey: string, handle: (args: {
        query: StoredQuery;
        setData(data: any): Promise<void>;
    }) => Promise<void>): Promise<void>;
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
