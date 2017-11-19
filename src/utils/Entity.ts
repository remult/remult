

import { column,Sort } from './data';
import { isFunction, makeTitle } from './common';
import { FilterBase, DataProviderFactory, DataProvider,  ColumnValueProvider, iDataColumnSettings } from './dataInterfaces';


export class Entity {
  constructor(private factory:()=>Entity,public name?: string) {
    this.__entityData = new  __EntityValueProvider(() => this.source.__getDataProvider());
  }
  __entityData: __EntityValueProvider;
  /** @internal */

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
  setSource(dp: DataProviderFactory) {
    this.source = new EntitySource<this>(this.name,()=><this> this.factory(), dp);
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
  source: EntitySource<this>;
  private applyColumn(y: column<any>) {
    if (!y.caption)
      y.caption = makeTitle(y.key);
    y.__valueProvider = this.__entityData;
  }

}

export class EntitySource<T extends Entity>
{
  private _provider: DataProvider;
  constructor(name: string, private factory: () => T, dataProvider: DataProviderFactory) {
    this._provider = dataProvider.provideFor(name);
 }
  find(where?: FilterBase, orderBy?: Sort): Promise<T[]> {
    return this._provider.find(where, orderBy)
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

  Insert(doOnRow:(item:T)=>void): Promise<void> {
      var i = this.createNewItem();
      doOnRow(i);
    return i.save();
  }
}

export class __EntityValueProvider implements ColumnValueProvider {
  delete() {
    return this.getDataProvider().delete(this.id);
  }
  constructor(private getDataProvider: () => DataProvider) {

   }
  reset(): any {
    this.data = JSON.parse(JSON.stringify(this.originalData));
  }
  save(): Promise<void> {
    if (this.newRow) {
      return this.getDataProvider().insert(this.data).then((newData:any) => {
        this.setData(newData);
      });
    } else {
      return this.getDataProvider().update(this.id, this.data).then((newData:any) => {
        this.setData(newData);
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

