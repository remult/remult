import { pageArray, InMemoryDataProvider } from '../inMemoryDatabase';
import { Entity, Column, CompoundIdColumn, StringColumn, NumberColumn, Sort } from './../utils';
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