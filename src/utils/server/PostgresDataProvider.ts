import { pageArray, InMemoryDataProvider } from '../inMemoryDatabase';
import { Entity, Column, CompoundIdColumn, StringColumn, NumberColumn, Sort } from './../utils';
import * as sql from 'mssql';
import { FilterBase, DataProviderFactory, DataProvider, ColumnValueProvider, DataColumnSettings, FindOptions, FilterConsumer, DataApiRequest } from '../dataInterfaces';

import { DataApi, DataApiResponse } from './DataApi';
import { ActualSQLServerDataProvider } from './SQLServerDataProvider';


export class PostgresDataProvider implements DataProviderFactory {

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
      return undefined;
      //return new ActualSQLServerDataProvider(factory, name, this.pool, factory);
    }
  
  
  }