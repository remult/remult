import { Entity, Sort } from './data';


export interface DataProvider {
  find(where: FilterBase, orderBy: Sort): Promise<Array<any>>;
  update(id: any, data: any): Promise<any>;
  delete(id: any): Promise<void>;
  insert(data: any): Promise<any>;
}

export interface DataProviderFactory {
  provideFor<T extends Entity>(name: string): DataProvider;
}
export interface ColumnValueProvider {
  getValue(key: string): any;
  setValue(key: string, value: any): void;
}

export interface iDataColumnSettings {
  key?: string;
  caption?: string;
  readonly?: boolean;
  inputType?: string;
}


export interface FilterBase {
  __addToUrl(add: (name: string, val: any) => void): void;
}

