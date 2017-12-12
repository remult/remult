import { Column,Entity, Sort } from './utils';
import { FindOptions } from './DataInterfaces';



export interface DataProvider {
  find(options?: FindOptions): Promise<Array<any>>;
  update(id: any, data: any): Promise<any>;
  delete(id: any): Promise<void>;
  insert(data: any): Promise<any>;
}
export interface FindOptions {
  where?: FilterBase;
  orderBy?: Sort;
  limit?: number;
  page?: number;
  additionalUrlParameters?: any;
}
export interface FindOptionsPerEntity<rowType extends Entity<any>> {
  where?: (rowType: rowType) => FilterBase;
  orderBy?: (rowType: rowType) => Sort;
  limit?: number;
  page?: number;
  additionalUrlParameters?: any;
}

export interface DataProviderFactory {
  provideFor<T extends Entity<any>>(name: string, factory: () => T): DataProvider;
}
export interface ColumnValueProvider {
  getValue(key: string): any;
  setValue(key: string, value: any): void;
}

export interface DataColumnSettings {
  jsonName?: string;
  caption?: string;
  readonly?: boolean;
  inputType?: string;
  dbName?: string;
}

export interface RowEvents {
  rowDeleted?: () => void;
  rowSaved?: (newRow: boolean) => void;
  rowReset?: (newRow: boolean) => void;
}


export interface FilterBase {
  __addToUrl(add: (name: Column<any>, val: any) => void): void;
}

