import { Allowed, Context } from './Context';
import { ColumnSettings,ColumnOptions,   DataControlSettings } from './column-interfaces';

import { isBoolean } from 'util';

import { functionOrString } from './common';
import { DefaultStorage } from './columns/storage/default-storage';
import { Filter } from './filter/filter';
import { ColumnValueProvider } from './__EntityValueProvider';

export class Column<dataType>  {

    async __calcVirtuals() {
      if (this.__settings && this.__settings.serverExpression) {
        let x = this.__settings.serverExpression();
        if (x instanceof Promise)
          x = await x;
        this.value = x;
  
      }
    }
  
    __isVirtual() {
      if (this.__settings && this.__settings.serverExpression)
        return true;
      return false;
  
    }
    __dbReadOnly() {
      if (this.__settings && this.__settings.dbReadOnly)
        return true;
      return this.__isVirtual();
    }
    __clearErrors(): any {
      this.error = undefined;
    }
    __performValidation() {
      if (this.onValidate) {
        this.onValidate();
      }
  
    }
    onValidate: () => void;
    onValueChange: () => void;
    jsonName: string;
    caption: string;
    includeInApi: Allowed = true;
    dbName: string | (() => string);
    private __settings: ColumnSettings<dataType>;
    __getMemberName() { return this.jsonName; }
    static consolidateOptions(options: ColumnOptions<any>, options1?: ColumnOptions<any>): ColumnSettings<any> {
      let result: ColumnSettings<any>;
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
        else
          result = Object.assign(result, options1);
      }
      return result;
    }
  
    constructor(settingsOrCaption?: ColumnOptions<dataType>, settingsOrCaption1?: ColumnOptions<dataType>) {
      this.__settings = Column.consolidateOptions(settingsOrCaption, settingsOrCaption1);
  
  
      if (this.__settings.jsonName)
        this.jsonName = this.__settings.jsonName;
      if (this.__settings.caption)
        this.caption = this.__settings.caption;
      if (this.__settings.includeInApi != undefined)
        this.includeInApi = this.__settings.includeInApi;
      if (this.__settings.allowApiUpdate != undefined)
        this.allowApiUpdate = this.__settings.allowApiUpdate;
      if (this.__settings.inputType)
        this.inputType = this.__settings.inputType;
      if (this.__settings.dbName)
        this.dbName = this.__settings.dbName;
      if (this.__settings.value != undefined)
        this.value = this.__settings.value;
      if (this.__settings.valueChange)
        this.onValueChange = () => this.__settings.valueChange();
      if (this.__settings.validate)
        this.onValidate = () => this.__settings.validate();
  
  
  
  
  
  
  
    }
    //reconsider approach - this prevents the user from overriding in a specific component
    __decorateDataSettings(x: DataControlSettings<any>, context?: Context) {
      if (!x.caption && this.caption)
        x.caption = this.caption;
      if (x.readonly == undefined) {
        if (!context) {
          if (isBoolean(this.allowApiUpdate))
            x.readonly = !this.allowApiUpdate;
        }
        else
          x.readonly = !context.isAllowed(this.allowApiUpdate);
      }
  
      if (x.inputType == undefined)
        x.inputType = this.inputType;
      if (this.__settings && this.__settings.dataControlSettings) {
        this.__displayResult = this.__settings.dataControlSettings();
        if (!x.dropDown)
          x.dropDown = this.__displayResult.dropDown;
        if (x.hideDataOnInput === undefined)
          x.hideDataOnInput = this.__displayResult.hideDataOnInput;
        if (!x.width)
          x.width = this.__displayResult.width;
        if (!x.clickIcon)
          x.clickIcon = this.__displayResult.clickIcon;
        if (!x.getValue && this.__displayResult.getValue) {
          x.getValue = e => {
            let c: Column<dataType> = this;
            if (e)
              c = e.__getColumn(c) as Column<dataType>;
            if (!c.__displayResult)
              this.__displayResult = this.__settings.dataControlSettings();
            return c.__displayResult.getValue(e);
          };
        }
        if (!x.click && this.__displayResult.click) {
          x.click = e => {
            let c: Column<dataType> = this;
            if (e)
              c = e.__getColumn(c) as Column<dataType>;
            if (!c.__displayResult)
              this.__displayResult = this.__settings.dataControlSettings();
            c.__displayResult.click(e);
          };
        }
        if (!x.allowClick && this.__displayResult.allowClick) {
          x.allowClick = e => {
            let c: Column<dataType> = this;
            if (e)
              c = e.__getColumn(c) as Column<dataType>;
            if (!c.__displayResult)
              this.__displayResult = this.__settings.dataControlSettings();
            return c.__displayResult.allowClick(e);
          };
        }
  
      }
    }
    private __displayResult: DataControlSettings<any>;
  
  
    __getStorage() {
      if (!this.__settings)
        this.__settings = {};
      if (!this.__settings.storage)
        this.__settings.storage = this.__defaultStorage();
      return this.__settings.storage;
  
    }
    __defaultStorage() {
      return new DefaultStorage<any>();
    }
    error: string;
    __getDbName(): string {
      if (this.dbName)
        return functionOrString(this.dbName);
  
      return this.jsonName;
    }
  
    allowApiUpdate: Allowed = true;
    inputType: string;
    isEqualTo(value: Column<dataType> | dataType) {
      return new Filter(add => add.isEqualTo(this, this.__getVal(value)));
    }
    isDifferentFrom(value: Column<dataType> | dataType) {
      return new Filter(add => add.isDifferentFrom(this, this.__getVal(value)));
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
    __getVal(value: Column<dataType> | dataType): dataType {
  
  
      if (value instanceof Column)
        return this.toRawValue(value.value);
      else
        return this.toRawValue(value);
    }
    __valueProvider: ColumnValueProvider = new dummyColumnStorage();
    get value() {
      return this.fromRawValue(this.rawValue);
    }
    get originalValue() {
      return this.fromRawValue(this.__valueProvider.getOriginalValue(this.jsonName));
    }
    get displayValue() {
      if (this.value)
        return this.value.toString();
      return '';
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
    set rawValue(value: any) {
      this.__valueProvider.setValue(this.jsonName, this.__processValue(value));
      this.error = undefined;
      if (this.onValueChange)
        this.onValueChange();
    }
    get rawValue() {
      return this.__valueProvider.getValue(this.jsonName);
    }
    get inputValue() {
      return this.rawValue;
    }
    set inputValue(value: string) {
      this.rawValue = value;
    }
    set value(value: dataType) {
  
      this.rawValue = this.toRawValue(value);
    }
    __addToPojo(pojo: any) {
      pojo[this.jsonName] = this.rawValue;
    }
    __loadFromToPojo(pojo: any) {
      let x = pojo[this.jsonName];
      if (x != undefined)
        this.rawValue = x;
    }
  }
  
class dummyColumnStorage implements ColumnValueProvider {

    private _val: string;
    public getValue(key: string): any {
      return this._val;
    }
    public getOriginalValue(key: string): any {
      return this._val;
    }
  
  
  
    public setValue(key: string, value: string): void {
      this._val = value;
    }
  }
  