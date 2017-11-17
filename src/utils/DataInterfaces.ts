import { Entity,Sort } from './data';
export interface DataProvider<T extends Entity> {
  find(where: FilterBase, orderBy: Sort): Promise<T[]>;
  createNewItem(): T;
  Insert(item: T): Promise<void>;

}
export interface DataProviderFactory {
  provideFor<T extends Entity>(name: string, factory: () => T): DataProvider<T>;
}

export interface DataHelper {
  update(id: any, data: any): Promise<any>;
  delete(id: any): Promise<void>;
  insert(data: any): Promise<any>;
}

export interface columnValueProvider {
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
