import { Remult } from "../src/context";
import { CanEnsureSchema, DataProvider } from "../src/data-interfaces";
import { LiveQueryStorage, StoredQuery } from "../src/live-query/SubscriptionServer";
import { EntityBase, Repository } from "../src/remult3";
export declare class DataProviderLiveQueryStorage implements LiveQueryStorage, CanEnsureSchema {
    repo: Promise<Repository<LiveQueryStorageEntity>>;
    dataProvider: Promise<DataProvider>;
    constructor(dataProvider: DataProvider | Promise<DataProvider> | (() => Promise<DataProvider | undefined>));
    ensureSchema(remult: Remult): Promise<void>;
    add({ id, entityKey, data }: StoredQuery): Promise<void>;
    remove(queryId: string): Promise<void>;
    forEach(entityKey: string, callback: (args: {
        query: StoredQuery;
        setData(data: any): Promise<void>;
    }) => Promise<void>): Promise<void>;
    keepAliveAndReturnUnknownQueryIds(queryIds: string[]): Promise<string[]>;
}
declare class LiveQueryStorageEntity extends EntityBase {
    id: string;
    entityKey: string;
    data: any;
    lastUsedIso: string;
}
export {};
