import { PoolConfig, QueryResult } from 'pg';
import { Remult } from '../src/context';
import { EntityMetadata } from '../src/remult3';
import { SqlCommand, SqlImplementation } from '../src/sql-command';
import { SqlDatabase } from '../src/data-providers/sql-database';
import { FieldMetadata } from '../src/column-interfaces';
export interface PostgresPool extends PostgresCommandSource {
    connect(): Promise<PostgresClient>;
}
export interface PostgresClient extends PostgresCommandSource {
    release(): void;
}
export declare class PostgresDataProvider implements SqlImplementation {
    private pool;
    entityIsUsedForTheFirstTime(entity: EntityMetadata): Promise<void>;
    getLimitSqlSyntax(limit: number, offset: number): string;
    createCommand(): SqlCommand;
    constructor(pool: PostgresPool);
    transaction(action: (dataProvider: SqlImplementation) => Promise<void>): Promise<void>;
}
export interface PostgresCommandSource {
    query(queryText: string, values?: any[]): Promise<QueryResult>;
}
export declare function verifyStructureOfAllEntities(db: SqlDatabase, remult: Remult): Promise<void>;
export declare class PostgresSchemaBuilder {
    private pool;
    verifyStructureOfAllEntities(remult: Remult): Promise<void>;
    createIfNotExist(entity: EntityMetadata): Promise<void>;
    addColumnIfNotExist<T extends EntityMetadata>(entity: T, c: ((e: T) => FieldMetadata)): Promise<void>;
    verifyAllColumns<T extends EntityMetadata>(entity: T): Promise<void>;
    additionalWhere: string;
    constructor(pool: SqlDatabase, schema?: string);
}
export declare function preparePostgresQueueStorage(sql: SqlDatabase): Promise<import("../server/expressBridge").EntityQueueStorage>;
export declare function createPostgresConnection(options?: {
    connectionString?: string;
    sslInDev?: boolean;
    configuration?: "heroku" | PoolConfig;
    autoCreateTables?: boolean;
}): Promise<SqlDatabase>;
