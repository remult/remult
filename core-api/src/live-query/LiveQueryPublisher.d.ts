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
interface StoredQuery {
    id: string;
    findOptionsJson: any;
    lastIds: any[];
    requestJson: any;
    entityKey: string;
}
export {};
