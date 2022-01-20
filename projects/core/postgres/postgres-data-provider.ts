import { SqlDatabase, SqlCommand, SqlResult, SqlImplementation, EntityMetadata, FieldMetadata } from '../';

import { Pool, PoolConfig, QueryResult } from 'pg';

import { allEntities, Remult } from '../src/context';


import { postgresColumnSyntax } from './postgresColumnSyntax';
import { getDbNameProvider } from '../src/filter/filter-consumer-bridge-to-sql-request';


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

export async function verifyStructureOfAllEntities(db: SqlDatabase, remult: Remult) {
    return await new PostgresSchemaBuilder(db).verifyStructureOfAllEntities(remult);
}

export class PostgresSchemaBuilder {
    async verifyStructureOfAllEntities(remult: Remult) {
        console.log("start verify structure");
        for (const entityClass of allEntities) {
            let entity = remult.repo(entityClass).metadata;
            let e = await getDbNameProvider(entity);
            try {
                if (!entity.options.sqlExpression) {
                    if ((await e.entityName).toLowerCase().indexOf('from ') < 0) {
                        await this.createIfNotExist(entity);
                        await this.verifyAllColumns(entity);
                    }
                }
            }
            catch (err) {
                console.log("failed verify structore of " + e.entityName + " ", err);
            }
        }
    }
    async createIfNotExist(entity: EntityMetadata): Promise<void> {
        var c = this.pool.createCommand();
        let e = await getDbNameProvider(entity);

        await c.execute("select 1 from information_Schema.tables where table_name=" + c.addParameterAndReturnSqlToken((e.entityName).toLowerCase()) + this.additionalWhere).then(async r => {

            if (r.rows.length == 0) {
                let result = '';
                for (const x of entity.fields) {
                    if (!e.isDbReadonly(x) || x == entity.idMetadata.field && entity.options.dbAutoIncrementId) {
                        if (result.length != 0)
                            result += ',';
                        result += '\r\n  ';

                        if (x == entity.idMetadata.field && entity.options.dbAutoIncrementId)
                            result += e.nameOf(x) + ' serial';
                        else {
                            result += postgresColumnSyntax(x, e.nameOf(x));
                            if (x == entity.idMetadata.field)
                                result += ' primary key';
                        }
                    }
                }

                let sql = 'create table ' + e.entityName + ' (' + result + '\r\n)';
                //console.log(sql);
                await this.pool.execute(sql);
            }
        });
    }


    async addColumnIfNotExist<T extends EntityMetadata>(entity: T, c: ((e: T) => FieldMetadata)) {
        let e = await getDbNameProvider(entity);
        if (e.isDbReadonly(c(entity)))
            return;
        try {
            let cmd = this.pool.createCommand();

            const colName = e.nameOf(c(entity));
            if (
                (await cmd.execute(`select 1   
        FROM information_schema.columns 
        WHERE table_name=${cmd.addParameterAndReturnSqlToken((e.entityName).toLocaleLowerCase())} and column_name=${cmd.addParameterAndReturnSqlToken((colName).toLocaleLowerCase())}` + this.additionalWhere
                )).rows.length == 0) {
                let sql = `alter table ${e.entityName} add column ${postgresColumnSyntax(c(entity), colName)}`;
                //console.log(sql);
                await this.pool.execute(sql);
            }
        }
        catch (err) {
            console.log(err);
        }
    }
    async verifyAllColumns<T extends EntityMetadata>(entity: T) {
        try {
            let cmd = this.pool.createCommand();
            let e = await getDbNameProvider(entity);

            let cols = (await cmd.execute(`select column_name   
        FROM information_schema.columns 
        WHERE table_name=${cmd.addParameterAndReturnSqlToken((e.entityName).toLocaleLowerCase())} ` + this.additionalWhere
            )).rows.map(x => x.column_name);
            for (const col of entity.fields) {
                if (!e.isDbReadonly(col))
                    if (!cols.includes(e.nameOf(col).toLocaleLowerCase())) {
                        let sql = `alter table ${e.entityName} add column ${postgresColumnSyntax(col, e.nameOf(col))}`;
                        //console.log(sql);
                        await this.pool.execute(sql);
                    }
            }

        }
        catch (err) {
            console.log(err);
        }
    }
    additionalWhere = '';
    constructor(private pool: SqlDatabase, schema?: string) {
        if (schema) {
            this.additionalWhere = ' and table_schema=\'' + schema + '\'';
        }
    }
}

export async function preparePostgresQueueStorage(sql: SqlDatabase) {

    let c = new Remult();
    c.setDataProvider(sql);
    let JobsInQueueEntity = (await import('../server/expressBridge')).JobsInQueueEntity
    let e = c.repo(JobsInQueueEntity);
    await new PostgresSchemaBuilder(sql).createIfNotExist(e.metadata);
    await new PostgresSchemaBuilder(sql).verifyAllColumns(e.metadata);

    return new (await import('../server/expressBridge')).EntityQueueStorage(c.repo(JobsInQueueEntity));


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
    remult.setDataProvider(db);
    if (options.autoCreateTables === undefined || options.autoCreateTables)
        await verifyStructureOfAllEntities(db, remult);
    return db;

}