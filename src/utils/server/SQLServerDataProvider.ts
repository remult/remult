
import { pageArray } from '../inMemoryDatabase';
import { Entity, Column, CompoundIdColumn } from './../utils';
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
  constructor(private entityFactory: () => Entity<any>, private name: string, private sql: sql.ConnectionPool, private factory: () => T) {

  }
  private entity: Entity<any>;
  find(options?: FindOptions): Promise<any[]> {
    if (!this.entity)
      this.entity = this.entityFactory();
    let select = 'select ';
    let colKeys: Column<any>[] = [];
    this.entity.__iterateColumns().forEach(x => {
      if (x instanceof CompoundIdColumn) {

      }
      else {
        if (colKeys.length > 0)
          select += ', ';
        select += x.__getDbName();
        colKeys.push(x);
      }
    });
    select += ' from ' + this.entity.__getDbName();
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

      return pageArray(r.recordset, options).map(y => {
        let result: any = {};
        for (let x in r.recordset.columns) {
          let col = colKeys[r.recordset.columns[x].index];
          result[col.jsonName] = col.__getStorage().fromDb(y[x]);
        }
        return result;
      });
    });
  }
  update(id: any, data: any): Promise<any> {
    if (!this.entity)
      this.entity = this.entityFactory();


    let r = new sql.Request(this.sql);
    let f = new FilterConsumerBridgeToSqlRequest(r);
    this.entity.__idColumn.isEqualTo(id).__applyToConsumer(f);
    let statement = 'update ' + this.entity.__getDbName() + ' set ';
    let added = false;
    this.entity.__iterateColumns().forEach(x => {
      if (x instanceof CompoundIdColumn) {

      }
      else {
        let v = data[x.jsonName];
        if (v != undefined) {
          if (!added)
            added = true;
          else
            statement += ', ';

          statement += x.__getDbName() + ' = ' + f.addParameterToCommandAndReturnParameterName(x, v);
        }
      }
    });
    statement += f.where;
    console.log(statement);
    return r.query(statement).then(() => {
      return this.find({ where: this.entity.__idColumn.isEqualTo(id) }).then(y => y[0]);
    });


  }
  delete(id: any): Promise<void> {
    if (!this.entity)
      this.entity = this.entityFactory();


    let r = new sql.Request(this.sql);
    let f = new FilterConsumerBridgeToSqlRequest(r);
    this.entity.__idColumn.isEqualTo(id).__applyToConsumer(f);
    let statement = 'delete ' + this.entity.__getDbName() ;
    let added = false;

    statement += f.where;
    console.log(statement);
    return r.query(statement).then(() => {
      return this.find({ where: this.entity.__idColumn.isEqualTo(id) }).then(y => y[0]);
    });

  }
  insert(data: any): Promise<any> {
    if (!this.entity)
      this.entity = this.entityFactory();


    let r = new sql.Request(this.sql);
    let f = new FilterConsumerBridgeToSqlRequest(r);


    let cols = '';
    let vals = '';
    let added = false;
    this.entity.__iterateColumns().forEach(x => {
      if (x instanceof CompoundIdColumn) {

      }
      else {
        let v = data[x.jsonName];
        if (v != undefined) {
          if (!added)
            added = true;
          else {
            cols += ', ';
            vals += ', ';
          }

          cols += x.__getDbName();
          vals += f.addParameterToCommandAndReturnParameterName(x, v);
        }
      }
    });
    let statement = `insert into ${this.entity.__getDbName()} (${cols}) values (${vals})`;
    console.log(statement);
    return r.query(statement).then(() => {
      return this.find({ where: this.entity.__idColumn.isEqualTo(data.id) }).then(y => y[0]);
    });
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
    this.where += col.__getDbName() + ' ' + operator + ' ' + this.addParameterToCommandAndReturnParameterName(col, val);

  }

  usedNames: any = {};
  addParameterToCommandAndReturnParameterName(col: Column<any>, val: any) {

    let dbVal = col.__getStorage().toDb(val);

    let orig = col.__getDbName();
    let n = orig;
    let i = 0;

    while (this.usedNames[n])
      n = orig + i++;
    this.usedNames[n] = true;
    this.r.input(n, dbVal);
    console.log(val + ' - ' + dbVal);
    return '@' + n;
  }

}

