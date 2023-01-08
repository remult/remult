import type { MongoClient, Db } from 'mongodb';
import { DataProvider, EntityDataProvider, EntityFilter, EntityMetadata, Remult } from '.';
import { RepositoryOverloads } from './src/remult3';
export declare class MongoDataProvider implements DataProvider {
    private db;
    private client;
    constructor(db: Db, client: MongoClient);
    static getDb(remult?: Remult): Db;
    getEntityDataProvider(entity: EntityMetadata<any>): EntityDataProvider;
    transaction(action: (dataProvider: DataProvider) => Promise<void>): Promise<void>;
    static filterToRaw<entityType>(entity: RepositoryOverloads<entityType>, condition: EntityFilter<entityType>): Promise<{
        $and: any[];
    } | {
        $and?: undefined;
    }>;
}
