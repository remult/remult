import { DataProvider, EntityDataProvider, Entity, SqlDatabase, SqlCommand, SqlResult, SqlImplementation, EntityMetadata, FieldMetadata } from '../';

import { Pool, QueryResult } from 'pg';

import { connect } from 'net';
import { allEntities, Context } from '../src/context';


import { isDbReadonly } from '../src/data-providers/sql-database';
import { postgresColumnSyntax } from './postgresColumnSyntax';


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
    async insertAndReturnAutoIncrementId(command: SqlCommand, insertStatementString: string, entity: EntityMetadata) {
        let r = await command.execute(insertStatementString);

        r = await this.createCommand().execute("SELECT currval(pg_get_serial_sequence('" + await entity.getDbName() + "','" + await entity.idMetadata.field.getDbName() + "'));");
        return +r.rows[0].currval;
    }
    async transaction(action: (dataProvider: SqlImplementation) => Promise<void>) {
        let client = await this.pool.connect();

        try {
            await client.query('BEGIN');
            await action({
                createCommand: () => new PostgresBridgeToSQLCommand(client),
                entityIsUsedForTheFirstTime: this.entityIsUsedForTheFirstTime,
                transaction: () => { throw "nested transactions not allowed" },
                insertAndReturnAutoIncrementId: this.insertAndReturnAutoIncrementId,
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

export async function verifyStructureOfAllEntities(db: SqlDatabase) {
    return await new PostgresSchemaBuilder(db).verifyStructureOfAllEntities();
}

export class PostgresSchemaBuilder {
    async verifyStructureOfAllEntities() {
        console.log("start verify structure");
        let context = new Context();
        for (const entity of allEntities) {
            let metadata = context.for(entity).metadata;

            try {

                if ((await metadata.getDbName()).toLowerCase().indexOf('from ') < 0) {
                    await this.createIfNotExist(metadata);
                    await this.verifyAllColumns(metadata);
                }
            }
            catch (err) {
                console.log("failed verify structore of " + await metadata.getDbName() + " ", err);
            }
        }
    }
    async createIfNotExist(e: EntityMetadata): Promise<void> {
        var c = this.pool.createCommand();

        await c.execute("select 1 from information_Schema.tables where table_name=" + c.addParameterAndReturnSqlToken((await e.getDbName()).toLowerCase()) + this.additionalWhere).then(async r => {

            if (r.rows.length == 0) {
                let result = '';
                for (const x of e.fields) {
                    if (!await isDbReadonly(x)) {
                        if (result.length != 0)
                            result += ',';
                        result += '\r\n  ';

                        if (x == e.idMetadata.field && e.options.dbAutoIncrementId)
                            result += await x.getDbName() + ' serial';
                        else {
                            result += postgresColumnSyntax(x, await x.getDbName());
                            if (x == e.idMetadata.field)
                                result += ' primary key';
                        }
                    }
                }

                let sql = 'create table ' + await e.getDbName() + ' (' + result + '\r\n)';
                console.log(sql);
                await this.pool.execute(sql);
            }
        });
    }
  

    async addColumnIfNotExist<T extends EntityMetadata>(e: T, c: ((e: T) => FieldMetadata)) {
        if (await isDbReadonly(c(e)))
            return;
        try {
            let cmd = this.pool.createCommand();

            if (
                (await cmd.execute(`select 1   
        FROM information_schema.columns 
        WHERE table_name=${cmd.addParameterAndReturnSqlToken((await e.getDbName()).toLocaleLowerCase())} and column_name=${cmd.addParameterAndReturnSqlToken((await c(e).getDbName()).toLocaleLowerCase())}` + this.additionalWhere
                )).rows.length == 0) {
                let sql = `alter table ${await e.getDbName()} add column ${postgresColumnSyntax(c(e), await c(e).getDbName())}`;
                console.log(sql);
                await this.pool.execute(sql);
            }
        }
        catch (err) {
            console.log(err);
        }
    }
    async verifyAllColumns<T extends EntityMetadata>(e: T) {
        try {
            let cmd = this.pool.createCommand();


            let cols = (await cmd.execute(`select column_name   
        FROM information_schema.columns 
        WHERE table_name=${cmd.addParameterAndReturnSqlToken((await e.getDbName()).toLocaleLowerCase())} ` + this.additionalWhere
            )).rows.map(x => x.column_name);
            for (const col of e.fields) {
                if (!await isDbReadonly(col))
                    if (!cols.includes((await col.getDbName()).toLocaleLowerCase())) {
                        let sql = `alter table ${await e.getDbName()} add column ${postgresColumnSyntax(col, await col.getDbName())}`;
                        console.log(sql);
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

    let c = new Context();
    c.setDataProvider(sql);
    let JobsInQueueEntity = (await import('../server/expressBridge')).JobsInQueueEntity
    let e = c.for(JobsInQueueEntity);
    await new PostgresSchemaBuilder(sql).createIfNotExist(e.metadata);
    await new PostgresSchemaBuilder(sql).verifyAllColumns(e.metadata);

    return new (await import('../server/expressBridge')).EntityQueueStorage(c.for(JobsInQueueEntity));

}
