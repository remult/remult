import { Context, Allowed } from "../context/Context";
import { DataApiSettings } from "../server/DataApi";
import { functionOrString, makeTitle } from "./common";
import { Column } from "./column";

import { ColumnValueProvider,  RowEvents } from "./column-interfaces";
import { ColumnHashSet } from "./column-hash-set";
import { CompoundIdColumn } from "./columns/compound-id-column";
import { FilterBase } from './filter/filter-interfaces';
import { EntityDataProvider } from './data-interfaces';

//@dynamic
export class Entity<idType> {
    constructor(options?: EntityOptions | string) {
      if (options) {
        if (typeof (options) === "string") {
          this.__options = { name: options };
        } else {
          this.__options = options;
          if (options.onSavingRow)
            this.__onSavingRow = () => options.onSavingRow();
          if (options.onValidate)
            this.__onValidate = () => options.onValidate(this);
        }
      }
      else {
        this.__options = {
          name: undefined
        };
      }
    }
  
    static __key: string;
  
  
    _getExcludedColumns(x: Entity<any>, context: Context) {
      let r = x.__iterateColumns().filter(c => {
        return !context.isAllowed(c.includeInApi);
      });
      return r;
    }
    _getEntityApiSettings(r: Context): DataApiSettings<Entity<any>> {
  
      let options = this.__options;
      if (options.allowApiCRUD) {
        options.allowApiDelete = true;
        options.allowApiInsert = true;
        options.allowApiUpdate = true;
      }
      return {
        allowRead: r.isAllowed(options.allowApiRead),
        allowUpdate: r.isAllowed(options.allowApiUpdate),
        allowDelete: r.isAllowed(options.allowApiDelete),
        allowInsert: r.isAllowed(options.allowApiInsert),
        excludeColumns: x =>
          this._getExcludedColumns(x, r)
        ,
        readonlyColumns: x => {
          return x.__iterateColumns().filter(c => !r.isAllowed(c.allowApiUpdate));
        },
        get: {
          where: x => options.apiDataFilter ? options.apiDataFilter() : undefined
        }
      }
  
    }
  
    __options: EntityOptions;
  
  
    __getName() {
      return this.__options.name;
    }
    __getDbName() {
      if (!this.__options.dbName)
        this.__options.dbName = this.__getName();
      return functionOrString(this.__options.dbName);
    }
    __getCaption() {
      if (!this.__options.caption) {
        this.__options.caption = makeTitle(this.__getName());
      }
      return this.__options.caption;
    }
  
    __entityData = new __EntityValueProvider();
  
    //@internal
    __onSavingRow: () => void | Promise<void> = () => { };
    //@internal
    __onValidate: () => void | Promise<void> = () => { };
  
    error: string;
    __idColumn: Column<idType>;
  
    __initColumns(idColumn?: Column<idType>) {
      if (idColumn)
        this.__idColumn = idColumn;
      let x = <any>this;
      for (let c in x) {
        let y = x[c];
  
        if (y instanceof Column) {
          if (!y.jsonName)
            y.jsonName = c;
          if (!this.__idColumn && y.jsonName == 'id')
            this.__idColumn = y;
  
  
          this.__applyColumn(y);
        }
      }
      if (!this.__idColumn)
        this.__idColumn = this.__iterateColumns()[0];
    }
    isValid() {
      let ok = true;
      this.__iterateColumns().forEach(c => {
        if (c.error)
          ok = false;
      });
      return ok;
    }
    isNew() {
      return this.__entityData.isNewRow();
    }
  
