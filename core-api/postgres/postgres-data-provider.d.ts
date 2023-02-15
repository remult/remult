import { ClientBase, PoolConfig, QueryResult } from 'pg';
import { Remult } from '../src/context';
import { EntityMetadata } from '../src/remult3';
import { SqlCommand, SqlImplementation } from '../src/sql-command';
import { SqlDatabase } from '../src/data-providers/sql-database';
export interface PostgresPool extends PostgresCommandSource {
    connect(): Promise<PostgresClient>;
}
export interface PostgresClient extends PostgresCommandSource {
    release(): void;
}
export declare class PostgresDataProvider implements SqlImplementation {
    private pool;
    static getDb(remult?: Remult): ClientBase;
    entityIsUsedForTheFirstTime(entity: EntityMetadata): Promise<void>;
    getLimitSqlSyntax(limit: number, offset: number): string;
    createCommand(): SqlCommand;
    constructor(pool: PostgresPool);
    ensureSchema(entities: EntityMetadata<any>[], caption?: string): Promise<void>;
    transaction(action: (dataProvider: SqlImplementation) => Promise<void>): Promise<void>;
}
export interface PostgresCommandSource {
    query(queryText: string, values?: any[]): Promise<QueryResult>;
}
export declare function createPostgresConnection(options?: {
    connectionString?: string;
    sslInDev?: boolean;
    configuration?: "heroku" | PoolConfig;
}): Promise<SqlDatabase>;
export declare function preparePostgresQueueStorage(sql: SqlDatabase): Promise<import("../server/expressBridge").EntityQueueStorage>;
