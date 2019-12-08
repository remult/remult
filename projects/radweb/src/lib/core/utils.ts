


import { makeTitle, isFunction, functionOrString } from './common';

import {
  DataColumnSettings, ColumnOptions, FilterBase, ColumnValueProvider, FindOptions, FindOptionsPerEntity, RowEvents, EntityDataProvider, DataProvider, FilterConsumer
  , ColumnStorage,

  EntityProvider,
  ColumnDisplay,
  EntityOrderBy,
  EntityWhere
} from './dataInterfaces1';
import { Allowed, Context, DirectSQL } from '../context/Context';
import { DataApiSettings } from '../server/DataApi';
import { isBoolean, isString, isArray } from 'util';
import { Column } from './column';
import { Entity } from './entity';
import { Sort } from './sort';








export interface dataAreaSettings {
  columns: ColumnCollection<any>;
  lines: ColumnSetting<any>[][];
}



export const testing = 'testing 123';











export interface DropDownOptions {

  items?: DropDownItem[] | string[] | any[];
  source?: DropDownSource<any>;
}
export class DropDownSource<rowType extends Entity<any>>{
  async provideItems(): Promise<DropDownItem[]> {

    return (await this.provider.find({
      where: this.args.where,
      orderBy: this.args.orderBy
    })).map(x => {
      return {
        id: this.args.idColumn(x).value,
        caption: this.args.captionColumn(x).value
      }
    });
  }
  constructor(private provider: EntityProvider<rowType>, private args?: DropDownSourceArgs<rowType>) {
    if (!args) {
      this.args = args = {};
    }
    if (!args.idColumn) {
      args.idColumn = x => x.__idColumn;
    }
    if (!args.captionColumn) {
      let item = provider.create();
      let idCol = args.idColumn(item);
      for (const keyInItem of item.__iterateColumns()) {
        if (keyInItem != idCol) {
          args.captionColumn = x => x.__getColumn(keyInItem);
          break;
        }
      }
    }
  }
}
export interface DropDownSourceArgs<rowType extends Entity<any>> {
  idColumn?: (e: rowType) => Column<any>,
  captionColumn?: (e: rowType) => Column<any>,
  orderBy?: EntityOrderBy<rowType>,
  where?: EntityWhere<rowType>
}

export interface DropDownItem {
  id?: any;
  caption?: any;
}

export type DataArealColumnSetting<rowType> = ColumnSetting<rowType> | ColumnSetting<rowType>[];






export interface IDataAreaSettings<rowType> {
  columnSettings?: (rowType: rowType) => DataArealColumnSetting<rowType>[];
  numberOfColumnAreas?: number;
  labelWidth?: number;
}

export class DataAreaSettings<rowType extends Entity<any>>
{
  lines: ColumnSetting<any>[][] = [];
  constructor(public settings?: IDataAreaSettings<rowType>, public columns?: ColumnCollection<rowType>, entity?: rowType) {
    if (columns == undefined) {
      columns = new ColumnCollection<rowType>(() => undefined, () => true, undefined, () => true);
      columns.numOfColumnsInGrid = 0;
      this.columns = columns;
    }
    if (settings && settings.columnSettings) {


      for (const colSettings of settings.columnSettings(entity)) {
        if (isArray(colSettings)) {
          let x = columns.items.length;
          //@ts-ignore
          columns.add(...colSettings);
          let line = [];
          for (let index = x; index < columns.items.length; index++) {
            line.push(columns.items[index]);
          }
          this.lines.push(line);
        } else {
          columns.add(<ColumnSetting<rowType>>colSettings);
          this.lines.push([columns.items[columns.items.length - 1]]);

        }
      }


    }

  }
}








