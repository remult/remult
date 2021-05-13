import { Allowed, Context, RoleChecker } from './context';
import { columnDefs, ColumnSettings, dbLoader, delmeColumnValidatorHelper, jsonLoader, ValueListItem, valueOrExpressionToValue } from './column-interfaces';




import { DefaultStorage } from './columns/storage/default-storage';
import { AndFilter, Filter } from './filter/filter-interfaces';
import { ColumnValueProvider } from './__EntityValueProvider';
import { Entity } from './entity';




import { BoolStorage } from './columns/storage/bool-storage';

import { EntityWhere, FindOptions, Repository } from './remult3';
import { DateTimeStorage } from './columns/storage/datetime-storage';
import { DateTimeDateStorage } from './columns/storage/datetime-date-storage';


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
      if (this.__settings.displayValue&&false)
        
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
  get type(): any {
    if (this.col instanceof  StringColumn)
      return String;
    if (this.col instanceof  NumberColumn)
      return Number;
    if (this.col instanceof DateColumn)
      return Date;
    if (this.col instanceof DateTimeColumn)
      return Date;
    if (this.col instanceof BoolColumn)
      return Boolean;
    return String;
  }
  dbReadOnly: boolean = this.col.defs.dbReadOnly;
  isVirtual: boolean = this.col.defs.__isVirtual();
  jsonLoader: jsonLoader<any> = {
    fromJson: x => this.col.fromRawValue(x),
    toJson: x => this.col.toRawValue(x)
  }
  key = this.col.defs.key;
  caption = this.col.defs.caption;
  inputType = this.col.defs.inputType;
  dbName = this.col.defs.dbName;
  dbLoader = this.col.__getStorage();

}
export class StringColumn extends ComparableColumn<string>{

  contains(value: StringColumn | string) {
    return new Filter(add => add.containsCaseInsensitive(new columnBridgeToDefs(this), value));
  }
  startsWith(value: StringColumn | string) {
    return new Filter(add => add.startsWith(new columnBridgeToDefs(this), value));
  }
}
export class NumberColumn extends ComparableColumn<number>{
  constructor(settings?: NumberColumnSettings) {
    super({ inputType: 'number', ...settings });
    let s = settings as NumberColumnSettings;
    if (s && s.decimalDigits) {
      this.__numOfDecimalDigits = s.decimalDigits;
    }
  }
  __numOfDecimalDigits: number = 0;
  protected __processValue(value: number) {

    this._tempInputValue = undefined;
    if (value != undefined && !(typeof value === "number"))
      return +value;
    return value;

  }
  fromRawValue(value: any) {
    if (value !== undefined)
      return +value;
    return undefined;
  }
  private _tempInputValue: string = undefined;
  get inputValue() {
    if (this._tempInputValue !== undefined)
      return this._tempInputValue;
    if (this.rawValue !== undefined)
      return this.rawValue.toString();
    return '0';
  }
  set inputValue(value: string) {
    this.rawValue = value;
    this._tempInputValue = undefined;
    if (value.startsWith('-')) {
      if (this.value == 0 || isNaN(this.value)) {
        this.value = 0;
        this._tempInputValue = value;
      }
    }
    else if (isNaN(this.value)) {
      this.value = 0;
      if (value == '')
        this._tempInputValue = '';
    }
  }
}
export interface NumberColumnSettings extends ColumnSettings<number> {
  decimalDigits?: number;
}

export class BoolColumn extends Column<boolean>{
  constructor(settings?: ColumnSettings<boolean>) {
    super({ inputType: 'checkbox', ...settings });

  }
  fromRawValue(value: any) {
    if (typeof value === "boolean")
      return value;
    if (value !== undefined) {
      return value.toString().trim().toLowerCase() == 'true';
    }
    return undefined;
  }
  __defaultStorage() {
    return new BoolStorage();
  }
}
export class DateColumn extends ComparableColumn<Date>{
  constructor(settings?: ColumnSettings<Date>) {
    super({ inputType: 'date', displayValue: () => this.value.toLocaleDateString(undefined,{timeZone:'UTC'}), ...settings });
  }
  getDayOfWeek() {
    return new Date(this.value).getDay();
  }

  __defaultStorage() {
    return new DateTimeDateStorage();
  }
  toRawValue(value: Date) {
    return DateColumn.dateToString(value);
  }
  fromRawValue(value: any) {

    return DateColumn.stringToDate(value);
  }

  static stringToDate(value: string) {
    if (!value || value == '' || value == '0000-00-00')
      return undefined;
    return new Date(Date.parse(value));
  }
  static dateToString(val: Date): string {
    var d = val as Date;
    if (!d)
      return '';
    return d.toISOString().substring(0,10);
    let month = addZeros(d.getUTCMonth() + 1),
      day = addZeros(d.getUTCDate()),
      year = d.getUTCFullYear();
    return [year, month, day].join('-');
    //
  }

}
function addZeros(number: number, stringLength: number = 2) {
  let to = number.toString();
  while (to.length < stringLength)
    to = '0' + to;
  return to;
}


