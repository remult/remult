import type { ClientSession, Db, MongoClient } from 'mongodb';
import type { DataProvider, EntityDataProvider, EntityFilter, EntityMetadata, Remult } from '.';
import type { RepositoryOverloads } from './src/remult3/RepositoryImplementation';
export declare class MongoDataProvider implements DataProvider {
    private db;
    private client;
    constructor(db: Db, client: MongoClient | undefined, options?: {
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