export class FilterHelper<rowType extends Entity<any>> {
  filterRow: rowType;
  filterColumns: Column<any>[] = [];
  forceEqual: Column<any>[] = [];
  constructor(private reloadData: () => void) {

  }
  isFiltered(column: Column<any>) {
    return this.filterColumns.indexOf(column) >= 0;
  }
  filterColumn(column: Column<any>, clearFilter: boolean, forceEqual: boolean) {
    if (!column)
      return;
    if (clearFilter) {
      this.filterColumns.splice(this.filterColumns.indexOf(column, 1), 1);
      this.forceEqual.splice(this.forceEqual.indexOf(column, 1), 1);
    }
    else if (this.filterColumns.indexOf(column) < 0) {
      this.filterColumns.push(column);
      if (forceEqual)
        this.forceEqual.push(column);
    }
    this.reloadData();
  }
  addToFindOptions(opt: FindOptionsPerEntity<rowType>) {
    this.filterColumns.forEach(c => {

      let val = this.filterRow.__getColumn(c).value;
      let f: FilterBase = c.isEqualTo(val);
      if (c instanceof StringColumn) {
        let fe = this.forceEqual;
        if (fe.indexOf(c) < 0)
          f = c.isContains(val);
      }
      if (c instanceof DateTimeColumn) {
        if (val) {
          let v = DateTimeColumn.stringToDate(val);
          v = new Date(v.getFullYear(), v.getMonth(), v.getDate());

          f = c.isGreaterOrEqualTo(v).and(c.isLessThan((new Date(v.getFullYear(), v.getMonth(), v.getDate() + 1))));

        }
      }

      if (opt.where) {
        let x = opt.where;
        opt.where = r => new AndFilter(x(r), f);
      }
      else opt.where = r => f;
    });
  }
}



export type rowEvent<T> = (row: T, doInScope: ((what: (() => void)) => void)) => void;

export interface ColumnSetting<rowType> {

  caption?: string;
  readonly?: boolean;
  inputType?: string;
  designMode?: boolean;
  getValue?: (row: rowType) => any;
  hideDataOnInput?: boolean;
  cssClass?: (string | ((row: rowType) => string));
  defaultValue?: (row: rowType) => any;
  onUserChangedValue?: (row: rowType) => void;
  click?: rowEvent<rowType>;
  allowClick?: (row: rowType) => boolean;
  clickIcon?: string;
  dropDown?: DropDownOptions;
  column?: Column<any>;
  width?: string;
}



export interface FilteredColumnSetting<rowType> extends ColumnSetting<rowType> {
  _showFilter?: boolean;
}






function onSuccess(response: Response) {

  if (response.status >= 200 && response.status < 300)
    return response.json();
  else throw response;

}
function onError(error: any) {
  throw error;
}





export function isNewRow(r: Entity<any>) {
  if (r) {
    r.__entityData.isNewRow();
  }
  return false;
}










export class UrlBuilder {
  constructor(public url: string) {
  }
  add(key: string, value: any) {
    if (this.url.indexOf('?') >= 0)
      this.url += '&';
    else
      this.url += '?';
    this.url += encodeURIComponent(key) + '=' + encodeURIComponent(value);
  }
  addObject(object: any, suffix = '') {
    if (object != undefined)
      for (var key in object) {
        let val = object[key];
        if (val instanceof Column)
          val = val.value;
        this.add(key + suffix, val);
      }
  }
}

export class FilterConsumnerBridgeToUrlBuilder implements FilterConsumer {
  constructor(private url: UrlBuilder) {

  }

  public isEqualTo(col: Column<any>, val: any): void {
    this.url.add(col.jsonName, val);
  }

  public isDifferentFrom(col: Column<any>, val: any): void {
    this.url.add(col.jsonName + '_ne', val);
  }

  public isGreaterOrEqualTo(col: Column<any>, val: any): void {
    this.url.add(col.jsonName + '_gte', val);
  }

  public isGreaterThan(col: Column<any>, val: any): void {
    this.url.add(col.jsonName + '_gt', val);
  }

  public isLessOrEqualTo(col: Column<any>, val: any): void {
    this.url.add(col.jsonName + '_lte', val);
  }

  public isLessThan(col: Column<any>, val: any): void {
    this.url.add(col.jsonName + '_lt', val);
  }
  public isContains(col: StringColumn, val: any): void {
    this.url.add(col.jsonName + "_contains", val);
  }
  public isStartsWith(col: StringColumn, val: any): void {
    this.url.add(col.jsonName + "_st", val);
  }
}

export class lookupRowInfo<type> {
  found = false;
  loading = true;
  value: type = {} as type;
  promise: Promise<lookupRowInfo<type>>

}

