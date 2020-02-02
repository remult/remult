import { ServerContext, DataProvider, EntityDataProvider, Entity, Column, NumberColumn, DateTimeColumn, BoolColumn, DateColumn, SqlDatabase, SqlCommand, SqlResult, ValueListColumn, allEntities, SqlImplementation } from '@remult/core';

import { Pool, QueryResult } from 'pg';

import { connect } from 'net';


export interface PostgresPool extends PostgresCommandSource {
    connect(): Promise<PostgresClient>;
}
export interface PostgresClient extends PostgresCommandSource {
    release(): void;
}

export class PostgresDataProvider implements SqlImplementation {
    async entityIsUsedForTheFirstTime(entity: Entity<any>): Promise<void> {

    }
    createCommand(): SqlCommand {
        return new PostgrestBridgeToSQLCommand(this.pool);
    }
    constructor(private pool: PostgresPool) {
    }
    async transaction(action: (dataProvider: SqlImplementation) => Promise<void>) {
        let client = await this.pool.connect();

        try {
            await client.query('BEGIN');
            await action({
                createCommand: () => new PostgrestBridgeToSQLCommand(client),
                entityIsUsedForTheFirstTime: this.entityIsUsedForTheFirstTime,
                transaction: () => { throw "nested transactions not allowed" }
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

class PostgrestBridgeToSQLCommand implements SqlCommand {
    constructor(private source: PostgresCommandSource) {

    }
    values: any[] = [];
    addParameterAndReturnSqlToken(val: any): string {
        this.values.push(val);
        return '$' + this.values.length;
    }
    execute(sql: string): Promise<SqlResult> {
        return this.source.query(sql, this.values).then(r => new PostgressBridgeToSQLQueryResult(r));
    }
}
class PostgressBridgeToSQLQueryResult implements SqlResult {
    getColumnKeyInResultForIndexInSelect(index: number): string {
        return this.r.fields[index].name;
    }

    constructor(private r: QueryResult) {
        this.rows = r.rows;
    }
    rows: any[];

}



export class PostgresSchemaBuilder {
    async verifyStructureOfAllEntities() {
        console.log("start verify structure");
        let context = new ServerContext();
        for (const entity of allEntities) {
            let x = context.for(entity).create();
            try {

                if (x.defs.name.toLowerCase().indexOf('from ') < 0) {
                    await this.createIfNotExist(x);
                    await this.verifyAllColumns(x);
                }
            }
            catch (err) {
                console.log("failed verify structore of " + x.defs.dbName + " ", err);
            }
        }
    }
    async createIfNotExist(e: Entity<any>): Promise<void> {
        var c = this.pool.createCommand();
        await c.execute("select 1 from information_Schema.tables where table_name=" + c.addParameterAndReturnSqlToken(e.defs.dbName.toLowerCase()) + this.additionalWhere).then(async r => {

            if (r.rows.length == 0) {
                let result = '';
                for (const x of e.columns) {
                    if (!x.defs.dbReadOnly) {
                        if (result.length != 0)
                            result += ',';
                        result += '\r\n  ';
                        result += this.addColumnSqlSyntax(x);
                        if (x == e.columns.idColumn)
                            result += ' primary key';
                    }
                }

                let sql = 'create table ' + e.defs.dbName + ' (' + result + '\r\n)';
                console.log(sql);
                await this.pool.execute(sql);
            }
        });
    }
    private addColumnSqlSyntax(x: Column<any>) {
        let result = x.defs.dbName;
        if (x instanceof DateTimeColumn)
            result += " timestamp";
        else if (x instanceof DateColumn)
            result += " date";
        else if (x instanceof BoolColumn)
            result += " boolean default false not null";
        else if (x instanceof NumberColumn) {
            if (x.__numOfDecimalDigits == 0)
                result += " int default 0 not null";
            else
                result += ' numeric default 0 not null';
        } else if (x instanceof ValueListColumn) {
            result += ' int default 0 not null';
        }
        else
            result += " varchar default '' not null ";
        return result;
    }

    async addColumnIfNotExist<T extends Entity<any>>(e: T, c: ((e: T) => Column<any>)) {
        if (c(e).defs.dbReadOnly)
            return;
        try {
            let cmd = this.pool.createCommand();

            if (
                (await cmd.execute(`select 1   
        FROM information_schema.columns 
        WHERE table_name=${cmd.addParameterAndReturnSqlToken(e.defs.dbName.toLocaleLowerCase())} and column_name=${cmd.addParameterAndReturnSqlToken(c(e).defs.dbName.toLocaleLowerCase())}` + this.additionalWhere
                )).rows.length == 0) {
                let sql = `alter table ${e.defs.dbName} add column ${this.addColumnSqlSyntax(c(e))}`;
                console.log(sql);
                await this.pool.execute(sql);
            }
        }
        catch (err) {
            console.log(err);
        }
    }
    async verifyAllColumns<T extends Entity<any>>(e: T) {
        await Promise.all(e.columns.toArray().map(async column => {
            await this.addColumnIfNotExist(e, () => column);
        }));
    }
    additionalWhere = '';
    constructor(private pool: SqlDatabase, schema?: string) {
        if (schema) {
            this.additionalWhere = ' and table_schema=\'' + schema + '\'';
        }
    }
}