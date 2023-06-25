import type { MongoClient, Db, ClientSession } from 'mongodb';
import { DataProvider, EntityDataProvider, EntityFilter, EntityMetadata, Remult } from '.';
import { RepositoryOverloads } from './src/remult3';
export declare class MongoDataProvider implements DataProvider {
    private db;
    private client;
    constructor(db: Db, client: MongoClient, options?: {
        session?: ClientSession;
        disableTransactions?: boolean;
    });
    session?: ClientSession;
    disableTransactions: boolean;
    static getDb(remult?: Remult): {
        db: Db;
        session: ClientSession;
    };
    getEntityDataProvider(entity: EntityMetadata<any>): EntityDataProvider;
    transaction(action: (dataProvider: DataProvider) => Promise<void>): Promise<void>;
    static filterToRaw<entityType>(entity: RepositoryOverloads<entityType>, condition: EntityFilter<entityType>): Promise<{
        $and: any[];
    } | {
        $and?: undefined;
    }>;
}
