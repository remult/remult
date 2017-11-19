

import { Entity } from './Entity';

import { dataAreaSettings } from './utils';
import { FilterBase, DataProviderFactory, DataProvider, ColumnValueProvider, iDataColumnSettings, FindOptions } from './dataInterfaces';


import { isFunction, makeTitle } from './common';



export * from './Entity';

export class Sort {
  constructor(...segments: SortSegment[]) {
    this.Segments = segments;
  }
  Segments: SortSegment[];
}
export interface SortSegment {
  column: Column<any>,
  descending?: boolean
}




export class InMemoryDataProvider implements DataProviderFactory {
  public provideFor<T extends Entity>(name: string): DataProvider {
    return new ActualInMemoryDataProvider();
  }
}



class ActualInMemoryDataProvider<T extends Entity> implements DataProvider {



  constructor() {

  }

  async find(options?: FindOptions): Promise<any[]> {

    let rows = this.rows;
    if (options) {
      if (options.where) {
        rows = rows.filter(i => {
          let ok = true;
          options.where.__addToUrl((key, val) => {
            if (i[key] != val)
              ok = false;
          });
          return ok;
        });
      }
      if (options.orderBy) {
        rows = rows.sort((a: any, b: any) => {
          let r = 0;
          for (let i = 0; i < options.orderBy.Segments.length; i++) {
            let seg = options.orderBy.Segments[i];
            let left = a[seg.column.key];
            let right = b[seg.column.key];
            if (left > right)
              r = 1;
            else if (left < right)
              r = -1;
            if (r != 0) {
              if (seg.descending)
                r *= -1;
              return r;
            }
          }
          return r;
        });
      }
    }
    return rows.map(i => {

      return JSON.parse(JSON.stringify(i));

    });
  }


  private rows: any[] = [];
  public update(id: any, data: any): Promise<any> {
    for (let i = 0; i < this.rows.length; i++) {
      if (id == this.rows[i].id) {
        this.rows[i] = Object.assign({}, this.rows[i], data);
        return Promise.resolve(this.rows[i]);
      }
      throw new Error("could'nt find id to delete: " + id);
    }
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



export class Column<dataType>  {
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
  isEqualTo(value: Column<dataType> | dataType) {


    let val: dataType;

    if (value instanceof Column)
      val = value.value;
    else
      val = value;


    return new Filter(apply => apply(this.key, value));
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