    __getValidationError() {
      let result: any = {};
      result.modelState = {};
      this.__iterateColumns().forEach(c => {
        if (c.error)
          result.modelState[c.jsonName] = c.error;
      });
      return result;
    }
  
  
    __assertValidity() {
      if (!this.isValid()) {
  
        throw this.__getValidationError();
      }
    }
    save(validate?: (row: this) => Promise<any> | any, onSavingRow?: (row: this) => Promise<any> | any) {
      this.__clearErrors();
  
      this.__iterateColumns().forEach(c => {
        c.__performValidation();
      });
  
      if (this.__onValidate)
        this.__onValidate();
      if (validate)
        validate(this);
      this.__assertValidity();
  
  
      let performEntitySave = () => {
        let x = this.__onSavingRow();
  
        let doSave = () => {
          this.__assertValidity();
  
  
          return this.__entityData.save(this).catch(e => this.catchSaveErrors(e));
        };
        if (x instanceof Promise) {
  
          return x.then(() => {
            return doSave();
          });
        }
        else {
  
          return doSave();
        }
      }
  
      if (!onSavingRow)
        return performEntitySave();
      let y = onSavingRow(this);
      if (y instanceof Promise) {
        return y.then(() => { return performEntitySave(); });
      }
      return performEntitySave();
    }
    catchSaveErrors(err: any): any {
      let e = err;
      if (e instanceof Promise) {
        return e.then(x => this.catchSaveErrors(x));
      }
      if (e.error) {
        e = e.error;
      }
  
      if (e.message)
        this.error = e.message;
      else if (e.Message)
        this.error = e.Message;
      else this.error = e;
      let s = e.modelState;
      if (!s)
        s = e.ModelState;
      if (s) {
        Object.keys(s).forEach(k => {
          let c = this.__getColumnByJsonName(k);
          if (c)
            c.error = s[k];
        });
      }
      throw err;
  
    }
  
    delete() {
      return this.__entityData.delete().catch(e => this.catchSaveErrors(e));
  
    }
    reset() {
      this.__entityData.reset();
      this.__clearErrors();
    }
    //@internal
    __clearErrors() {
      this.__iterateColumns().forEach(c => c.__clearErrors());
      this.error = undefined;
    }
    wasChanged() {
      return this.__entityData.wasChanged();
    }
    async __toPojo(excludeColumns: ColumnHashSet): Promise<any> {
      let r = {};
      await Promise.all(this.__iterateColumns().map(async c => {
        await c.__calcVirtuals();
      }));
      this.__iterateColumns().forEach(c => {
        if (!excludeColumns.contains(c))
          c.__addToPojo(r);
      });
      return r;
  
    }
  
    __fromPojo(r: any, excludeColumns: ColumnHashSet): any {
  
      this.__iterateColumns().forEach(c => {
        if (!excludeColumns.contains(c))
          c.__loadFromToPojo(r);
      });
  
  
    }
  
  
    //@internal
    __applyColumn(y: Column<any>) {
      if (!y.caption)
        y.caption = makeTitle(y.jsonName);
      y.__valueProvider = this.__entityData;
      if (this.__columns.indexOf(y) < 0)
        this.__columns.push(y);
    }
    //@internal
    __columns: Column<any>[] = [];
    __getColumn<T>(col: Column<T>) {
  
      return this.__getColumnByJsonName(col.jsonName);
    }
    __getColumnByJsonName(key: string): Column<any> {
      let result: Column<any>;
      this.__iterateColumns().forEach(c => {
        if (c.jsonName == key)
          result = c;
      });
      return result;
    }
    __iterateColumns() {
      return this.__columns;
  
    }
  
  
  }
  export interface EntityOptions {
    name: string;
    dbName?: string | (() => string);
    caption?: string;
    allowApiRead?: Allowed;
    allowApiUpdate?: Allowed;
    allowApiDelete?: Allowed;
    allowApiInsert?: Allowed;
    allowApiCRUD?: Allowed;
    apiDataFilter?: () => FilterBase;
    onSavingRow?: () => Promise<any> | any;
  
    onValidate?: (e: Entity<any>) => Promise<any> | any;
  }
  
  export class __EntityValueProvider implements ColumnValueProvider {
    listeners: RowEvents[] = [];
    register(listener: RowEvents) {
      this.listeners.push(listener);
    }
    dataProvider: EntityDataProvider;
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
      } else {
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
  
  
    setData(data: any, r: Entity<any>) {
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