export class DefaultStorage<dataType> implements ColumnStorage<dataType>{
  toDb(val: dataType) {
    return val;
  }
  fromDb(val: any): dataType {
    return val;
  }

}
export class DateTimeDateStorage implements ColumnStorage<string>{
  toDb(val: string) {

    return DateColumn.stringToDate(val);
  }
  fromDb(val: any): string {
    var d = val as Date;
    return DateColumn.dateToString(d);
  }

}
export class CharDateStorage implements ColumnStorage<string> {
  toDb(val: string) {
    return val.replace(/-/g, '');
  }
  fromDb(val: any): string {
    return val.substring(0, 4) + '-' + val.substring(4, 6) + '-' + val.substring(6, 8);
  }
}
export class DateTimeStorage implements ColumnStorage<string>{
  toDb(val: string) {
    return DateTimeColumn.stringToDate(val);
  }
  fromDb(val: any): string {
    var d = val as Date;
    return DateTimeColumn.dateToString(d);
  }

}
function addZeros(number: number, stringLength: number = 2) {
  let to = number.toString();
  while (to.length < stringLength)
    to = '0' + to;
  return to;
}



export class Filter implements FilterBase {
  constructor(private apply: (add: FilterConsumer) => void) {

  }
  and(filter: FilterBase): AndFilter {
    return new AndFilter(this, filter);
  }

  public __applyToConsumer(add: FilterConsumer): void {
    this.apply(add);
  }
}



export class AndFilter implements FilterBase {
  constructor(private a: FilterBase, private b: FilterBase) {

  }
  and(filter: FilterBase): AndFilter {
    return new AndFilter(this, filter);
  }

  public __applyToConsumer(add: FilterConsumer): void {
    if (this.a)
      this.a.__applyToConsumer(add);
    if (this.b)
      this.b.__applyToConsumer(add);
  }
}

export class ColumnHashSet {
  private _names: string[] = [];
  add(...columns: Column<any>[]) {
    if (columns)
      for (let c of columns)
        this._names.push(c.__getMemberName());
  }
  contains(column: Column<any>) {
    return this._names.indexOf(column.__getMemberName()) >= 0;
  }
}

export class CompoundIdColumn extends Column<string>
{
  private columns: Column<any>[];
  constructor(entity: Entity<string>, ...columns: Column<any>[]) {
    super();
    this.columns = columns;
  }
  __isVirtual() { return true; }
  isEqualTo(value: Column<string> | string): Filter {
    return new Filter(add => {
      let val = this.__getVal(value);
      let id = val.split(',');
      let result: FilterBase;
      this.columns.forEach((c, i) => {
        if (!result)
          result = c.isEqualTo(id[i]);
        else
          result = new AndFilter(result, c.isEqualTo(id[i]));
      });
      return result.__applyToConsumer(add);
    });
  }
  __addIdToPojo(p: any) {
    if (p.id)
      return;
    let r = "";
    this.columns.forEach(c => {
      if (r.length > 0)
        r += ',';
      r += p[c.jsonName];
    });
    p.id = r;

  }
  resultIdFilter(id: string, data: any) {
    return new Filter(add => {
      let idParts: any[] = [];
      if (id != undefined)
        idParts = id.split(',');
      let result: FilterBase;
      this.columns.forEach((c, i) => {
        let val = undefined;
        if (i < idParts.length)
          val = idParts[i];
        if (data[c.jsonName] != undefined)
          val = data[c.jsonName];
        if (!result)
          result = c.isEqualTo(val);
        else
          result = new AndFilter(result, c.isEqualTo(val));
      });
      return result.__applyToConsumer(add);
    });
  }
}



export class StringColumn extends Column<string>{
 
