import type { DataProvider, Storage } from '../src/data-interfaces';
import type { LiveQueryStorage, StoredQuery } from '../src/live-query/SubscriptionServer';
import type { Repository } from '../src/remult3';
import { EntityBase } from '../src/remult3';
export declare class DataProviderLiveQueryStorage implements LiveQueryStorage, Storage {
    repo: Promise<Repository<LiveQueryStorageEntity>>;
    dataProvider: Promise<DataProvider>;
    constructor(dataProvider: DataProvider | Promise<DataProvider> | (() => Promise<DataProvider | undefined>));
    ensureSchema(): Promise<void>;
    add({ id, entityKey, data }: StoredQuery): Promise<void>;
    remove(queryId: string): Promise<void>;
    forEach(entityKey: string, callback: (args: {
        query: StoredQuery;
        setData(data: any): Promise<void>;
    }) => Promise<void>): Promise<void>;
    keepAliveAndReturnUnknownQueryIds(queryIds: string[]): Promise<string[]>;
}
export declare class LiveQueryStorageEntity extends EntityBase {
    id: string;
    entityKey: string;
    data: any;
    lastUsedIso: string;
}
