import { Allowed, Context, RoleChecker } from './context';
import { columnDefs, ColumnSettings, dbLoader, delmeColumnValidatorHelper, jsonLoader, valueOrExpressionToValue } from './column-interfaces';




import { DefaultStorage } from './columns/storage/default-storage';
import { Filter } from './filter/filter-interfaces';
import { ColumnValueProvider } from './__EntityValueProvider';
import { Entity } from './entity';


export class Column<dataType = any>  {
  //@internal
  __setDefaultForNewRow() {
    if (this.__settings.defaultValue) {
      this.value = valueOrExpressionToValue(this.__settings.defaultValue);
    }
  }
  //@internal
  async __calcServerExpression(entity: any) {
    if (this.__settings.serverExpression) {
      let x = this.__settings.serverExpression(entity);
      x = await x;
      this.value = x;

    }
  }

  //@internal
  __clearErrors(): any {
    this.validationError = undefined;
  }
  //@internal
  async __performValidation(helper: delmeColumnValidatorHelper<any, any>) {
    if (this.__settings.validate) {
      if (Array.isArray(this.__settings.validate)) {
        for (const v of this.__settings.validate) {
          await helper(this, v);
        }
      } else if (typeof this.__settings.validate === 'function')
        await helper(this, this.__settings.validate);
    }

  }


  private __settings: ColumnSettings<dataType>;
  private __defs: ColumnDefs;

  get defs() {
    if (!this.__defs)
      this.__defs = new ColumnDefs(this.__settings, () => this.__valueProvider.getEntity());
    return this.__defs;
  }



  constructor(settings?: ColumnSettings<dataType>) {
    this.__settings = settings;
    if (!this.__settings) {
      this.__settings = {};
    }
  }



  //@internal
  __getStorage() {
    return this.__defaultStorage();

  }
  //@internal
  __defaultStorage() {
    return new DefaultStorage<any>();
  }
  validationError: string;




  isEqualTo(value: Column<dataType> | dataType) {
    return new Filter(add => {
      let val = this.__getVal(value);
      if (val === null)
        add.isNull(new columnBridgeToDefs(this));
      else
        add.isEqualTo(new columnBridgeToDefs(this), val);
    });
  }

  isIn(...values: (Column<dataType> | dataType)[]) {
    return new Filter(add => add.isIn(new columnBridgeToDefs(this), values));
  }
  isNotIn(...values: (Column<dataType> | dataType)[]) {
    return new Filter(add => {
      for (const v of values) {
        add.isDifferentFrom(new columnBridgeToDefs(this), (v));
      }
    });
  }
  isDifferentFrom(value: Column<dataType> | dataType) {
    return new Filter(add => {
      const val = this.__getVal(value);
      if (val === null)
        add.isNotNull(new columnBridgeToDefs(this));
      else
        add.isDifferentFrom(new columnBridgeToDefs(this), val)
    });
  }

  //@internal
  __getVal(value: Column<dataType> | dataType): dataType {


    if (value instanceof Column)
      return this.toRawValue(value.value);
    else
      return this.toRawValue(value);
  }
  //@internal
  __valueProvider: ColumnValueProvider = new dummyColumnStorage();
  get value() {
    return this.fromRawValue(this.rawValue);
  }
  set value(value: dataType) {
    this.rawValue = this.toRawValue(value);
  }
  set rawValue(value: any) {
    this.__valueProvider.setValue(this.defs.key, this.__processValue(value));
    this.validationError = undefined;
    if (this.__settings.valueChange)
      this.__settings.valueChange();
  }
  get rawValue() {
    return this.__valueProvider.getValue(this.defs.key, () => this.__setDefaultForNewRow());
  }
  get inputValue() {
    return this.rawValue;
  }
  set inputValue(value: string) {
    this.rawValue = value;
  }
  get displayValue() {
    if (this.value) {
      if (this.__settings.displayValue)
        return this.__settings.displayValue();
      return this.value.toString();
    }
    return '';
  }
  get originalValue() {
    return this.fromRawValue(this.__valueProvider.getOriginalValue(this.defs.key));
  }
  wasChanged() {
    return this.value != this.originalValue;
  }

  protected __processValue(value: dataType) {
    return value;

  }


  fromRawValue(value: any): dataType {
    return value;
  }
  toRawValue(value: dataType): any {
    return value;
  }
  //@internal
  __addToPojo(pojo: any, context?: RoleChecker) {
    if (!context || this.__settings.includeInApi === undefined || context.isAllowed(this.__settings.includeInApi)) {
      pojo[this.defs.key] = this.rawValue;
    }
  }
  //@internal
  __loadFromPojo(pojo: any, context?: RoleChecker) {
    if (!context ||
      ((this.__settings.includeInApi === undefined || context.isAllowed(this.__settings.includeInApi))
        && (this.__settings.allowApiUpdate === undefined || context.isAllowed(this.__settings.allowApiUpdate)))
    ) {
      let x = pojo[this.defs.key];
      if (x != undefined)
        this.rawValue = x;
    }
  }
}

