

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
    return new AndFilter(this, filter);
  }

  public __addToUrl(add: (name: string, val: any) => void): void {
    this.apply(add);
  }
}



export class AndFilter implements FilterBase {
  constructor(private a: FilterBase, private b: FilterBase) {

  }


  public __addToUrl(add: (name: string, val: any) => void): void {
    this.a.__addToUrl(add);
    this.b.__addToUrl(add);
  }
}
