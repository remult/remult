import { Context, Allowed } from "./context";
import { DataApiSettings } from "./data-api";
import { Column } from "./column";

import { ColumnHashSet } from "./column-hash-set";
import { FilterBase } from './filter/filter-interfaces';
import { __EntityValueProvider } from './__EntityValueProvider';
import { valueOrExpressionToValue } from './column-interfaces';
import { isString } from 'util';

//@dynamic
export class Entity<idType> {
  constructor(options?: EntityOptions | string) {
    if (options) {
      if (typeof (options) === "string") {
        this.__options = { name: options };
      } else {
        this.__options = options;
        if (options.savingRow)
          this.__onSavingRow = () => options.savingRow();
        if (options.validate)
          this.__onValidate = () => options.validate(this);
      }
    }
    else {
      this.__options = {
        name: undefined
      };
    }
  }

  static __key: string;


  
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
        x.__columns.filter(c => !r.isAllowed(c.includeInApi))
      ,
      readonlyColumns: x => {
        return x.__columns.filter(c => !r.isAllowed(c.allowApiUpdate));
      },
      get: {
        where: x => options.apiDataFilter ? options.apiDataFilter() : undefined
      }
    }

  }

  private __options: EntityOptions;
  private _defs: EntityDefs;
  get defs() {
    if (!this._defs)
      this._defs = new EntityDefs(this.__options);
    return this._defs;
  }




  __entityData = new __EntityValueProvider();

  //@internal
  __onSavingRow: () => void | Promise<void> = () => { };
  //@internal
  __onValidate: () => void | Promise<void> = () => { };

  error: string;
  __idColumn: Column<idType>;

  __initColumns(idColumn?: Column<idType>) {
    if (!this.__options.name) {
      this.__options.name = this.constructor.name;
    }
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
      this.__idColumn = this.__columns[0];
  }
  isValid() {
    let ok = true;
    this.__columns.forEach(c => {
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
    this.__columns.forEach(c => {
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

    this.__columns.forEach(c => {
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

  private catchSaveErrors(err: any): any {
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
        let c = this.columns.find(k);
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
    this.__columns.forEach(c => c.__clearErrors());
    this.error = undefined;
  }
  wasChanged() {
    return this.__entityData.wasChanged();
  }
  async __toPojo(excludeColumns: ColumnHashSet): Promise<any> {
    let r = {};

    this.__columns.forEach(c => {
      if (!excludeColumns.contains(c))
        c.__addToPojo(r);
    });
    return r;

  }

  __fromPojo(r: any, excludeColumns: ColumnHashSet): any {

    this.__columns.forEach(c => {
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
  
  private __columns: Column<any>[] = [];
  get columns() {
    return new EntityColumns(this.__columns);
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
  savingRow?: () => Promise<any> | any;

  validate?: (e: Entity<any>) => Promise<any> | any;
}

function makeTitle(name: string) {

  // insert a space before all caps
  return name.replace(/([A-Z])/g, ' $1')
    // uppercase the first character
    .replace(/^./, (str) => str.toUpperCase()).replace('Email', 'eMail').replace(" I D", " ID");

}
export class EntityDefs {

  constructor(private options: EntityOptions) {

  }
  get name() {
    return this.options.name;
  }
  get dbName() {
    if (!this.options.dbName)
      this.options.dbName = this.name;
    return valueOrExpressionToValue(this.options.dbName);
  }
  get caption() {
    if (!this.options.caption) {
      this.options.caption = makeTitle(this.name);
    }
    return this.options.caption;
  }
}
export class EntityColumns {
  constructor(private __columns: Column<any>[]) {

  }
  [Symbol.iterator]() {
    return this.__columns[Symbol.iterator]();
  }
  toArray(){
    return [...this.__columns];
  }


  find(key: string | Column<any>) {
    let theKey: string;
    if (key instanceof Column)
      theKey = key.jsonName;
    else
      theKey = key;
    for (const c of this.__columns) {
      if (c.jsonName == theKey)
        return c;
    }
    return undefined;
  }

}