class dummyColumnStorage implements ColumnValueProvider {
  getEntity(): Entity<any> {
    return undefined;
  }

  private _val: string;
  private _wasSet = false;
  public getValue(key: string, calcDefaultValue: () => void): any {
    if (!this._wasSet) {
      calcDefaultValue();
    }
    return this._val;
  }
  public getOriginalValue(key: string): any {
    return this._val;
  }




  public setValue(key: string, value: string): void {
    this._val = value;
    this._wasSet = true;
  }
}
export class ColumnDefs {
  constructor(private settings: ColumnSettings, private _entity: () => Entity) {

  }
  get caption(): string {
    return this.settings.caption;
  }
  set caption(v: string) {
    this.settings.caption = v;
  }
  get allowNull() {
    return !!this.settings.allowNull;
  }
  get inputType() {
    if (this.settings.inputType)
      return this.settings.inputType;
    else 'text';
  }
  set inputType(inputType: string) {
    this.settings.inputType = inputType;
  }
  get key(): string {

    return this.settings.key;
  }
  set key(v: string) {
    this.settings.key = v;
  }
  get entity(): Entity {
    return this._entity();
  }
  get dbName(): string {
    if (this.settings.sqlExpression) {
      return valueOrExpressionToValue(this.settings.sqlExpression);
    }
    if (this.settings.dbName)
      return this.settings.dbName;
    return this.key;
  }
  __isVirtual() {
    if (this.settings.serverExpression)
      return true;
    return false;

  }
  get allowApiUpdate(): Allowed {
    return this.settings.allowApiUpdate;
  }
  set allowApiUpdate(value: Allowed) {
    this.settings.allowApiUpdate = value;
  }
  get dbReadOnly() {
    if (this.settings.dbReadOnly || this.settings.sqlExpression)
      return true;
    return this.__isVirtual();
  }
}
export function getColumnsFromObject(controller: any) {
  let __columns: Column[] = controller.__columns;;
  if (!__columns) {

    __columns = [];
    controller.__columns = __columns;
    for (const key in controller) {
      if (Object.prototype.hasOwnProperty.call(controller, key)) {
        const element = controller[key];
        if (element instanceof Column) {
          if (!element.defs.key)
            element.defs.key = key;
          if (!element.defs.caption)
            element.defs.caption = makeTitle(element.defs.key);
          __columns.push(element);
        }

      }
    }
  }
  return __columns;
}
export function makeTitle(name: string) {

  // insert a space before all caps
  return name.replace(/([A-Z])/g, ' $1')
    // uppercase the first character
    .replace(/^./, (str) => str.toUpperCase()).replace('Email', 'eMail').replace(" I D", " ID");

}

export class ComparableColumn<dataType = any> extends Column<dataType>{
  isGreaterOrEqualTo(value: Column<dataType> | dataType) {
    return new Filter(add => add.isGreaterOrEqualTo(new columnBridgeToDefs(this), value));
  }
  isGreaterThan(value: Column<dataType> | dataType) {
    return new Filter(add => add.isGreaterThan(new columnBridgeToDefs(this), value));
  }
  isLessOrEqualTo(value: Column<dataType> | dataType) {
    return new Filter(add => add.isLessOrEqualTo(new columnBridgeToDefs(this), value));
  }
  isLessThan(value: Column<dataType> | dataType) {
    return new Filter(add => add.isLessThan(new columnBridgeToDefs(this), value));
  }
}

export function __isGreaterOrEqualTo<dataType>(col: columnDefs<dataType>, value: dataType) {
  return new Filter(add => add.isGreaterOrEqualTo(col, value));
}
export function __isGreaterThan<dataType>(col: columnDefs<dataType>, value: dataType) {
  return new Filter(add => add.isGreaterThan(col, value));
}
export function __isLessOrEqualTo<dataType>(col: columnDefs<dataType>, value: dataType) {
  return new Filter(add => add.isLessOrEqualTo(col, value));
}
export function __isLessThan<dataType>(col: columnDefs<dataType>, value: dataType) {
  return new Filter(add => add.isLessThan(col, value));
}

export class columnBridgeToDefs implements columnDefs {
  constructor(private col: Column) {

  }
  jsonLoader: jsonLoader<any> = {
    fromJson: x => this.col.toRawValue(x),
    toJson: x => this.col.fromRawValue(x)
  }
  key = this.col.defs.key;
  caption = this.col.defs.caption;
  inputType = this.col.defs.inputType;
  dbName = this.col.defs.dbName;
  dbLoader = this.col.__getStorage();

}