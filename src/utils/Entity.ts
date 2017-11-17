import { column } from './data';
import { isFunction, makeTitle } from './common';
import { FilterBase, DataProviderFactory, DataProvider, DataHelper, ColumnValueProvider, iDataColumnSettings } from './dataInterfaces';


export class Entity {
  constructor(public __DELETEME_resturl?: string) {

  }
  __entityData = new __EntityValueProvider();
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
  save() {
    return this.__entityData.save();

  }
  reset() {
    this.__entityData.reset();
  }

  private applyColumn(y: column<any>) {
    if (!y.caption)
      y.caption = makeTitle(y.key);
    y.__valueProvider = this.__entityData;
  }

}
export class __EntityValueProvider implements ColumnValueProvider {
  reset(): any {
    this.data = JSON.parse(JSON.stringify(this.originalData));
  }
  save(): Promise<void> {
    if (this.newRow) {
      return this._dataHelper.insert(this.data).then(newData => {
        this.setData(newData);
      });
    } else {
      return this._dataHelper.update(this.id, this.data).then(newData => {
        this.setData(newData);
      });

    }
  }
  private id: any;
  private newRow = true;
  private data: any = {};
  private originalData: any = {};
  _dataHelper: DataHelper = new ErrorDataHelper();
  setHelper(errorDataHelper: DataHelper, data?: any) {
    if (!(this._dataHelper instanceof ErrorDataHelper)) {
      throw "this entity is already associated with a data helper";
    }
    this._dataHelper = errorDataHelper;
    if (data)
      this.setData(data);

  }
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
