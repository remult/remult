import { Allowed, Context, RoleChecker } from './context';
import { ColumnSettings, ColumnOptions, DataControlSettings, valueOrExpressionToValue } from './column-interfaces';

import { isBoolean } from 'util';


import { DefaultStorage } from './columns/storage/default-storage';
import { Filter } from './filter/filter';
import { ColumnValueProvider } from './__EntityValueProvider';

export class Column<dataType = any>  {
  //@internal
  __setDefaultForNewRow() {
    if (this.__settings.defaultValue) {
      this.value = valueOrExpressionToValue(this.__settings.defaultValue);
    }
  }
  //@internal
  async __calcServerExpression() {
    if (this.__settings.serverExpression) {
      let x = this.__settings.serverExpression();
      x = await x;
      this.value = x;

    }
  }

  //@internal
  __clearErrors(): any {
    this.validationError = undefined;
  }
  //@internal
  async __performValidation() {
    if (this.__settings.validate) {
      await this.__settings.validate();
    }

  }


  private __settings: ColumnSettings<dataType>;
  private __defs: ColumnDefs;
  private __displayResult: DataControlSettings;
  get defs() {
    if (!this.__defs)
      this.__defs = new ColumnDefs(this.__settings);
    return this.__defs;
  }

  static consolidateOptions(options: ColumnOptions, options1?: ColumnOptions): ColumnSettings {
    let result: ColumnSettings;
    if (typeof (options) === "string") {
      result = { caption: options };
    }
    else
      result = options;
    if (!result) {
      result = {};
    }
    if (options1) {

      if (typeof (options1) === "string")
        result.caption = options1;
      else {
        result = Object.assign(Object.assign({}, result), options1);

        let op1 = options as ColumnSettings;
        let op2 = options1 as ColumnSettings;
        if (op1 && op2 && op1.dataControlSettings && op2.dataControlSettings) {
          let d1 = op1.dataControlSettings;
          let d2 = op2.dataControlSettings;
          result.dataControlSettings = () => {
            let t = d1();
            let r = Object.assign(t, d2());
            return r;
          };
        }
      }
    }
    return result;
  }

  constructor(settingsOrCaption?: ColumnOptions<dataType>, settingsOrCaption1?: ColumnOptions<dataType>) {
    this.__settings = Column.consolidateOptions(settingsOrCaption, settingsOrCaption1);
  }
  //reconsider approach - this prevents the user from overriding in a specific component
  //@internal
  __decorateDataSettings(x: DataControlSettings, context?: Context) {
    if (!x.caption && this.defs.caption)
      x.caption = this.defs.caption;
    if (x.readOnly == undefined) {
      if (this.__settings.sqlExpression)
        x.readOnly = true;
      else
        if (!context) {
          if (isBoolean(this.__settings.allowApiUpdate))
            x.readOnly = !this.__settings.allowApiUpdate;
        }
        else
          x.readOnly = !context.isAllowed(this.__settings.allowApiUpdate);
    }
    if (this.__settings && this.__settings.dataControlSettings) {
      this.__displayResult = this.__settings.dataControlSettings();
      if (!x.getValue && this.__displayResult.getValue) {
        x.getValue = e => {
          let c: Column<dataType> = this;
          if (e)
            c = e.columns.find(c) as Column<dataType>;
          if (!c.__displayResult)
            c.__displayResult = c.__settings.dataControlSettings();
          return c.__displayResult.getValue(e);
        };
      }
      if (!x.click && this.__displayResult.click) {
        x.click = e => {
          let c: Column<dataType> = this;
          if (e)
            c = e.columns.find(c) as Column<dataType>;
          if (!c.__displayResult)
            c.__displayResult = c.__settings.dataControlSettings();
          c.__displayResult.click(e);
        };
      }
      if (!x.allowClick && this.__displayResult.allowClick) {
        x.allowClick = e => {
          let c: Column<dataType> = this;
          if (e)
            c = e.columns.find(c) as Column<dataType>;
          if (!c.__displayResult)
            c.__displayResult = c.__settings.dataControlSettings();
          return c.__displayResult.allowClick(e);
        };
      }
      for (const key in this.__displayResult) {
        if (this.__displayResult.hasOwnProperty(key)) {
          const val = this.__displayResult[key];
          if (val !== undefined && x[key] === undefined) {
            x[key] = val;
          }
        }
      }



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
        add.isNull(this);
      else
        add.isEqualTo(this, val);
    });
  }
  
  isIn(...values: (Column<dataType> | dataType)[]) {
    return new Filter(add => add.isIn(this, values.map(x => this.__getVal(x))));
  }
  isNotIn(...values: (Column<dataType> | dataType)[]) {
    return new Filter(add => {
      for (const v of values) {
        add.isDifferentFrom(this, this.__getVal(v));
      }
    });
  }
  isDifferentFrom(value: Column<dataType> | dataType) {
    return new Filter(add => {
      const val = this.__getVal(value);
      if (val === null)
        add.isNotNull(this);
      else
        add.isDifferentFrom(this, val)
    });
  }
  isGreaterOrEqualTo(value: Column<dataType> | dataType) {
    return new Filter(add => add.isGreaterOrEqualTo(this, this.__getVal(value)));
  }
  isGreaterThan(value: Column<dataType> | dataType) {
    return new Filter(add => add.isGreaterThan(this, this.__getVal(value)));
  }
  isLessOrEqualTo(value: Column<dataType> | dataType) {
    return new Filter(add => add.isLessOrEqualTo(this, this.__getVal(value)));
  }
  isLessThan(value: Column<dataType> | dataType) {
    return new Filter(add => add.isLessThan(this, this.__getVal(value)));
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
    if (this.value)
      return this.value.toString();
    return '';
  }
  get originalValue() {
    return this.fromRawValue(this.__valueProvider.getOriginalValue(this.defs.key));
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
  constructor(private settings: ColumnSettings) {

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
  get key(): string {

    return this.settings.key;
  }
  set key(v: string) {
    this.settings.key = v;
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