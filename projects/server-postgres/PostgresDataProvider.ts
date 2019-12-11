import { ServerContext, DataProvider, EntityDataProvider, Entity, Column, NumberColumn, DateTimeColumn, BoolColumn, DateColumn, SQLConnectionProvider, SQLCommand, SQLQueryResult, ClosedListColumn, allEntities, SupportsDirectSql, DirectSQL } from '@remult/core';

import { Pool, QueryResult } from 'pg';
import { ActualSQLServerDataProvider,ActualDirectSQL } from '@remult/core';
import { connect } from 'net';


export interface PostgresPool extends PostgresCommandSource{
    connect():Promise<PostgresClient>;
}
export interface PostgresClient extends PostgresCommandSource{
    release():void;
}

export class PostgresDataProvider implements DataProvider,SupportsDirectSql {


    constructor(private pool: PostgresPool) {

    }
    getEntityDataProvider(entity:Entity<any>): EntityDataProvider {
        return new ActualSQLServerDataProvider(entity, new PostgresBridgeToSQLConnection(this.pool));
    }
    getDirectSql(): DirectSQL {
        return new ActualDirectSQL(new PostgresBridgeToSQLConnection(this.pool));
    }

    async transaction(action: (dataProvider: DataProvider) => Promise<void>) {
        let client = await this.pool.connect();
        let dp = new PostgresDataTransaction(client);
        try {
            await client.query('BEGIN');
            await action(dp);
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

class PostgresDataTransaction implements DataProvider, SupportsDirectSql {
    transaction(action: (dataProvider: DataProvider) => Promise<void>): Promise<void> {
        throw new Error("nested transactions not allowed");
    }
    getDirectSql(): DirectSQL {
        return new ActualDirectSQL(new PostgresBridgeToSQLConnection(this.source));
    }


    constructor(private source: PostgresCommandSource) {

    }
    getEntityDataProvider(entity:Entity<any>): EntityDataProvider {
        return new ActualSQLServerDataProvider(entity, new PostgresBridgeToSQLConnection(this.source));
    }
    createDirectSQLCommand(): SQLCommand {
        return new PostgrestBridgeToSQLCommand(this.source);
    }
    


}
export interface PostgresCommandSource {
    query(queryText: string, values?: any[]): Promise<QueryResult>;
}
class PostgresBridgeToSQLConnection implements SQLConnectionProvider {
    constructor(private source: PostgresCommandSource) {

    }
    createCommand(): SQLCommand {
        return new PostgrestBridgeToSQLCommand(this.source);
    }
}
class PostgrestBridgeToSQLCommand implements SQLCommand {
    constructor(private source: PostgresCommandSource) {

    }
    values: any[] = [];
    addParameterToCommandAndReturnParameterName(col: Column<any>, val: any): string {
        this.values.push(val);
        return '$' + this.values.length;
    }
    query(sql: string): Promise<SQLQueryResult> {
        return this.source.query(sql, this.values).then(r => new PostgressBridgeToSQLQueryResult(r));
    }
}
class PostgressBridgeToSQLQueryResult implements SQLQueryResult {
    getcolumnNameAtIndex(index: number): string {
        return this.r.fields[index].name;
    }
    getColumnIndex(name: string): number {
        for (let i = 0; i < this.r.fields.length; i++) {
            if (this.r.fields[i].name.toLowerCase() == name.toLowerCase())
                return i;
        }
        return -1;
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
        await this.pool.query("select 1 from information_Schema.tables where table_name=$1"+this.additionalWhere, [e.__getDbName().toLowerCase()]).then(async r => {
            
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
        WHERE table_name=$1 and column_name=$2`+this.additionalWhere,
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
    additionalWhere='';
    constructor(private pool: PostgresPool,schema?:string) {
        if (schema){
            this.additionalWhere = ' and table_schema=\''+schema+'\'';
        }
    }
}