import { Entity } from './../data';
import * as sql from 'mssql';
import { FilterBase, DataProviderFactory, DataProvider, ColumnValueProvider, DataColumnSettings, FindOptions } from '../dataInterfaces';

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


  provideFor<T extends Entity>(name: string, factory: () => T): DataProvider {
    return new ActualSQLServerDataProvider(factory, name, this.pool, factory);
  }
}

class ActualSQLServerDataProvider<T extends Entity> implements DataProvider {
  constructor(private entity: () => Entity, private name: string, private sql: sql.ConnectionPool, private factory: () => T) {

  }
  find(options?: FindOptions): Promise<any[]> {
    let e = this.factory();
    let select = 'select ';
    let colKeys: string[] = [];
    e.__iterateColumns().forEach(x => {

      if (colKeys.length > 0)
        select  += ', ';
      select  += x.__getDbName();
      colKeys.push(x.key);
    });
    select += ' from ' + this.name;
    let r = new sql.Request(this.sql);
    if (options) {
      if (options.where) {
        let addedWhere = false;
        options.where.__addToUrl((col, value) => {
          if (!addedWhere) {
            addedWhere = true;
            select += ' where ';
          } else select += ' and ';
          select += col.__getDbName() + ' = @' + col.__getDbName();
          r.input(col.__getDbName(), value);
        });

      }
    }

    return r.query(select).then(r => {

      return r.recordset.map(y => {
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
