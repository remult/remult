import { ServerContext, DataProvider, EntityDataProvider, Entity, Column, NumberColumn, DateTimeColumn, BoolColumn, DateColumn, SqlDatabase, SqlCommand, SqlResult, ClosedListColumn, allEntities, SqlImplementation } from '@remult/core';

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
    addParameterAndReturnSqlToken(col: Column<any>, val: any): string {
        this.values.push(val);
        return '$' + this.values.length;
    }
    execute(sql: string): Promise<SqlResult> {
        return this.source.query(sql, this.values).then(r => new PostgressBridgeToSQLQueryResult(r));
    }
}
class PostgressBridgeToSQLQueryResult implements SqlResult {
    getResultJsonNameForIndexInSelect(index: number): string {
        return this.r.fields[index].name;
    }

    constructor(private r: QueryResult) {
        this.rows = r.rows;
    }
    rows: any[];

}



export class PostgrestSchemaBuilder {
    async verifyStructureOfAllEntities() {
        console.log("start verify structure");
        let context = new ServerContext();
        for (const entity of allEntities) {
            let x = context.for(entity).create();
            try {

                if (x.__getDbName().toLowerCase().indexOf('from ') < 0) {
                    await this.CreateIfNotExist(x);
                    await this.verifyAllColumns(x);
                }
            }
            catch (err) {
                console.log("failed verify structore of " + x.__getDbName() + " ", err);
            }
        }
    }
    async CreateIfNotExist(e: Entity<any>): Promise<void> {
        await this.pool.query("select 1 from information_Schema.tables where table_name=$1" + this.additionalWhere, [e.__getDbName().toLowerCase()]).then(async r => {

            if (r.rowCount == 0) {
                let result = '';
                e.__iterateColumns().forEach(x => {
                    if (!x.__dbReadOnly()) {
                        if (result.length != 0)
                            result += ',';
                        result += '\r\n  ';
                        result += this.addColumnSqlSyntax(x);
                        if (x == e.__idColumn)
                            result += ' primary key';
                    }
                });
                let sql = 'create table ' + e.__getDbName() + ' (' + result + '\r\n)';
                console.log(sql);
                await this.pool.query(sql);
            }
        });
    }
    private addColumnSqlSyntax(x: Column<any>) {
        let result = x.__getDbName();
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
        } else if (x instanceof ClosedListColumn) {
            result += ' int default 0 not null';
        }
        else
            result += " varchar default '' not null ";
        return result;
    }

    async addColumnIfNotExist<T extends Entity<any>>(e: T, c: ((e: T) => Column<any>)) {
        if (c(e).__dbReadOnly())
            return;
        try {
            if (
                (await this.pool.query(`select 1   
        FROM information_schema.columns 
        WHERE table_name=$1 and column_name=$2`+ this.additionalWhere,
                    [e.__getDbName().toLocaleLowerCase(),
                    c(e).__getDbName().toLocaleLowerCase()])).rowCount == 0) {
                let sql = `alter table ${e.__getDbName()} add column ${this.addColumnSqlSyntax(c(e))}`;
                console.log(sql);
                await this.pool.query(sql);
            }
        }
        catch (err) {
            console.log(err);
        }
    }
    async verifyAllColumns<T extends Entity<any>>(e: T) {
        await Promise.all(e.__iterateColumns().map(async column => {
            await this.addColumnIfNotExist(e, () => column);
        }));
    }
    additionalWhere = '';
    constructor(private pool: PostgresPool, schema?: string) {
        if (schema) {
            this.additionalWhere = ' and table_schema=\'' + schema + '\'';
        }
    }
}