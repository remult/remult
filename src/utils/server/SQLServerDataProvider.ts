import { Entity } from './../data';
import * as sql from 'mssql';
import { FilterBase, DataProviderFactory, DataProvider, ColumnValueProvider, iDataColumnSettings, FindOptions } from '../dataInterfaces';

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
    return new ActualSQLServerDataProvider(factory, name,this.pool);
  }
}

class ActualSQLServerDataProvider implements DataProvider {
  constructor(private entity: ()=>Entity, private name: string,private sql:sql.ConnectionPool) {

  }
  find(options?: FindOptions): Promise<any[]> {
    let r = new sql.Request(this.sql);
    return r.query('select * from categories').then(r => {
      return r.recordset;
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
