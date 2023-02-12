import { DataProvider } from "../src/data-interfaces";
import { LiveQueryStorage, StoredQuery } from "../src/live-query/SubscriptionServer";
import { Repository } from "../src/remult3";
export declare class DataProviderLiveQueryStorage implements LiveQueryStorage {
    repo: Promise<Repository<LiveQueryStorageEntity>>;
    constructor(dataProvider: DataProvider | Promise<DataProvider> | (() => Promise<DataProvider | undefined>));
    add({ id, entityKey, data }: StoredQuery): void;
    remove(queryId: string): void;
    forEach(entityKey: string, callback: (args: {
        query: StoredQuery;
        setData(data: any): Promise<void>;
    }) => Promise<void>): Promise<void>;
    keepAliveAndReturnUnknownQueryIds(queryIds: string[]): Promise<string[]>;
}
declare class LiveQueryStorageEntity {
    id: string;
    entityKey: string;
    data: any;
    lastUsed: Date;
}
export {};
