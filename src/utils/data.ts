import { Entity } from './Entity';

import { dataAreaSettings } from './utils';
import { FilterBase, DataProviderFactory,DataProvider ,DataHelper,ColumnValueProvider,iDataColumnSettings } from './dataInterfaces';


import { isFunction, makeTitle } from './common';


export * from './Entity';

export class Sort {

}


export class EntitySource<T extends Entity>
{
  private _provider: DataProvider<T>;
  constructor(name: string, factory: () => T, dataProvider: DataProviderFactory) {
    this._provider = dataProvider.provideFor(name, factory);
  }
  find(where?: FilterBase, orderBy?: Sort): Promise<T[]> {
    return this._provider.find(where, orderBy);
  }

  createNewItem(): T {
    return this._provider.createNewItem();
  }

  insertItem(item:T) {
    return this._provider.Insert(item);
  }

  Insert(doOnRow:(item:T)=>void): Promise<void> {
      var i = this.createNewItem();
      doOnRow(i);
    return i.save();
  }
}


export class InMemoryDataProvider implements DataProviderFactory {
  public provideFor<T extends Entity>(name: string, factory: () => T): DataProvider<T> {
    return new ActualInMemoryDataProvider(factory);
  }
}



class ActualInMemoryDataProvider<T extends Entity> implements DataProvider<T> {
  private myDataSaver: InMemoryDataSaver;


  constructor(private factory: () => T) {
    this.myDataSaver = new InMemoryDataSaver(factory);
  }

  async find(where?: FilterBase, orderBy?: Sort): Promise<T[]> {
    return this.myDataSaver.find(where, orderBy);
  }

  createNewItem(): T {
    var r = this.factory();
    r.__entityData.setHelper(this.myDataSaver);
    return r;
  }
  Insert(item: T): Promise<void> {
    item.__entityData.setHelper(this.myDataSaver);
    return item.save();
  }
}
class InMemoryDataSaver implements DataHelper {
  constructor(private factory: () => Entity) {

  }
  find(where?: FilterBase, orderBy?: Sort): Array<any> {
    return this.rows.map(i => {
      let r = this.factory();
      r.__entityData.setHelper(this, JSON.parse(JSON.stringify(i)));
      return r;
    });
  }


  private rows: any[] = [];
  public update(id: any, data: any): Promise<any> {
    throw new Error('Not implemented yet.');
  }

  public delete(id: any): Promise<void> {
    throw new Error('Not implemented yet.');
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
