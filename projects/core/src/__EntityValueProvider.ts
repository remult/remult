
import { CompoundIdColumn } from "./columns/compound-id-column";
import { EntityDataProvider } from './data-interfaces';
import { Entity } from './entity';
export class __EntityValueProvider implements ColumnValueProvider {
  listeners: RowEvents[] = [];
  register(listener: RowEvents) {
    this.listeners.push(listener);
  }


  dataProvider: EntityDataProvider;

  initServerExpressions: () => Promise<void> = async () => { };
  delete(deleted: () => Promise<any> | any) {
    return this.dataProvider.delete(this.id).then(async () => {
      if (deleted)
        await deleted();

      this.listeners.forEach(x => {
        if (x.rowDeleted)
          x.rowDeleted();
      });
    });
  }
  //#end region xx
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
  reload(e: Entity) {
    return this.dataProvider.find({ where: e.columns.idColumn.isEqualTo(this.id) }).then(async newData => {
      await this.setData(newData[0], e);
    });
  }
  save(e: Entity, doNotSave: boolean, saved: () => Promise<any> | any): Promise<void> {
    let d = JSON.parse(JSON.stringify(this.data));
    if (e.columns.idColumn instanceof CompoundIdColumn)
      d.id = undefined;
    if (this.newRow) {

      return this.dataProvider.insert(d).then(async (newData: any) => {
        if (saved)
          await saved();
        await this.setData(newData, e);
        this.listeners.forEach(x => {
          if (x.rowSaved)
            x.rowSaved(true);
        });
      });
    }
    else {
      if (doNotSave) {
        return this.dataProvider.find({ where: e.columns.idColumn.isEqualTo(this.id) }).then(async newData => {
          await this.setData(newData[0], e);
          this.listeners.forEach(x => {
            if (x.rowSaved)
              x.rowSaved(false);
          });
        });
      }
      return this.dataProvider.update(this.id, d).then(async (newData: any) => {
        if (saved)
          await saved();
        await this.setData(newData, e);
        this.listeners.forEach(x => {
          if (x.rowSaved)
            x.rowSaved(false);
        });
      });
    }
  }
  async updateBasedOnPackedRowInfo(d: packedRowInfo, e: Entity) {
    if (!d.wasChanged)
      await this.setData(d.data, e);
    else
      this.data = d.data;
    if (this.newRow && !d.isNewRow)
      this.newRow = false;
  }
  private id: any;
  private newRow = true;
  private data: any = {};
  private originalData: any = {};
  getPackedRowInfo(): packedRowInfo {
    return {
      data: this.data,
      id: this.id,
      isNewRow: this.newRow,
      wasChanged: this.wasChanged()

    }
  }
  async setData(data: any, r: Entity) {
    if (!data)
      data = {};
    if (r.columns.idColumn instanceof CompoundIdColumn) {
      r.columns.idColumn.__addIdToPojo(data);
    }
    let id = data[r.columns.idColumn.defs.key];
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
export interface packedRowInfo {
  data: any,
  isNewRow: boolean,
  id: string,
  wasChanged: boolean

}
export interface ColumnValueProvider {
  getValue(key: string, calcDefaultValue: () => void): any;
  getOriginalValue(key: string): any;
  setValue(key: string, value: any): void;
}




export interface RowEvents {
  rowDeleted?: () => void;
  rowSaved?: (newRow: boolean) => void;
  rowReset?: (newRow: boolean) => void;
}
