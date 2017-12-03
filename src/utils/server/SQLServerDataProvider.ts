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
    return new ActualSQLServerDataProvider(factory, name,this.pool,factory);
  }
}

class ActualSQLServerDataProvider<T extends Entity> implements DataProvider {
  constructor(private entity: ()=>Entity, private name: string,private sql:sql.ConnectionPool,private factory: () => T) {

  }
  find(options?: FindOptions): Promise<any[]> {
    let e = this.factory();
    let cols = '';
    let colKeys: string[] = [];
    e.__iterateColumns().forEach(x => {

      if (cols.length > 0)
        cols += ', ';
      cols += x.dbName;
      colKeys.push(x.key);
     });
    let r = new sql.Request(this.sql);
    return r.query('select '+cols+' from categories').then(r => {

      return r.recordset.map(y => {
        let result:any = {};
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
