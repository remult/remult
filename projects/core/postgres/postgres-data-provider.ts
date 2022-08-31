

import { Pool, PoolConfig, QueryResult } from 'pg';
import { Remult } from '../src/context.js';
import { PostgresSchemaBuilder, verifyStructureOfAllEntities } from './schema-builder.js';
import { EntityMetadata } from '../src/remult3/index.js';
import { SqlCommand, SqlImplementation, SqlResult } from '../src/sql-command.js';
import { SqlDatabase } from '../src/data-providers/sql-database.js';



export interface PostgresPool extends PostgresCommandSource {
    connect(): Promise<PostgresClient>;
}
export interface PostgresClient extends PostgresCommandSource {
    release(): void;
}

export class PostgresDataProvider implements SqlImplementation {
    async entityIsUsedForTheFirstTime(entity: EntityMetadata): Promise<void> {

    }
    getLimitSqlSyntax(limit: number, offset: number) {
        return ' limit ' + limit + ' offset ' + offset;
    }

    createCommand(): SqlCommand {
        return new PostgresBridgeToSQLCommand(this.pool);
    }
    constructor(private pool: PostgresPool) {
    }

    async transaction(action: (dataProvider: SqlImplementation) => Promise<void>) {
        let client = await this.pool.connect();

        try {
            await client.query('BEGIN');
            await action({
                createCommand: () => new PostgresBridgeToSQLCommand(client),
                entityIsUsedForTheFirstTime: this.entityIsUsedForTheFirstTime,
                transaction: () => { throw "nested transactions not allowed" },
                getLimitSqlSyntax: this.getLimitSqlSyntax
            });
            await client.query('COMMIT');
        }
        catch (err) {
            await client.query('ROLLBACK');
            throw err;
        }
        finally {
            await client.release();
        }
    }
}


export interface PostgresCommandSource {
    query(queryText: string, values?: any[]): Promise<QueryResult>;
}

class PostgresBridgeToSQLCommand implements SqlCommand {
    constructor(private source: PostgresCommandSource) {

    }
    values: any[] = [];
    addParameterAndReturnSqlToken(val: any): string {
        this.values.push(val);
        return '$' + this.values.length;
    }
    execute(sql: string): Promise<SqlResult> {
        return this.source.query(sql, this.values).then(r => new PostgresBridgeToSQLQueryResult(r));
    }
}
class PostgresBridgeToSQLQueryResult implements SqlResult {
    getColumnKeyInResultForIndexInSelect(index: number): string {
        return this.r.fields[index].name;
    }

    constructor(public r: QueryResult) {
        this.rows = r.rows;
    }
    rows: any[];

}



export async function createPostgresConnection(options?: {
    connectionString?: string,
    sslInDev?: boolean,
    configuration?: "heroku" | PoolConfig,
    autoCreateTables?: boolean
}) {
    if (!options)
        options = {};
    let config: PoolConfig = {};
    if (options.configuration)
        if (options.configuration == "heroku") {
            config = {
                connectionString: process.env.DATABASE_URL,
                ssl: process.env.NODE_ENV !== "production" && !options.sslInDev ? false : {
                    rejectUnauthorized: false
                }
            }
        } else
            config = options.configuration;
    else {
        if (!options.connectionString)
            options.connectionString = process.env.DATABASE_URL;
    }
    if (!config.connectionString && options.connectionString) {
        config.connectionString = options.connectionString;
    }


    const db = new SqlDatabase(new PostgresDataProvider(new Pool(config)));
    let remult = new Remult();
    remult.dataProvider = (db);
    if (options.autoCreateTables === undefined || options.autoCreateTables)
        await verifyStructureOfAllEntities(db, remult);
    return db;

}

export async function preparePostgresQueueStorage(sql: SqlDatabase) {

    let c = new Remult();
    c.dataProvider = (sql);
    let JobsInQueueEntity = (await import('../server/expressBridge')).JobsInQueueEntity
    let e = c.repo(JobsInQueueEntity);
    await new PostgresSchemaBuilder(sql).createIfNotExist(e.metadata);
    await new PostgresSchemaBuilder(sql).verifyAllColumns(e.metadata);

    return new (await import('../server/expressBridge')).EntityQueueStorage(c.repo(JobsInQueueEntity));


}