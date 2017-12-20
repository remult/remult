import { pageArray } from '../inMemoryDatabase';
import { Entity, Column } from './../utils';
import * as sql from 'mssql';
import { FilterBase, DataProviderFactory, DataProvider, ColumnValueProvider, DataColumnSettings, FindOptions, FilterConsumer } from '../dataInterfaces';

export class SQLServerDataProvider implements DataProviderFactory {

  pool: sql.ConnectionPool;
  constructor(user: string, password: string, server: string, database: string, instanceName: string) {
    var config: sql.config = {
      user, password, server, database
    };
    if (instanceName)
      config.options = { instanceName };
    this.pool = new sql.ConnectionPool(config);
    this.pool.connect();
  }


  provideFor<T extends Entity<any>>(name: string, factory: () => T): DataProvider {
    return new ActualSQLServerDataProvider(factory, name, this.pool, factory);
  }
}

class ActualSQLServerDataProvider<T extends Entity<any>> implements DataProvider {
  constructor(private entity: () => Entity<any>, private name: string, private sql: sql.ConnectionPool, private factory: () => T) {

  }
  find(options?: FindOptions): Promise<any[]> {
    let e = this.factory();
    let select = 'select ';
    let colKeys: string[] = [];
    e.__iterateColumns().forEach(x => {

      if (colKeys.length > 0)
        select += ', ';
      select += x.__getDbName();
      colKeys.push(x.jsonName);
    });
    select += ' from ' + this.name;
    let r = new sql.Request(this.sql);
    if (options) {
      if (options.where) {
        let where = new FilterConsumerBridgeToSqlRequest(r);
        options.where.__applyToConsumer(where);
        select += where.where;
      }
    }
    console.log(select);
    return r.query(select).then(r => {

      return  pageArray(r.recordset,options).map(y => {
        let result: any = {};
        for (let x in r.recordset.columns) {

          result[colKeys[r.recordset.columns[x].index]] = y[x];
        }
        return result;
      });
    });
  }
  update(id: any, data: any): Promise<any> {
    throw new Error("Method not implemented.");
  }
  delete(id: any): Promise<void> {
    throw new Error("Method not implemented.");
  }
  insert(data: any): Promise<any> {
    throw new Error("Method not implemented.");
  }

}
class FilterConsumerBridgeToSqlRequest implements FilterConsumer {
  where = "";
  constructor(private r: sql.Request) { }
  IsEqualTo(col: Column<any>, val: any): void {
    this.add(col, val, "=");
  }
  IsDifferentFrom(col: Column<any>, val: any): void {
    this.add(col, val, "<>");
  }
  IsGreaterOrEqualTo(col: Column<any>, val: any): void {
    this.add(col, val, ">=");
  }
  IsGreaterThan(col: Column<any>, val: any): void {
    this.add(col, val, ">");
  }
  IsLessOrEqualTo(col: Column<any>, val: any): void {
    this.add(col, val, "<=");
  }
  IsLessThan(col: Column<any>, val: any): void {
    this.add(col, val, "<");
  }
  private add(col: Column<any>, val: any, operator: string) {
    if (this.where.length == 0) {

      this.where += ' where ';
    } else this.where += ' and ';
    this.where += col.__getDbName() + ' ' + operator + ' @' + col.__getDbName();
    this.r.input(col.__getDbName(), val);
  }

}

