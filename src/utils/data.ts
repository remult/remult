import { Entity } from './Entity';

import { dataAreaSettings } from './utils';
import { FilterBase, DataProviderFactory,DataProvider ,ColumnValueProvider,iDataColumnSettings } from './dataInterfaces';


import { isFunction, makeTitle } from './common';



export * from './Entity';

export class Sort {

}



export class InMemoryDataProvider implements DataProviderFactory {
  public provideFor<T extends Entity>(name: string): DataProvider {
    return new ActualInMemoryDataProvider();
  }
}



class ActualInMemoryDataProvider<T extends Entity> implements DataProvider {



  constructor() {

  }

  async find(where?: FilterBase, orderBy?: Sort): Promise<any[]> {
    return this.rows.map(i => {

      return JSON.parse(JSON.stringify(i));

    });
  }


  private rows: any[] = [];
  public update(id: any, data: any): Promise<any> {
    throw new Error('Not implemented yet.');
  }

  public delete(id: any): Promise<void> {
    for (let i = 0; i < this.rows.length; i++) {
      if (id == this.rows[i].id) {
        this.rows.splice(i, 1);
        return Promise.resolve();
      }
      throw new Error("could'nt find id to delete: " + id);
    }
  }

  public insert(data: any): Promise<any> {
    this.rows.forEach(i => {
      if (data.id == i.id)
        throw Error("id already exists");
    });
    this.rows.push(JSON.parse(JSON.stringify(data)));
    return Promise.resolve(JSON.parse(JSON.stringify(data)));
  }
}







export class column<dataType>  {
  key: string;
  caption: string;
  constructor(settingsOrCaption?: iDataColumnSettings | string) {
    if (settingsOrCaption) {
      if (typeof (settingsOrCaption) === "string") {
        this.caption = settingsOrCaption;
      } else {
        if (settingsOrCaption.key)
          this.key = settingsOrCaption.key;
        if (settingsOrCaption.caption)
          this.caption = settingsOrCaption.caption;
        if (settingsOrCaption.readonly)
          this.readonly = settingsOrCaption.readonly;
        if (settingsOrCaption.inputType)
          this.inputType = settingsOrCaption.inputType;
      }

    }
  }
  readonly: boolean;
  inputType: string;
  isEqualTo(value: column<dataType> | (() => dataType)) {

    let getValue: (() => dataType);
    if (isFunction(value))
      getValue = <(() => dataType)>value;
    else if (value instanceof column)
      getValue = () => value.value;


    return new Filter(apply => apply(this.key, getValue()));
  }
  __valueProvider: ColumnValueProvider = new dummyColumnStorage();
  get value() {
    return this.__valueProvider.getValue(this.key);
  }
  set value(value: dataType) { this.__valueProvider.setValue(this.key, value); }
}

class dummyColumnStorage implements ColumnValueProvider {

  private _val: string;
  public getValue(key: string): any {
    return this._val;
  }

  public setValue(key: string, value: string): void {
    this._val = value;
  }
}


export class Filter implements FilterBase {
  constructor(private apply: (add: (name: string, val: any) => void) => void) {

  }
  and(filter: FilterBase): FilterBase {
    return new andFilter(this, filter);
  }

  public __addToUrl(add: (name: string, val: any) => void): void {
    this.apply(add);
  }
}



class andFilter implements FilterBase {
  constructor(private a: FilterBase, private b: FilterBase) {

  }


  public __addToUrl(add: (name: string, val: any) => void): void {
    this.a.__addToUrl(add);
    this.b.__addToUrl(add);
  }
}
