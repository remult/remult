import { RowEvents } from './DataInterfaces';




import { dataAreaSettings } from './utils';
import { FilterBase, DataProviderFactory, DataProvider, ColumnValueProvider, DataColumnSettings, FindOptions } from './dataInterfaces';


import { isFunction, makeTitle } from './common';





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
  jsonName: string;
  caption: string;
  dbName: string;
  constructor(settingsOrCaption?: DataColumnSettings | string) {
    if (settingsOrCaption) {
      if (typeof (settingsOrCaption) === "string") {
        this.caption = settingsOrCaption;
      } else {
        if (settingsOrCaption.jsonName)
          this.jsonName = settingsOrCaption.jsonName;
        if (settingsOrCaption.caption)
          this.caption = settingsOrCaption.caption;
        if (settingsOrCaption.readonly)
          this.readonly = settingsOrCaption.readonly;
        if (settingsOrCaption.inputType)
          this.inputType = settingsOrCaption.inputType;
        if (settingsOrCaption.dbName)
          this.dbName = settingsOrCaption.dbName;
      }

    }


  }
  __getDbName() {
    if (this.dbName)
      return this.dbName;
    return this.jsonName;
   }
  readonly: boolean;
  inputType: string;
  isEqualTo(value: Column<dataType> | dataType) {


    let val: dataType;

    if (value instanceof Column)
      val = value.value;
    else
      val = value;


    return new Filter(apply => apply(this, val));
  }
  __valueProvider: ColumnValueProvider = new dummyColumnStorage();
  get value() {
    return this.__valueProvider.getValue(this.jsonName);
  }
  set value(value: dataType) { this.__valueProvider.setValue(this.jsonName, value); }
  __addToPojo(pojo: any) {
    pojo[this.jsonName] = this.value;
  }
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
  constructor(private apply: (add: (name: Column<any>, val: any) => void) => void) {

  }
  and(filter: FilterBase): FilterBase {
    return new AndFilter(this, filter);
  }

  public __addToUrl(add: (name: Column<any>, val: any) => void): void {
    this.apply(add);
  }
}



export class AndFilter implements FilterBase {
  constructor(private a: FilterBase, private b: FilterBase) {

  }


  public __addToUrl(add: (name: Column<any>, val: any) => void): void {
    this.a.__addToUrl(add);
    this.b.__addToUrl(add);
  }
}

export class Entity {
  constructor(private factory: () => Entity, source: DataProviderFactory, public name?: string) {
    this.__entityData = new __EntityValueProvider(() => this.source.__getDataProvider());
    this.setSource(source);
  }
  __entityData: __EntityValueProvider;
  /** @internal */

  protected initColumns() {
    let x = <any>this;
    for (let c in x) {
      let y = x[c];

      if (y instanceof Column) {
        if (!y.jsonName)
          y.jsonName = c;

        this.applyColumn(y);
      }
    }
  }
  setSource(dp: DataProviderFactory) {
    this.source = new EntitySource<this>(this.name, () => <this>this.factory(), dp);
  }
  save() {
    return this.__entityData.save();
  }
  delete() {
    return this.__entityData.delete();

  }
  reset() {
    this.__entityData.reset();
  }
  wasChanged() {
    return this.__entityData.wasChanged();
  }
  __toPojo(): any {
    let r = {};
    this.__iterateColumns().forEach(c => {
      c.__addToPojo(r);
    });
    return r;

  }

  source: EntitySource<this>;
  private applyColumn(y: Column<any>) {
    if (!y.caption)
      y.caption = makeTitle(y.jsonName);
    y.__valueProvider = this.__entityData;
    this.__columns.push(y);
  }
  private __columns: Column<any>[] = [];
  __getColumn<T>(col: Column<T>) {

    return this.__getColumnByKey(col.jsonName);
  }
  __getColumnByKey(key: string): Column<any> {
    let any: any = this;
    return any[key];
  }
  __iterateColumns() {
    return this.__columns;

  }
}




export class EntitySource<T extends Entity>
{
  private _provider: DataProvider;
  constructor(name: string, private factory: () => T, dataProvider: DataProviderFactory) {
    this._provider = dataProvider.provideFor(name, factory);
  }
  find(options?: FindOptions): Promise<T[]> {
    return this._provider.find(options)
      .then(arr => {
        return arr.map(i => {
          let r = this.factory();
          r.__entityData.setData(i);
          r.source = this;
          return r;
        })
      });
  }



  __getDataProvider() {
    return this._provider;
  }

  createNewItem(): T {
    let r = this.factory();
    r.source = this;
    return r;
  }

  Insert(doOnRow: (item: T) => void): Promise<void> {
    var i = this.createNewItem();
    doOnRow(i);
    return i.save();
  }
}

export class __EntityValueProvider implements ColumnValueProvider {
  listeners: RowEvents[] = [];
  register(listener: RowEvents) {
    this.listeners.push(listener);
  }
  delete() {
    return this.getDataProvider().delete(this.id).then(() => {
      this.listeners.forEach(x => {
        if (x.rowDeleted)
          x.rowDeleted();
      });
    });
  }
  constructor(private getDataProvider: () => DataProvider) {

  }
  isNewRow(): boolean {
    return this.newRow;
  }
  wasChanged() {
    return JSON.stringify(this.originalData) != JSON.stringify(this.data) || this.newRow;

  }
  reset(): void {
    this.data = JSON.parse(JSON.stringify(this.originalData));
    this.listeners.forEach(x => {
      if (x.rowReset)
        x.rowReset(this.newRow);
    });
  }
  save(): Promise<void> {
    if (this.newRow) {
      return this.getDataProvider().insert(this.data).then((newData: any) => {
        this.setData(newData);
        this.listeners.forEach(x => {
          if (x.rowSaved)
            x.rowSaved(true);
        });
      });
    } else {
      return this.getDataProvider().update(this.id, this.data).then((newData: any) => {
        this.setData(newData);
        this.listeners.forEach(x => {
          if (x.rowSaved)
            x.rowSaved(false);
        });
      });

    }
  }
  private id: any;
  private newRow = true;
  private data: any = {};
  private originalData: any = {};


  setData(data: any) {
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