  isContains(value: StringColumn | string) {
    return new Filter(add => add.isContains(this, this.__getVal(value)));
  }
  isStartsWith(value: StringColumn | string) {
    return new Filter(add => add.isStartsWith(this, this.__getVal(value)));
  }
}
export class DateColumn extends Column<Date>{
  constructor(settingsOrCaption?: ColumnOptions<Date>) {
    super(settingsOrCaption);
    if (!this.inputType)
      this.inputType = 'date';
  }
  getDayOfWeek() {
    return new Date(this.value).getDay();
  }
  get displayValue() {
    if (!this.value)
      return '';
    return this.value.toLocaleDateString();
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
    let month = addZeros(d.getMonth() + 1),
      day = addZeros(d.getDate()),
      year = d.getFullYear();
    return [year, month, day].join('-');
  }

}
export class DateTimeColumn extends Column<Date>{
  constructor(settingsOrCaption?: ColumnOptions<Date>) {
    super(settingsOrCaption);
    if (!this.inputType)
      this.inputType = 'date';
  }
  getDayOfWeek() {
    return this.value.getDay();
  }
  get displayValue() {
    if (!this.value)
      return '';
    return this.value.toLocaleString();
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



export class NumberColumn extends Column<number>{
  constructor(settingsOrCaption?: NumberColumnOptions) {
    super(settingsOrCaption);
    if (!this.inputType)
      this.inputType = 'number';
    let s = settingsOrCaption as NumberColumnSettings;
    if (s && s.decimalDigits) {
      this.__numOfDecimalDigits = s.decimalDigits;
    }
  }
  __numOfDecimalDigits: number = 0;
  protected __processValue(value: number) {

    if (value != undefined && !(typeof value === "number"))
      return +value;
    return value;

  }
}
export interface NumberColumnSettings extends DataColumnSettings<number> {
  decimalDigits?: number;
}
export declare type NumberColumnOptions = NumberColumnSettings | string;
export class BoolColumn extends Column<boolean>{
  constructor(settingsOrCaption?: ColumnOptions<boolean>) {
    super(settingsOrCaption);
    if (!this.inputType)
      this.inputType = 'checkbox';
  }
  __defaultStorage() {
    return new BoolStorage();
  }
}

export class BoolStorage implements ColumnStorage<any>{
  toDb(val: any) {
    return val;
  }
  fromDb(val: any): any {
    if (isString(val))
      return val === "true";
    return val;
  }

}

export interface ClosedListItem {
  id: number;
  toString(): string;
}
export class ClosedListColumn<closedListType extends ClosedListItem> extends Column<closedListType> {
  constructor(private closedListType: any, settingsOrCaption?: ColumnOptions<closedListType>,settingsOrCaption1?: ColumnOptions<closedListType>) {
    super(settingsOrCaption,settingsOrCaption1);
  }
  getOptions(): DropDownItem[] {
    let result = [];
    for (let member in this.closedListType) {
      let s = this.closedListType[member] as closedListType;
      if (s && s.id != undefined) {
        result.push({
          id: s.id,
          caption: s.toString()
        })
      }
    }
    return result;
  }
  toRawValue(value: closedListType) {
    return value.id;
  }
  fromRawValue(value: any) {
    return this.byId(+value);
  }

  get displayValue() {
    if (this.value)
      return this.value.toString();
    return '';
  }
  byId(id: number): closedListType {
    for (let member in this.closedListType) {
      let s = this.closedListType[member] as closedListType;
      if (s && s.id == id)
        return s;
    }
    return undefined;
  }
}
export class ColumnCollection<rowType extends Entity<any>> {
  constructor(public currentRow: () => Entity<any>, private allowUpdate: () => boolean, public filterHelper: FilterHelper<rowType>, private showArea: () => boolean, private context?: Context) {

    if (this.allowDesignMode == undefined) {
      if (location.search)
        if (location.search.toLowerCase().indexOf('design=y') >= 0)
          this.allowDesignMode = true;
    }
  }
  __showArea() {
    return this.showArea();

  }
  __getColumn(map: ColumnSetting<any>, record: Entity<any>) {
    let result: Column<any>;
    if (record)
      result = record.__getColumn(map.column);
    if (!result)
      result = map.column;
    return result;
  }
  __dataControlStyle(map: ColumnSetting<any>): string {

    if (map.width && map.width.trim().length > 0) {
      if ((+map.width).toString() == map.width)
        return map.width + "px";
      return map.width;
    }
    return undefined;

  }
  private settingsByKey: any = {};

  allowDesignMode: boolean;
  async add(...columns: ColumnSetting<rowType>[]): Promise<void>;
  async add(...columns: string[]): Promise<void>;
  async add(...columns: any[]) {
    var promises: Promise<void>[] = [];
    for (let c of columns) {
      if (!c)
        continue;
      let s: ColumnSetting<rowType>;
      let x = c as ColumnSetting<rowType>;
      if (!x.column && c instanceof Column) {
        x = {
          column: c,
        }

      }
      if (x.column) {
        x.column.__decorateDataSettings(x);
      }

      if (x.getValue) {
        s = x;
      }

      else {
        promises.push(this.buildDropDown(x));
      }
      this.items.push(x);


    }
    await Promise.all(promises);
    return Promise.resolve();
  }
  async buildDropDown(s: ColumnSetting<any>) {
    if (s.dropDown) {
      let orig = s.dropDown.items;
      let result: DropDownItem[] = [];
      s.dropDown.items = result;

      if (orig instanceof Array) {
        for (let item of orig) {
          let type = typeof (item);
          if (type == "string" || type == "number")
            result.push({ id: item, caption: item });
          else {
            let x = item as DropDownItem;
            if (x && x.id != undefined) {
              result.push(x);
            }
          }
        }
      }
      else if (s.dropDown.source) {
        result.push(...(await s.dropDown.source.provideItems()));
      }
    }
    return Promise.resolve();
  }

  designMode = false;
  colListChanged() {
    this._lastNumOfColumnsInGrid = -1;
    this._colListChangeListeners.forEach(x => x());
  };
  _colListChangeListeners: (() => void)[] = [];
  onColListChange(action: (() => void)) {
    this._colListChangeListeners.push(action);
  }
  moveCol(col: ColumnSetting<any>, move: number) {
    let currentIndex = this.items.indexOf(col);
    let newIndex = currentIndex + move;
    if (newIndex < 0 || newIndex >= this.items.length)
      return;
    this.items.splice(currentIndex, 1);
    this.items.splice(newIndex, 0, col);
    this.colListChanged();


  }

  filterRows(col: FilteredColumnSetting<any>) {
    col._showFilter = false;
    this.filterHelper.filterColumn(col.column, false, (col.dropDown != undefined || col.click != undefined));
  }
  clearFilter(col: FilteredColumnSetting<any>) {
    col._showFilter = false;
    this.filterHelper.filterColumn(col.column, true, false);
  }
  _shouldShowFilterDialog(col: FilteredColumnSetting<any>) {
    return col && col._showFilter;
  }
  showFilterDialog(col: FilteredColumnSetting<any>) {
    col._showFilter = !col._showFilter;
  }
  deleteCol(col: ColumnSetting<any>) {
    this.items.splice(this.items.indexOf(col), 1);
    this.colListChanged();
  }
  addCol(col: ColumnSetting<any>) {
    this.items.splice(this.items.indexOf(col) + 1, 0, { designMode: true });
    this.colListChanged();
  }
  designColumn(col: ColumnSetting<any>) {
    col.designMode = !col.designMode;
  }

  _getEditable(col: ColumnSetting<any>) {
    if (!this.allowUpdate())
      return false;
    if (!col.column)
      return false
    return !col.readonly;
  }
  _click(col: ColumnSetting<any>, row: any) {
    col.click(row, what => {
      what();
    });
  }

  _getColDisplayValue(col: ColumnSetting<any>, row: rowType) {
    let r;
    if (col.getValue) {

      r = col.getValue(row)
      if (r instanceof Column)
        r = r.value;



    }
    else if (col.column) {
      if (col.dropDown && col.dropDown.items) {
        for (let x of col.dropDown.items) {
          if (x.id == this.__getColumn(col, row).value)
            return x.caption;
        }
      }
      r = this.__getColumn(col, row).displayValue;
    }


    return r;
  }
  _getColDataType(col: ColumnSetting<any>) {
    if (col.inputType)
      return col.inputType;
    return "text";
  }
  _getColumnClass(col: ColumnSetting<any>, row: any) {

    if (col.cssClass)
      if (isFunction(col.cssClass)) {
        let anyFunc: any = col.cssClass;
        return anyFunc(row);
      }
      else return col.cssClass;
    return '';

  }

  _getError(col: ColumnSetting<any>, r: Entity<any>) {
    if (!col.column)
      return undefined;
    return this.__getColumn(col, r).error;
  }
  autoGenerateColumnsBasedOnData(r: Entity<any>) {
    if (this.items.length == 0) {

      if (r) {
        this.add(...r.__iterateColumns());

      }
    }



  }
  __columnSettingsTypeScript() {
    let memberName = 'x';
    if (this.currentRow())
      memberName = this.currentRow().__getName();
    memberName = memberName[0].toLocaleLowerCase() + memberName.substring(1);
    let result = ''

    this.items.forEach(c => {
      if (result.length > 0)
        result += ',\n';

      result += '  ' + this.__columnTypeScriptDescription(c, memberName);

    });
    result = `columnSettings: ${memberName} => [\n` + result + "\n]";
    return result;
  }
  __columnTypeScriptDescription(c: ColumnSetting<any>, memberName: string) {
    let properties = "";
    function addToProperties(name: string, value: any) {
      if (properties.length > 0)
        properties += ', ';
      properties += "\n    " + name + ": " + value;
    }
    function addString(name: string, value: string) {
      addToProperties(name, "'" + value + "'");

    }
    let columnMember = '';
    if (c.column) {
      columnMember += memberName + "." + c.column.__getMemberName();
      if (c == c.column)
        columnMember += '/*equal*/';
      if (c.caption != c.column.caption) {
        addString('caption', c.caption)
      }

    } else {
      addString('caption', c.caption);
    }
    if (c.width && c.width.length > 0)
      addString('width', c.width);
    if (properties.length > 0) {
      if (columnMember != '') {
        properties = '\n    column: ' + columnMember + ', ' + properties;
      }
    }
    let whatToAdd = '';
    if (properties.length > 0)
      whatToAdd = "{" + properties + "\n  }";
    else if (columnMember != '')
      whatToAdd = columnMember;
    return whatToAdd;
  }
  __changeWidth(col: ColumnSetting<any>, what: number) {
    let width = col.width;
    if (!width)
      width = '50';
    width = ((+width) + what).toString();
    col.width = width;
  }
  _colValueChanged(col: ColumnSetting<any>, r: any) {

    if (col.onUserChangedValue)
      col.onUserChangedValue(r);

  }
  items: ColumnSetting<any>[] = [];
  private gridColumns: ColumnSetting<any>[];
  private nonGridColumns: ColumnSetting<any>[];
  numOfColumnsInGrid = 5;

  private _lastColumnCount: number;
  private _lastNumOfColumnsInGrid: number;
  private _initColumnsArrays() {
    if (this._lastColumnCount != this.items.length || this._lastNumOfColumnsInGrid != this.numOfColumnsInGrid) {
      this._lastNumOfColumnsInGrid = this.numOfColumnsInGrid;
      this._lastColumnCount = this.items.length;
      this.gridColumns = [];
      this.nonGridColumns = [];
      let i = 0;
      for (let c of this.items) {
        if (i++ < this._lastNumOfColumnsInGrid)
          this.gridColumns.push(c);
        else
          this.nonGridColumns.push(c);
      }
    }
  }
  getGridColumns() {
    this._initColumnsArrays();
    return this.gridColumns;
  }
  getNonGridColumns() {
    this._initColumnsArrays();
    return this.nonGridColumns;
  }
}
export function extractSortFromSettings<T extends Entity<any>>(entity: T, opt: FindOptionsPerEntity<T>): Sort {
  if (!opt)
    return undefined;
  if (!opt.orderBy)
    return undefined;
  let x = opt.orderBy(entity);
  return translateSort(x);

}
export function translateSort(sort: any): Sort {
  if (sort instanceof Sort)
    return sort;
  if (sort instanceof Column)
    return new Sort({ column: sort });
  if (sort instanceof Array) {
    let r = new Sort();
    sort.forEach(i => {
      if (i instanceof Column)
        r.Segments.push({ column: i });
      else r.Segments.push(i);
    });
    return r;
  }
}
export interface SQLCommand {
  addParameterToCommandAndReturnParameterName(col: Column<any>, val: any): string;
  query(sql: string): Promise<SQLQueryResult>;
}
export interface SQLQueryResult {
  rows: any[];
  getColumnIndex(name: string): number;
  getcolumnNameAtIndex(index: number): string;
}



export interface SQLConnectionProvider {
  createCommand(): SQLCommand;
}
export interface SupportsDirectSql {
  getDirectSql(): DirectSQL;
}

export class FilterConsumerBridgeToSqlRequest implements FilterConsumer {
  where = "";
  constructor(private r: SQLCommand) { }
  isEqualTo(col: Column<any>, val: any): void {
    this.add(col, val, "=");
  }
  isDifferentFrom(col: Column<any>, val: any): void {
    this.add(col, val, "<>");
  }
  isGreaterOrEqualTo(col: Column<any>, val: any): void {
    this.add(col, val, ">=");
  }
  isGreaterThan(col: Column<any>, val: any): void {
    this.add(col, val, ">");
  }
  isLessOrEqualTo(col: Column<any>, val: any): void {
    this.add(col, val, "<=");
  }
  isLessThan(col: Column<any>, val: any): void {
    this.add(col, val, "<");
  }
  public isContains(col: StringColumn, val: any): void {
    this.add(col, '%' + val + '%', 'like');
  }
  public isStartsWith(col: StringColumn, val: any): void {
    this.add(col, val + '%', 'like');
  }
  private add(col: Column<any>, val: any, operator: string) {
    if (this.where.length == 0) {

      this.where += ' where ';
    } else this.where += ' and ';
    this.where += col.__getDbName() + ' ' + operator + ' ' + this.r.addParameterToCommandAndReturnParameterName(col, val);

  }





}