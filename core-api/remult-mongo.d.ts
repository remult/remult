import { MongoClient, Db } from 'mongodb';
import { DataProvider, EntityDataProvider, EntityMetadata, Remult } from '.';
export declare class MongoDataProvider implements DataProvider {
    private db;
    private client;
    constructor(db: Db, client: MongoClient);
    static getRawDb(remult: Remult): Db;
    getEntityDataProvider(entity: EntityMetadata<any>): EntityDataProvider;
    transaction(action: (dataProvider: DataProvider) => Promise<void>): Promise<void>;
}
