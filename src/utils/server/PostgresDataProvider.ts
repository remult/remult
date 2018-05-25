import { pageArray, InMemoryDataProvider } from '../inMemoryDatabase';
import { Entity, Column, CompoundIdColumn, StringColumn, NumberColumn, Sort, DateTimeColumn, BoolColumn } from './../utils';
import * as sql from 'mssql';
import { FilterBase, DataProviderFactory, DataProvider, ColumnValueProvider, DataColumnSettings, FindOptions, FilterConsumer, DataApiRequest } from '../dataInterfaces1';

import { DataApi, DataApiResponse } from './DataApi';

import { Pool, QueryResult } from 'pg';
import { ActualSQLServerDataProvider, SQLConnectionProvider, SQLCommand, SQLQueryResult } from './SQLDatabaseShared';


export class PostgresDataProvider implements DataProviderFactory {


  constructor(private pool: Pool) {

  }


  provideFor<T extends Entity<any>>(name: string, factory: () => T): DataProvider {
    return new ActualSQLServerDataProvider(factory, name, new PostgresBridgeToSQLConnection(this.pool), factory);
  }


}
class PostgresBridgeToSQLConnection implements SQLConnectionProvider {
  constructor(private pool: Pool) {

  }
  createCommand(): SQLCommand {
    return new PostgrestBridgeToSQLCommand(this.pool);
  }
}
class PostgrestBridgeToSQLCommand implements SQLCommand {
  constructor(private pool: Pool) {

  }
  values: any[]=[];
  addParameterToCommandAndReturnParameterName(col: Column<any>, val: any): string {
    this.values.push(val);
    return '$' + this.values.length;
  }
  query(sql: string): Promise<SQLQueryResult> {
    return this.pool.query(sql, this.values).then(r => new PostgressBridgeToSQLQueryResult(r));
  }
}
class PostgressBridgeToSQLQueryResult implements SQLQueryResult {
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

    CreateIfNotExist(e: Entity<any>): any {
        this.pool.query("select 1 from information_Schema.tables where table_name=$1", [e.__getDbName().toLowerCase()]).then(r => {
            if (r.rowCount == 0) {
                let result = '';
                e.__iterateColumns().forEach(x => {
                    if (!x.__isVirtual()) {
                        if (result.length != 0)
                            result += ',';
                        result += '\r\n  ';
                        result = this.addColumnSqlSyntax(x);
                        if (x == e.__idColumn)
                            result += ' primary key';
                    }
                });
                this.pool.query('create table ' + e.__getDbName() + ' (' + result + '\r\n)');
            }
        });
    }
    private addColumnSqlSyntax(x: Column<any>) {
        let result = x.__getDbName();
        if (x instanceof DateTimeColumn)
            result += " date";
        else if (x instanceof BoolColumn)
            result += " boolean default false not null";
        else if (x instanceof NumberColumn)
            result += " int default 0 not null";
        else
            result += " varchar default '' not null ";
        return result;
    }

    async addColumnIfNotExist<T extends Entity<any>>(e: T, c: ((e: T) => Column<any>)) {
        try {
            if (
                (await this.pool.query(`select 1   
        FROM information_schema.columns 
        WHERE table_name=$1 and column_name=$2`,
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
        e.__iterateColumns().forEach(column => {
            this.addColumnIfNotExist(e, () => column);
        });
    }

    constructor(private pool: Pool) {

    }
}