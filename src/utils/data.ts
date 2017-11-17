import { dataAreaSettings } from './utils';
import { FilterBase } from './data';


import { isFunction, makeTitle } from './common';
import { INTERNAL_BROWSER_PLATFORM_PROVIDERS } from '@angular/platform-browser/src/browser';
import { error } from 'util';

export interface DataProvider<T extends Entity> {
  find(where: FilterBase, orderBy: Sort): Promise<T[]>;
  createNewItem(): T;
}
export class Sort {

}
export class InMemoryDataProvider<T extends Entity> implements DataProvider<T> {
  private myDataSaver: InMemoryDataSaver;


  constructor(private factory: () => T) {
    this.myDataSaver = new InMemoryDataSaver(factory);
  }

  async find(where?: FilterBase, orderBy?: Sort): Promise<T[]> {
    return this.myDataSaver.find(where, orderBy);
  }

  createNewItem(): T {
    var r = this.factory();
    r.__setOriginalData(this.myDataSaver, undefined);
    return r;
  }
}
class InMemoryDataSaver implements DataHelper {
  constructor(private factory: () => Entity) {

  }
  find(where?: FilterBase, orderBy?: Sort): Array<any> {
    return this.rows.map(i => {
      let r = this.factory();
      r.__setOriginalData(this, JSON.parse(JSON.stringify(i)))
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
        throw error("id already exists");
    });
    this.rows.push(JSON.parse(JSON.stringify(data)));
    return Promise.resolve(JSON.parse(JSON.stringify(data)));
  }
}

export class Entity {
  constructor(public __restUrl: string) {

  }
  private _entityData = new EntityValueProvider();
  /** @internal */
  __setOriginalData(dataHelper: DataHelper, item: any) {
    this._entityData.setData(dataHelper, item);
  }
  protected initColumns() {
    let x = <any>this;
    for (let c in x) {
      let y = x[c];

      if (y instanceof column) {
        if (!y.key)
          y.key = c;
        this.applyColumn(y);
      }
    }
  }
  save() {
    return this._entityData.save();

  }
  reset() {
    this._entityData.reset();
  }

  private applyColumn(y: column<any>) {
    if (!y.caption)
      y.caption = makeTitle(y.key);
    y.__valueProvider = this._entityData;
  }

}
class EntityValueProvider implements columnValueProvider {
  reset(): any {
    this.data = JSON.parse(JSON.stringify(this.originalData));
  }
  save(): Promise<void> {
    if (this.newRow) {
      return this._dataHelper.insert(this.data).then(newData => {
        this.__setData(newData);
      });
    } else {
      return this._dataHelper.update(this.id, this.data).then(newData => {
        this.__setData(newData);
      });

    }
  }
  private id: any;
  private newRow = true;
  private data: any = {};
  private originalData: any = {};
  _dataHelper: DataHelper;
  setData(errorDataHelper: ErrorDataHelper, data: any) {
    this._dataHelper = errorDataHelper;
    this.__setData(data);
  }
  private __setData(data: any) {
    if (!data)
      data = {};
    if (data.id) {
      this.id = data.id;
      this.newRow = false;
    }

    this.data = data;
    this.originalData = JSON.parse(JSON.stringify(this.data));
  }
  getValue(key: string) {
    return this.data[key];
  }
  setValue(key: string, value: any): void {
    this.data[key] = value;
  }
}
export interface DataHelper {
  update(id: any, data: any): Promise<any>;
  delete(id: any): Promise<void>;
  insert(data: any): Promise<any>;
}
class ErrorDataHelper implements DataHelper {


  public update(id: any, data: any): Promise<any> {
    throw new Error('Entity not initialized.');
  }

  public delete(id: any): Promise<void> {
    throw new Error('Entity not initialized.');
  }

  public insert(data: any): Promise<any> {
    throw new Error('Entity not initialized.');
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
  __valueProvider: columnValueProvider = new dummyColumnStorage();
  get value() {
    return this.__valueProvider.getValue(this.key);
  }
  set value(value: dataType) { this.__valueProvider.setValue(this.key, value); }
}
export interface columnValueProvider {
  getValue(key: string): any;
  setValue(key: string, value: any): void;
}
class dummyColumnStorage implements columnValueProvider {

  private _val: string;
  public getValue(key: string): any {
    return this._val;
  }

  public setValue(key: string, value: string): void {
    this._val = value;
  }
}
export interface iDataColumnSettings {
  key?: string;
  caption?: string;
  readonly?: boolean;
  inputType?: string;
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

export interface FilterBase {

  __addToUrl(add: (name: string, val: any) => void): void;
}

class andFilter implements FilterBase {
  constructor(private a: FilterBase, private b: FilterBase) {

  }


  public __addToUrl(add: (name: string, val: any) => void): void {
    this.a.__addToUrl(add);
    this.b.__addToUrl(add);
  }
}
