import { PoolConfig, QueryResult } from 'pg';
import { EntityMetadata } from '../src/remult3/index.js';
import { SqlCommand, SqlImplementation } from '../src/sql-command.js';
import { SqlDatabase } from '../src/data-providers/sql-database.js';
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
export declare function createPostgresConnection(options?: {
    connectionString?: string;
    sslInDev?: boolean;
    configuration?: "heroku" | PoolConfig;
    autoCreateTables?: boolean;
}): Promise<SqlDatabase>;
export declare function preparePostgresQueueStorage(sql: SqlDatabase): Promise<import("../server/expressBridge.js").EntityQueueStorage>;
