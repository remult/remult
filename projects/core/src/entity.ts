import { Context, Allowed } from "./context";
import { DataApiSettings } from "./data-api";
import { Column } from "./column";
import { FilterBase } from './filter/filter-interfaces';
import { __EntityValueProvider } from './__EntityValueProvider';
import { valueOrExpressionToValue } from './column-interfaces';


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
  //@internal
  static __key: string;


  //@internal 
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
      get: {
        where: x => options.apiDataFilter ? options.apiDataFilter() : undefined
      }
    }

  }
  //@internal
  private __options: EntityOptions;
  //@internal
  private _defs: EntityDefs;
  get defs() {
    if (!this._defs)
      this._defs = new EntityDefs(this.__options);
    return this._defs;
  }



  //@internal
  __entityData = new __EntityValueProvider();

  //@internal
  __onSavingRow: () => void | Promise<void> = () => { };
  //@internal
  __onValidate: () => void | Promise<void> = () => { };

  validationError: string;
  //@internal
  private __idColumn: Column<idType>;
  //@internal
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
        if (!y.defs.key)
          y.defs.key = c;
        if (!this.__idColumn && y.defs.key == 'id')
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
      if (c.validationError)
        ok = false;
    });
    return ok;
  }
  isNew() {
    return this.__entityData.isNewRow();
  }
  //@internal
  private __getValidationError() {
    let result: any = {};
    result.modelState = {};
    this.__columns.forEach(c => {
      if (c.validationError)
        result.modelState[c.defs.key] = c.validationError;
    });
    return result;
  }
  //@internal
  private __assertValidity() {
    if (!this.isValid()) {

      throw this.__getValidationError();
    }
  }
  async save(afterValidationBeforeSaving?: (row: this) => Promise<any> | any) {
    this.__clearErrors();

    this.__columns.forEach(c => {
      c.__performValidation();
    });

    if (this.__onValidate)
      this.__onValidate();
    if (afterValidationBeforeSaving)
      await afterValidationBeforeSaving(this);
    this.__assertValidity();

    await  this.__onSavingRow();
    this.__assertValidity();
    return await  this.__entityData.save(this).catch(e => this.catchSaveErrors(e));
  }
  //@internal
  private catchSaveErrors(err: any): any {
    let e = err;
    
    if (e instanceof Promise) {
      return e.then(x => this.catchSaveErrors(x));
    }
    if (e.error) {
      e = e.error;
    }

    if (e.message)
      this.validationError = e.message;
    else if (e.Message)
      this.validationError = e.Message;
    else this.validationError = e;
    let s = e.modelState;
    if (!s)
      s = e.ModelState;
    if (s) {
      Object.keys(s).forEach(k => {
        let c = this.columns.find(k);
        if (c)
          c.validationError = s[k];
      });
    }
    throw err;

  }

  delete() {
    return this.__entityData.delete().catch(e => this.catchSaveErrors(e));

  }
  undoChanges() {
    this.__entityData.reset();
    this.__clearErrors();
  }
  async reload() {
    throw 'not implemented';
  }
  //@internal
  __clearErrors() {
    this.__columns.forEach(c => c.__clearErrors());
    this.validationError = undefined;
  }
  wasChanged() {
    return this.__entityData.wasChanged();
  }





  //@internal
  __applyColumn(y: Column<any>) {
    if (!y.defs.caption)
      y.defs.caption = makeTitle(y.defs.key);
    y.__valueProvider = this.__entityData;
    if (this.__columns.indexOf(y) < 0)
      this.__columns.push(y);
  }

  //@internal
  private __columns: Column<any>[] = [];
  get columns() {
    return new EntityColumns(this.__columns, this.__idColumn);
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

  constructor(private __options: EntityOptions) {

  }
  get name() {
    return this.__options.name;
  }
  get dbName() {
    if (!this.__options.dbName)
      this.__options.dbName = this.name;
    return valueOrExpressionToValue(this.__options.dbName);
  }
  get caption() {
    if (!this.__options.caption) {
      this.__options.caption = makeTitle(this.name);
    }
    return this.__options.caption;
  }
}
export class EntityColumns<T>{
  constructor(private __columns: Column<any>[], public readonly idColumn: Column<T>) {

  }
  [Symbol.iterator]() {
    return this.__columns[Symbol.iterator]();
  }
  toArray() {
    return [...this.__columns];
  }



  find(key: string | Column<any>) {
    let theKey: string;
    if (key instanceof Column)
      theKey = key.defs.key;
    else
      theKey = key;
    for (const c of this.__columns) {
      if (c.defs.key == theKey)
        return c;
    }
    return undefined;
  }

}
