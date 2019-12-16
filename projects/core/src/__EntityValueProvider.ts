import {  RowEvents, ValueOrFunction } from "./column-interfaces";
import { CompoundIdColumn } from "./columns/compound-id-column";
import { EntityDataProvider } from './data-interfaces';
import { Entity } from './entity';
export class __EntityValueProvider implements ColumnValueProvider {
  listeners: RowEvents[] = [];
  register(listener: RowEvents) {
    this.listeners.push(listener);
  }
  dataProvider: EntityDataProvider;
  initServerExpressions:()=>Promise<void> = async ()=>{};
  delete() {
    return this.dataProvider.delete(this.id).then(() => {
      this.listeners.forEach(x => {
        if (x.rowDeleted)
          x.rowDeleted();
      });
    });
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
  save(e: Entity<any>): Promise<void> {
    let d = JSON.parse(JSON.stringify(this.data));
    if (e.__idColumn instanceof CompoundIdColumn)
      d.id = undefined;
    if (this.newRow) {
      return this.dataProvider.insert(d).then((newData: any) => {
        this.setData(newData, e);
        this.listeners.forEach(x => {
          if (x.rowSaved)
            x.rowSaved(true);
        });
      });
    }
    else {
      return this.dataProvider.update(this.id, d).then((newData: any) => {
        this.setData(newData, e);
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
  async setData(data: any, r: Entity<any>) {
    if (!data)
      data = {};
    if (r.__idColumn instanceof CompoundIdColumn) {
      r.__idColumn.__addIdToPojo(data);
    }
    let id = data[r.__idColumn.jsonName];
    if (id != undefined) {
      this.id = id;
      this.newRow = false;
    }
    this.data = data;
    await this.initServerExpressions();
    this.originalData = JSON.parse(JSON.stringify(this.data));
  }
  getValue(key: string) {
    return this.data[key];
  }
  getOriginalValue(key: string) {
    return this.originalData[key];
  }
  setValue(key: string, value: any): void {
    this.data[key] = value;
  }
}
export interface ColumnValueProvider {
    getValue(key: string,calcDefaultValue: () => void): any;
    getOriginalValue(key: string): any;
    setValue(key: string, value: any): void;
}