export class DateTimeColumn extends ComparableColumn<Date>{
  constructor(settings?: ColumnSettings<Date>) {
    super({ displayValue: () => this.value.toLocaleString(),...settings });
  }
  getDayOfWeek() {
    return this.value.getDay();
  }
  __defaultStorage() {
    return new DateTimeStorage();
  }
  fromRawValue(value: any) {
    return DateTimeColumn.stringToDate(value);
  }
  toRawValue(value: Date) {
    return DateTimeColumn.dateToString(value);
  }

  static stringToDate(val: string) {
    if (val == undefined)
      return undefined;
    if (val == '')
      return undefined;
    if (val.startsWith('0000-00-00'))
      return undefined;
    return new Date(Date.parse(val));
  }
  static dateToString(val: Date): string {
    var d = val as Date;
    if (!d)
      return '';
    return d.toISOString();
  }


}


export class CompoundIdColumn extends Column<string>
{
  columns: Column[];
  constructor( ...columns: Column[]) {
    super({
      serverExpression:()=>this.getId()
    });
    this.columns = columns;
  }
  __isVirtual() { return true; }
  isEqualTo(value: Column<string> | string): Filter {
    return new Filter(add => {
      let val = this.__getVal(value);
      let id = val.split(',');
      let result: Filter;
      this.columns.forEach((c, i) => {
        if (!result)
          result = c.isEqualTo(id[i]);
        else
          result = new AndFilter(result, c.isEqualTo(id[i]));
      });
      return result.__applyToConsumer(add);
    });
  }
  private getId(){
    let r = "";
    this.columns.forEach(c => {
      if (r.length > 0)
        r += ',';
      r += c.rawValue;
    });
    return r;
  }
  __addIdToPojo(p: any) {
    if (p.id)
      return;
    let r = "";
    this.columns.forEach(c => {
      if (r.length > 0)
        r += ',';
      r += p[c.defs.key];
    });
    p.id = r;

  }
  resultIdFilter(id: string, data: any) {
    return new Filter(add => {
      let idParts: any[] = [];
      if (id != undefined)
        idParts = id.split(',');
      let result: Filter;
      this.columns.forEach((c, i) => {
        let val = undefined;
        if (i < idParts.length)
          val = idParts[i];
        if (data[c.defs.key] != undefined)
          val = data[c.defs.key];
        if (!result)
          result = c.isEqualTo(val);
        else
          result = new AndFilter(result, c.isEqualTo(val));
      });
      return result.__applyToConsumer(add);
    });
  }
}


export class ValueListColumn<T extends ValueListItem> extends Column<T> {

  constructor(private valueListType: classWithNew<T>, settings?: ColumnSettings<T>) {
    super({ displayValue: () => this.value.caption, ...settings });


  }
  readonly info = ValueListTypeInfo.get(this.valueListType);

  getOptions(): ValueListItem[] {
    return this.info.getOptions();
  }
  toRawValue(value: T) {
    return value.id;
  }
  fromRawValue(value: any) {
    return this.info.byId(value);
  }



}
export declare type classWithNew<T> = { new(...args: any[]): T; };

export class ValueListTypeInfo<T extends ValueListItem>{
  static get<T extends ValueListItem>(type: classWithNew<T>): ValueListTypeInfo<T> {
    let r = typeCache.get(type);
    if (!r)
      r = new ValueListTypeInfo(type);
    typeCache.set(type, r);
    return r;
  }
  private byIdMap = new Map<any, T>();
  private values: T[] = [];
  isNumeric = false;
  private constructor(private valueListType: any) {
    for (let member in this.valueListType) {
      let s = this.valueListType[member] as T;
      if (s instanceof this.valueListType) {
        if (s.id === undefined)
          s.id = member;
        if (s.caption === undefined)
          s.caption = makeTitle(member);
        if (typeof s.id === 'number')
          this.isNumeric = true;
        this.byIdMap.set(s.id, s);
        this.values.push(s);
      }
    }
  }
  getOptions() {
    return this.values;
  }
  byId(key: any) {
    if (this.isNumeric)
      key = +key;
    return this.byIdMap.get(key);
  }
}
const typeCache = new Map<any, ValueListTypeInfo<any>>();


export class ManyToOne<T>{
  constructor(private repository: Repository< T>,
    private where: EntityWhere<T>
  ) { }
  exists() {
    return !this.repository.getRowHelper( this.item).isNew();
  }
  get item(): T {
    return this.repository.lookup(this.where);
  }
  async waitLoad() {
    return this.repository.lookupAsync(this.where);
  }
}

export class OneToMany<T>{
  constructor(private provider: Repository<T>,
    private settings?: {
      create?: (newItem: T) => void,
    } & FindOptions<T>) {
    if (!this.settings)
      this.settings = {};
  }
  private _items: T[];
  private _currentPromise: Promise<T[]>;
  get items() {
    this.waitLoad();
    return this._items;
  }
  async waitLoad() {
    if (this._currentPromise != null)
      return this._currentPromise;
    if (this._items === undefined)
      this._items = [];
    return this._currentPromise = this.find().then(x => {
      this._items.splice(0);
      this._items.push(...x);
      return this._items;
    });
  }
  async reload() {
    this._currentPromise = undefined;
    return this.waitLoad();
  }
  private async find(): Promise<T[]> {
    return this.provider.find(this.settings)
  }
  create(): T {
    let r = this.provider.create();
    this.provider.updateEntityBasedOnWhere(this.settings.where, r);
    if (this.settings.create)
      this.settings.create(r);
    return r;
  }
}