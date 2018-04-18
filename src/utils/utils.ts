


import { makeTitle, isFunction } from './common';

import {
  DataColumnSettings, FilterBase, ColumnValueProvider, FindOptions, FindOptionsPerEntity, RowEvents, DataProvider, DataProviderFactory, FilterConsumer
  , ColumnStorage,
  EntitySourceFindOptions
} from './dataInterfaces1';
import { unescapeIdentifier } from '@angular/compiler';







export interface dataAreaSettings {
  columns: ColumnCollection<any>;
}







declare var $: any;
export class SelectPopup<rowType extends Entity<any>> {
  constructor(
    private modalList: GridSettings<rowType>, settings?: SelectPopupSettings) {
    this.modalId = makeid();
    if (settings) {
      if (settings.title)
        this.title = settings.title;
      if (settings.searchColumn)
        this.searchColumn = settings.searchColumn;
    }
    if (!this.title)
      this.title = "Select " + modalList.caption;
  }
  title: string;
  private search() {
    this.modalList.get({ where: x => this.searchColumn.isEqualTo(this.searchText + "*") });

  }
  searchText: string;
  private searchColumn: Column<any>;

  modalId: string = "myModal";
  private onSelect: (selected: rowType) => void;
  modalSelect() {
    this.onSelect(this.modalList.currentRow);
    $("#" + this.modalId).modal('hide');
  }
  show(onSelect: (selected: rowType) => void) {
    if (!this.searchColumn) {
      for (let col of this.modalList.columns.items) {
        if (col.column && col.column.jsonName != "id" && (!col.inputType || col.inputType == "text")) {
          this.searchColumn = col.column;
          break;
        }
      }
    }
    this.onSelect = onSelect;
    $("#" + this.modalId).modal('show');
  }
  searchColumnCaption() {
    /*for (let item of this.modalList.columns.items) {
      if (item.key == this.searchColumn)
        return item.caption;
    }*/
    if (this.searchColumn)
      return this.searchColumn.caption;
    return "";
  }
}
export interface SelectPopupSettings {
  title?: string;
  searchColumn?: Column<any>;
}

function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}





export interface DropDownOptions {

  items?: DropDownItem[] | string[] | any[];
  source?: Entity<any>;
  idColumn?: Column<any>;
  captionColumn?: Column<any>;
}

export interface DropDownItem {
  id?: any;
  caption?: any;
}








export interface IDataAreaSettings<rowType> {
  columnSettings?: (rowType: rowType) => ColumnSetting<rowType>[];
  numberOfColumnAreas?: number;
  labelWidth?: number;
}

export class DataAreaSettings<rowType extends Entity<any>>
{

  constructor(public settings?: IDataAreaSettings<rowType>, public columns?: ColumnCollection<rowType>, entity?: rowType) {
    if (columns == undefined) {
      columns = new ColumnCollection<rowType>(() => undefined, () => true, undefined);
      columns.numOfColumnsInGrid = 0;
      this.columns = columns;

    }
    if (settings && settings.columnSettings)
      columns.add(...settings.columnSettings(entity));

  }
}





export class GridSettings<rowType extends Entity<any>>  {
  constructor(private entity?: rowType, settings?: IDataSettings<rowType>) {
    this.restList = new DataList<rowType>(entity);
    if (entity)
      this.filterHelper.filterRow = entity.source.createNewItem();

    this.columns = new ColumnCollection<rowType>(() => this.currentRow, () => this.allowUpdate, this.filterHelper)

    this.restList._rowReplacedListeners.push((old, curr) => {
      if (old == this.currentRow)
        this.setCurrentRow(curr);
    });

    if (settings) {

      if (settings.columnSettings)
        this.columns.add(...settings.columnSettings(entity));

      if (settings.allowUpdate)
        this.allowUpdate = true;
      if (settings.allowDelete)
        this.allowDelete = true;
      if (settings.allowInsert)
        this.allowInsert = true;
      if (settings.hideDataArea)
        this.hideDataArea = settings.hideDataArea;
      if (settings.numOfColumnsInGrid != undefined)
        this.columns.numOfColumnsInGrid = settings.numOfColumnsInGrid;

      if (settings.rowButtons)
        this._buttons = settings.rowButtons;


      if (settings.rowCssClass)
        this.rowClass = settings.rowCssClass;
      if (settings.onSavingRow)
        this.onSavingRow = settings.onSavingRow;
      if (settings.onEnterRow)
        this.onEnterRow = settings.onEnterRow;
      if (settings.onNewRow)
        this.onNewRow = settings.onNewRow;
      if (settings.onValidate)
        this.onValidate = settings.onValidate;
      if (settings.caption)
        this.caption = settings.caption;
      if (!this.caption && entity) {
        this.caption = entity.source.createNewItem().__getCaption();
      }
      this.setGetOptions(settings.get);

    }

    this.popupSettings = new SelectPopup(this);
  }
  private setGetOptions(get: FindOptionsPerEntity<rowType>) {
    this.getOptions = get;
    this._currentOrderBy = undefined;
    if (this.getOptions && this.getOptions.orderBy)
      this._currentOrderBy = extractSortFromSettings(this.entity, this.getOptions);

  }

  popupSettings: SelectPopup<rowType>;
  showSelectPopup(onSelect: (selected: rowType) => void) {


    this.popupSettings.show(onSelect);
  }


  static getRecords(): any {
    throw new Error("Method not implemented.");
  }
  addNewRow() {
    let r: any = this.restList.add();
    this.columns.items.forEach(item => {
      if (item.defaultValue) {
        let result = item.defaultValue(r);
        if (result != undefined) {
          //r[item.key] = result;
        }

      }
    });
    if (this.onNewRow)
      this.onNewRow(r);
    this.setCurrentRow(r);
  }

  noam: string;

  addArea(settings: IDataAreaSettings<rowType>) {
    let col = new ColumnCollection<rowType>(() => this.currentRow, () => this.allowUpdate, this.filterHelper);
    col.numOfColumnsInGrid = 0;

    return new DataAreaSettings<rowType>(settings, col, this.entity);
  }
  currentRow: rowType;
  setCurrentRow(row: rowType) {
    this.currentRow = row;
    if (this.onEnterRow && row) {

      this.onEnterRow(row);
    }

  }
  nextRow() {
    if (!this.currentRow && this.items.length > 0)
      this.setCurrentRow(this.items[0]);
    if (this.currentRow) {
      let currentRowPosition = this.items.indexOf(this.currentRow);
      if (currentRowPosition < this.items.length - 1)
        this.setCurrentRow(this.items[currentRowPosition + 1]);
      else
        this.nextPage().then(() => {
          if (this.items.length > 0)
            this.setCurrentRow(this.items[0]);
        });
    }
  }
  previousRowAllowed() {
    return this.currentRow && this.items.indexOf(this.currentRow) > 0 || this.page > 1;
  }
  previousRow() {
    if (!this.previousRowAllowed())
      return;

    let currentRowPosition = this.items.indexOf(this.currentRow);
    if (currentRowPosition > 0)
      this.setCurrentRow(this.items[currentRowPosition - 1]);
    else {
      if (this.page > 1)
        this.previousPage().then(() => {
          if (this.items.length > 0)
            this.setCurrentRow(this.items[this.items.length - 1]);
        });
    }

  }
  deleteCurentRow() {
    if (!this.deleteCurrentRowAllowed)
      return;
    this.currentRowAsRestListItemRow().delete();
  }
  currentRowAsRestListItemRow() {
    if (!this.currentRow)
      return undefined;
    return <any>this.currentRow;
  }
  cancelCurrentRowChanges() {
    if (this.currentRowAsRestListItemRow() && this.currentRowAsRestListItemRow().reset)
      this.currentRowAsRestListItemRow().reset();
  }
  deleteCurrentRowAllowed() {
    return this.currentRowAsRestListItemRow() && this.currentRowAsRestListItemRow().delete && this.allowDelete && !isNewRow(this.currentRow);
  }
  currentRowChanged() {
    return this.currentRowAsRestListItemRow() && this.currentRowAsRestListItemRow().__wasChanged && this.currentRowAsRestListItemRow().__wasChanged();
  }
  saveCurrentRow() {
    if (this.currentRowAsRestListItemRow() && this.currentRowAsRestListItemRow().save)
      this.currentRowAsRestListItemRow().save();
  }

  allowUpdate = false;
  allowInsert = false;
  allowDelete = false;
  hideDataArea = false;


  _buttons: RowButton<Entity<any>>[] = [];

  rowClass?: (row: any) => string;
  onSavingRow?: (row: any) => Promise<any> | any;
  onValidate?: (row: rowType) => Promise<any> | any;
  onEnterRow: (row: rowType) => void;
  onNewRow: (row: rowType) => void;
  _doSavingRow(s: rowType) {
    return s.save(this.onValidate, this.onSavingRow);

  }
  caption: string;

  private filterHelper = new FilterHelper<rowType>(() => {
    this.page = 1;
    this.getRecords();
  });

  columns: ColumnCollection<rowType>;




  page = 1;
  nextPage() {
    this.page++;
    return this.getRecords();
  }
  previousPage() {
    if (this.page <= 1)
      return;
    this.page--;
    return this.getRecords();
  }
  get(options: FindOptionsPerEntity<rowType>) {

    this.setGetOptions(options);
    this.page = 1;
    return this.getRecords();

  }

  _currentOrderBy: Sort;
  sort(column: Column<any>) {

    let done = false;
    if (this._currentOrderBy && this._currentOrderBy.Segments.length > 0) {
      if (this._currentOrderBy.Segments[0].column == column) {
        this._currentOrderBy.Segments[0].descending = !this._currentOrderBy.Segments[0].descending;
        done = true;
      }
    } if (!done)
      this._currentOrderBy = new Sort({ column: column });
    this.getRecords();
  }
  sortedAscending(column: Column<any>) {
    if (!this._currentOrderBy)
      return false;
    if (!column)
      return false;
    return this._currentOrderBy.Segments.length > 0 &&
      this._currentOrderBy.Segments[0].column == column &&
      !this._currentOrderBy.Segments[0].descending;
  }
  sortedDescending(column: Column<any>) {
    if (!this._currentOrderBy)
      return false;
    if (!column)
      return false;
    return this._currentOrderBy.Segments.length > 0 &&
      this._currentOrderBy.Segments[0].column == column &&
      !!this._currentOrderBy.Segments[0].descending;
  }



  private getOptions: FindOptionsPerEntity<rowType>;



  getRecords() {

    let opt: FindOptionsPerEntity<rowType> = {};
    if (this.getOptions) {
      opt = Object.assign(opt, this.getOptions);
    }
    if (this._currentOrderBy)
      opt.orderBy = r => this._currentOrderBy;
    if (!opt.limit)
      opt.limit = 7;
    if (this.page > 1)
      opt.page = this.page;
    this.filterHelper.addToFindOptions(opt);

    return this.restList.get(opt).then(() => {


      if (this.restList.items.length == 0)
        this.setCurrentRow(undefined);
      else {


        this.setCurrentRow(this.restList.items[0]);
        this.columns.autoGenerateColumnsBasedOnData();
      }
      return this.restList;
    });
  };



  private restList: DataList<rowType>;
  get items(): rowType[] {
    if (this.restList)
      return this.restList.items;
    return undefined;
  }





}

export class FilterHelper<rowType extends Entity<any>> {
  filterRow: rowType;
  filterColumns: Column<any>[] = [];
  constructor(private reloadData: () => void) {

  }
  isFiltered(column: Column<any>) {
    return this.filterColumns.indexOf(column) >= 0;
  }
  filterColumn(column: Column<any>, clearFilter: boolean) {
    if (!column)
      return;
    if (clearFilter)
      this.filterColumns.splice(this.filterColumns.indexOf(column, 1));
    else if (this.filterColumns.indexOf(column) < 0)
      this.filterColumns.push(column);
    this.reloadData();
  }
  addToFindOptions(opt: FindOptionsPerEntity<rowType>) {
    this.filterColumns.forEach(c => {
      if (opt.where) {
        let x = opt.where;
        opt.where = r => new AndFilter(x(r), c.isEqualTo(this.filterRow.__getColumn(c).value));

      }
      else opt.where = r => c.isEqualTo(this.filterRow.__getColumn(c).value);
    });
  }
}
export interface IDataSettings<rowType extends Entity<any>> {
  allowUpdate?: boolean,
  allowInsert?: boolean,
  allowDelete?: boolean,
  hideDataArea?: boolean,

  columnSettings?: (row: rowType) => ColumnSetting<rowType>[],
  areas?: { [areaKey: string]: ColumnSetting<any>[] },

  rowCssClass?: (row: rowType) => string;
  rowButtons?: RowButton<rowType>[],
  get?: FindOptionsPerEntity<rowType>,
  onSavingRow?: (r: rowType) => void;
  onValidate?: (r: rowType) => void;
  onEnterRow?: (r: rowType) => void;
  onNewRow?: (r: rowType) => void;
  numOfColumnsInGrid?: number;
  caption?: string;

}


export type rowEvent<T> = (row: T, doInScope: ((what: (() => void)) => void)) => void;

export interface ColumnSetting<rowType> {

  caption?: string;
  readonly?: boolean;
  inputType?: string;
  designMode?: boolean;
  getValue?: (row: rowType) => any;
  cssClass?: (string | ((row: rowType) => string));
  defaultValue?: (row: rowType) => any;
  onUserChangedValue?: (row: rowType) => void;
  click?: rowEvent<rowType>;
  dropDown?: DropDownOptions;
  column?: Column<any>;
  width?: string;
}



export interface FilteredColumnSetting<rowType> extends ColumnSetting<rowType> {
  _showFilter?: boolean;
}

export interface RowButton<rowType extends Entity<any>> {
  name?: string;
  visible?: (r: rowType) => boolean;
  click?: (r: rowType) => void;
  cssClass?: (string | ((row: rowType) => string));

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








interface hasIndex {
  [key: string]: any;
}
function applyWhereToGet(where: FilterBase[] | FilterBase, options: FindOptions) {
  where = options.where;

}



export class DataList<T extends Entity<any>> implements Iterable<T>{
  [Symbol.iterator](): Iterator<T> {
    return this.items[Symbol.iterator]();
  }


  items: T[] = [];
  constructor(private entity: T) {

  }
  translateOptions(options: FindOptionsPerEntity<T>) {
    if (!options)
      return undefined;
    let getOptions: EntitySourceFindOptions = {};
    if (options.where)
      getOptions.where = options.where(this.entity);
    if (options.orderBy)
      getOptions.orderBy = extractSortFromSettings(this.entity, options);
    if (options.limit)
      getOptions.limit = options.limit;
    if (options.page)
      getOptions.page = options.page;
    if (options.additionalUrlParameters)
      getOptions.additionalUrlParameters = options.additionalUrlParameters;
    return getOptions;
  }
  _rowReplacedListeners: ((oldRow: T, newRow: T) => void)[] = [];

  private map(item: T): T {

    item.__entityData.register({
      rowReset: (newRow) => {
        if (newRow)
          this.items.splice(this.items.indexOf(item), 1);

      },
      rowDeleted: () => { this.items.splice(this.items.indexOf(item), 1) }
    });
    return item;
  }
  lastGetId = 0;
  get(options?: FindOptionsPerEntity<T>) {

    let getId = ++this.lastGetId;

    return this.entity.source.find(this.translateOptions(options)).then(r => {
      let x: T[] = r;
      let result = r.map((x: any) => this.map(x));
      if (getId == this.lastGetId)
        this.items = result;
      return result;
    });
  }
  add(): T {
    let x = this.map(this.entity.source.createNewItem());
    this.items.push(x);
    return x;
  }
  private replaceRow(originalRow: any, newRow: any) {
    newRow = this.map(newRow);
    this.items[this.items.indexOf(originalRow)] = newRow;
    this._rowReplacedListeners.forEach(x => x(originalRow, newRow));
  }
}


export class Sort {
  constructor(...segments: SortSegment[]) {

    this.Segments = segments;
  }
  Segments: SortSegment[];
}
export interface SortSegment {
  column: Column<any>,
  descending?: boolean
}

export class Lookup<lookupIdType, entityType extends Entity<lookupIdType>> {

  constructor(private entity: entityType) {
    this.restList = new DataList<entityType>(entity);

  }

  private restList: DataList<entityType>;
  private cache: any = {};

  get(filter: Column<lookupIdType> | ((entityType: entityType) => FilterBase)): entityType {
    return this.getInternal(filter).value;
  }
  found(filter: Column<lookupIdType> | ((entityType: entityType) => FilterBase)): boolean {
    return this.getInternal(filter).found;
  }

  private getInternal(filter: Column<lookupIdType> | ((entityType: entityType) => FilterBase)): lookupRowInfo<entityType> {
    let find: FindOptionsPerEntity<entityType> = {};
    if (filter instanceof Column)
      find.where = (e) => e.__idColumn.isEqualTo(filter);
    else if (isFunction(filter)) {
      find.where = e => filter(e);
    }


    return this._internalGetByOptions(find);
  }

  _internalGetByOptions(find: FindOptionsPerEntity<entityType>): lookupRowInfo<entityType> {

    let key = "";
    let url = new UrlBuilder("");
    if (find.where)
      find.where(this.entity).__applyToConsumer(new FilterConsumnerBridgeToUrlBuilder(url));
    key = url.url;

    if (this.cache == undefined)
      this.cache = {};
    if (this.cache[key]) {
      return this.cache[key];
    } else {
      let res = new lookupRowInfo<entityType>();
      this.cache[key] = res;

      if (find == undefined || key == undefined) {
        res.loading = false;
        res.found = false;
        return res;
      } else {
        res.value = this.entity.source.createNewItem();
        res.promise = this.restList.get(find).then(r => {
          res.loading = false;
          if (r.length > 0) {
            res.value = r[0];
            res.found = true;
          }
          return res;
        });
      }
      return res;
    }
  }

  whenGet(filter: Column<lookupIdType> | ((entityType: entityType) => FilterBase)) {
    return this.getInternal(filter).promise.then(r => r.value);
  }
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

  public IsEqualTo(col: Column<any>, val: any): void {
    this.url.add(col.jsonName, val);
  }

  public IsDifferentFrom(col: Column<any>, val: any): void {
    this.url.add(col.jsonName + '_ne', val);
  }

  public IsGreaterOrEqualTo(col: Column<any>, val: any): void {
    this.url.add(col.jsonName + '_gte', val);
  }

  public IsGreaterThan(col: Column<any>, val: any): void {
    this.url.add(col.jsonName + '_gt', val);
  }

  public IsLessOrEqualTo(col: Column<any>, val: any): void {
    this.url.add(col.jsonName + '_lte', val);
  }

  public IsLessThan(col: Column<any>, val: any): void {
    this.url.add(col.jsonName + '_lt', val);
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

    return new Date(+val.substring(0, 4), +val.substring(5, 7), +val.substring(8, 10));
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
export class Column<dataType>  {
  async __calcVirtuals() {
    if (this.__settings && this.__settings.virtualData) {
      let x = this.__settings.virtualData();
      if (x instanceof Promise)
        x = await x;
      this.value = x;

    }
  }
  __isVirtual() {
    if (this.__settings && this.__settings.virtualData)
      return true;
    return false;

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
  dbName: string;
  private __settings: DataColumnSettings<dataType, Column<dataType>>;
  __getMemberName() { return this.jsonName; }
  constructor(settingsOrCaption?: DataColumnSettings<dataType, Column<dataType>> | string) {
    if (settingsOrCaption) {
      if (typeof (settingsOrCaption) === "string") {
        this.caption = settingsOrCaption;
        this.__settings = { caption: settingsOrCaption };
      } else {
        this.__settings = settingsOrCaption;
        if (settingsOrCaption.jsonName)
          this.jsonName = settingsOrCaption.jsonName;
        if (settingsOrCaption.caption)
          this.caption = settingsOrCaption.caption;
        if (settingsOrCaption.readonly)
          this.readonly = settingsOrCaption.readonly;
        if (settingsOrCaption.inputType)
          this.inputType = settingsOrCaption.inputType;
        if (settingsOrCaption.dbName)
          this.dbName = settingsOrCaption.dbName;
        if (settingsOrCaption.value != undefined)
          this.value = settingsOrCaption.value;
        if (settingsOrCaption.valueChange)
          this.onValueChange = () => this.__settings.valueChange(this.value);
        if (settingsOrCaption.onValidate)
          this.onValidate = () => settingsOrCaption.onValidate(this);
      }


    }



  }
  __decorateDataSettings(x: ColumnSetting<any>) {
    if (!x.caption && this.caption)
      x.caption = this.caption;
    if (x.readonly == undefined)
      x.readonly = this.readonly;
    if (x.inputType == undefined)
      x.inputType = this.inputType;
    if (x.getValue == undefined) {
      if (this.__settings && this.__settings.getValue)
        x.getValue = e => {
          let c: Column<dataType> = this;
          if (e)
            c = e.__getColumn(c) as Column<dataType>;
          return c.__settings.getValue(c.value);
        };
    }
  }


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
  __getDbName() {
    if (this.dbName)
      return this.dbName;
    return this.jsonName;
  }
  readonly: boolean;
  inputType: string;
  isEqualTo(value: Column<dataType> | dataType) {
    return new Filter(add => add.IsEqualTo(this, this.__getVal(value)));
  }
  IsDifferentFrom(value: Column<dataType> | dataType) {
    return new Filter(add => add.IsDifferentFrom(this, this.__getVal(value)));
  }
  IsGreaterOrEqualTo(value: Column<dataType> | dataType) {
    return new Filter(add => add.IsGreaterOrEqualTo(this, this.__getVal(value)));
  }
  IsGreaterThan(value: Column<dataType> | dataType) {
    return new Filter(add => add.IsGreaterThan(this, this.__getVal(value)));
  }
  IsLessOrEqualTo(value: Column<dataType> | dataType) {
    return new Filter(add => add.IsLessOrEqualTo(this, this.__getVal(value)));
  }
  IsLessThan(value: Column<dataType> | dataType) {
    return new Filter(add => add.IsLessThan(this, this.__getVal(value)));
  }
  __getVal(value: Column<dataType> | dataType): dataType {


    if (value instanceof Column)
      return value.value;
    else
      return value;
  }
  __valueProvider: ColumnValueProvider = new dummyColumnStorage();
  get value() {
    return this.__valueProvider.getValue(this.jsonName);
  }
  get originalValue() {
    return this.__valueProvider.getOriginalValue(this.jsonName);
  }
  get displayValue() {
    if (this.value)
      return this.value.toString();
    return '';
  }
  protected __processValue(value: dataType) {
    return value;

  }
  set value(value: dataType) {
    this.__valueProvider.setValue(this.jsonName, this.__processValue(value));
    this.error = undefined;
    if (this.onValueChange)
      this.onValueChange();
  }
  __addToPojo(pojo: any) {
    pojo[this.jsonName] = this.value;
  }
  __loadFromToPojo(pojo: any) {
    let x = pojo[this.jsonName];
    if (x)
      this.value = x;
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


export class Filter implements FilterBase {
  constructor(private apply: (add: FilterConsumer) => void) {

  }
  and(filter: FilterBase): FilterBase {
    return new AndFilter(this, filter);
  }

  public __applyToConsumer(add: FilterConsumer): void {
    this.apply(add);
  }
}



export class AndFilter implements FilterBase {
  constructor(private a: FilterBase, private b: FilterBase) {

  }


  public __applyToConsumer(add: FilterConsumer): void {
    this.a.__applyToConsumer(add);
    this.b.__applyToConsumer(add);
  }
}
export interface EntityOptions {
  name?: string;
  dbName?: string;
  caption?: string;
  onSavingRow?: (e: Entity<any>) => Promise<any> | any;
  onValidate?: (e: Entity<any>) => Promise<any> | any;
}
export class Entity<idType> {
  constructor(private factory: () => Entity<idType>, source: DataProviderFactory, options?: EntityOptions | string) {
    if (options) {
      if (typeof (options) === "string") {
        this.__options = { name: options };
      } else {
        this.__options = options;
        if (options.onSavingRow)
          this.onSavingRow = () => options.onSavingRow(this);
        if (options.onValidate)
          this.onValidate = () => options.onValidate(this);
      }

    }
    this.__entityData = new __EntityValueProvider(() => this.source.__getDataProvider());
    this.setSource(source);
  }
  __options: EntityOptions;


  __getName() {
    if (!this.__options) {
      this.__options = {};
    }
    if (!this.__options.name) {
      this.__options.name = this.constructor.name;
    }
    return this.__options.name;
  }
  __getDbName() {
    if (!this.__options)
      this.__options = {};
    if (!this.__options.dbName)
      this.__options.dbName = this.__getName();
    return this.__options.dbName;
  }
  __getCaption() {
    if (!this.__options) {
      this.__options = {};
    }
    if (!this.__options.caption) {
      this.__options.caption = makeTitle(this.__getName());
    }
    return this.__options.caption;
  }
  /** @internal */
  __entityData: __EntityValueProvider;

  protected onSavingRow: () => void | Promise<void> = () => { };
  protected onValidate: () => void | Promise<void> = () => { };

  error: string;
  __idColumn: Column<idType>;
  protected initColumns(idColumn?: Column<idType>) {
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


        this.applyColumn(y);
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

  setSource(dp: DataProviderFactory) {
    this.source = new EntitySource<this>(this.__getName(), () => <this>this.factory(), dp);
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

    if (this.onValidate)
      this.onValidate();
    if (validate)
      validate(this);
    this.__assertValidity();


    let performEntitySave = () => {
      let x = this.onSavingRow();

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
  catchSaveErrors(e: any): any {

    if (e instanceof Promise) {
      return e.then(x => this.catchSaveErrors(x));
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
    throw e;

  }

  delete() {
    return this.__entityData.delete().catch(e => this.catchSaveErrors(e));

  }
  reset() {
    this.__entityData.reset();
    this.__clearErrors();
  }
  private __clearErrors() {
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

  source: EntitySource<this>;
  private applyColumn(y: Column<any>) {
    if (!y.caption)
      y.caption = makeTitle(y.jsonName);
    y.__valueProvider = this.__entityData;
    if (this.__columns.indexOf(y) < 0)
      this.__columns.push(y);
  }
  private __columns: Column<any>[] = [];
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

  lookup<lookupIdType, entityType extends Entity<lookupIdType>>(lookupEntity: entityType, filter: Column<lookupIdType> | ((entityType: entityType) => FilterBase)): entityType {

    let key = lookupEntity.constructor.name;
    let lookup: Lookup<lookupIdType, entityType>;
    this.source.__lookupCache.forEach(l => {
      if (l.key == key)
        lookup = l.lookup;
    });
    if (!lookup) {
      lookup = new Lookup(lookupEntity);
      this.source.__lookupCache.push({ key, lookup });
    }
    return lookup.get(filter);

  }
  lookupAsync<lookupIdType, entityType extends Entity<lookupIdType>>(lookupEntity: entityType, filter: Column<lookupIdType> | ((entityType: entityType) => FilterBase)): Promise<entityType> {

    let key = lookupEntity.constructor.name;
    let lookup: Lookup<lookupIdType, entityType>;
    this.source.__lookupCache.forEach(l => {
      if (l.key == key)
        lookup = l.lookup;
    });
    if (!lookup) {
      lookup = new Lookup(lookupEntity);
      this.source.__lookupCache.push({ key, lookup });
    }
    return lookup.whenGet(filter);

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
export interface LookupCache<T extends Entity<any>> {
  key: string;
  lookup: Lookup<any, T>;
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




export class EntitySource<T extends Entity<any>>
{
  private _provider: DataProvider;
  constructor(name: string, private factory: () => T, dataProvider: DataProviderFactory) {
    this._provider = dataProvider.provideFor(name, factory);
  }
  find(options?: EntitySourceFindOptions): Promise<T[]> {
    if (options)
      options.orderBy = translateSort(options.orderBy);
    return this._provider.find(<FindOptions>options)
      .then(arr => {
        return arr.map(i => {
          let r = this.factory();

          r.__entityData.setData(i, r);
          r.source = this;
          return r;
        })
      });
  }
  __lookupCache: LookupCache<any>[] = [];

  async max(col: NumberColumn, filter?: FilterBase): Promise<number> {
    let x = await this.find({ where: filter, limit: 1, orderBy: new Sort({ column: col, descending: true }) });

    if (x.length == 0) {
      return 0;
    }
    return x[0].__getColumn(col).value;
  }


  __getDataProvider() {
    return this._provider;
  }

  createNewItem(): T {
    let r = this.factory();
    r.source = this;
    return r;
  }

  async Insert(doOnRow: (item: T) => Promise<void> | void): Promise<T> {
    var i = this.createNewItem();
    let x = doOnRow(i);
    if (x instanceof Promise)
      await x;
    await i.save();
    return i;
  }
}

export class __EntityValueProvider implements ColumnValueProvider {
  listeners: RowEvents[] = [];
  register(listener: RowEvents) {
    this.listeners.push(listener);
  }
  delete() {
    return this.getDataProvider().delete(this.id).then(() => {
      this.listeners.forEach(x => {
        if (x.rowDeleted)
          x.rowDeleted();
      });
    });
  }
  constructor(private getDataProvider: () => DataProvider) {

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
      return this.getDataProvider().insert(d).then((newData: any) => {
        this.setData(newData, e);
        this.listeners.forEach(x => {
          if (x.rowSaved)
            x.rowSaved(true);
        });
      });
    } else {
      return this.getDataProvider().update(this.id, d).then((newData: any) => {
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
export class StringColumn extends Column<string>{
  constructor(settingsOrCaption?: DataColumnSettings<string, StringColumn> | string) {
    super(settingsOrCaption);
  }
}
export class DateColumn extends Column<string>{
  constructor(settingsOrCaption?: DataColumnSettings<string, DateColumn> | string) {
    super(settingsOrCaption);
    if (!this.inputType)
      this.inputType = 'date';
  }
  getDayOfWeek() {
    return new Date(this.value).getDay();
  }
  get displayValue() {
    if (!this.value || this.value == '' || this.value == '0000-00-00')
      return '';
    return new Date(this.value).toLocaleDateString();
  }
  __defaultStorage() {
    return new DateTimeDateStorage();
  }
  get dateValue() {
    return DateColumn.stringToDate(this.value);
  }
  set dateValue(val: Date) {
    this.value = DateColumn.dateToString(val);
  }
  static stringToDate(val: string) {

    return new Date(val);
  }
  static dateToString(val: Date): string {
    var d = val as Date;
    let month = addZeros(d.getMonth() + 1),
      day = addZeros(d.getDate()),
      year = d.getFullYear();
    return [year, month, day].join('-');
  }

}
export class DateTimeColumn extends Column<string>{
  constructor(settingsOrCaption?: DataColumnSettings<string, DateTimeColumn> | string) {
    super(settingsOrCaption);
    if (!this.inputType)
      this.inputType = 'date';
  }
  getDayOfWeek() {
    return new Date(this.value).getDay();
  }
  get displayValue() {
    if (!this.value || this.value.trim() == '' || this.value.startsWith('0000-00-00'))
      return '';
    return new Date(this.value).toLocaleString();
  }
  __defaultStorage() {
    return new DateTimeStorage();
  }
  get dateValue() {
    return DateTimeColumn.stringToDate(this.value);
  }
  set dateValue(val: Date) {
    this.value = DateTimeColumn.dateToString(val);
  }
  static stringToDate(val: string) {

    return new Date(val);
  }
  static dateToString(val: Date): string {
    var d = val as Date;
    let
      hours = addZeros(d.getHours()),
      minutes = addZeros(d.getMinutes()),
      seconds = addZeros(d.getSeconds()),
      ms = addZeros(d.getMilliseconds(), 3)
      ;



    return DateColumn.dateToString(d) + ' ' + [hours, minutes, seconds].join(':') + '.' + ms;
  }


}
export class NumberColumn extends Column<number>{
  constructor(settingsOrCaption?: DataColumnSettings<number, NumberColumn> | string) {
    super(settingsOrCaption);
    if (!this.inputType)
      this.inputType = 'number';
  }
  protected __processValue(value: number) {

    if (value != undefined && !(typeof value === "number"))
      return +value;
    return value;

  }
}
export class BoolColumn extends Column<boolean>{
  constructor(settingsOrCaption?: DataColumnSettings<boolean, BoolColumn> | string) {
    super(settingsOrCaption);
    if (!this.inputType)
      this.inputType = 'checkbox';
  }
}
export class ColumnCollection<rowType extends Entity<any>> {
  constructor(public currentRow: () => Entity<any>, private allowUpdate: () => boolean, public filterHelper: FilterHelper<rowType>) {

    if (this.allowDesignMode == undefined) {
      if (location.search)
        if (location.search.toLowerCase().indexOf('design=y') >= 0)
          this.allowDesignMode = true;
    }
  }
  __showArea() {
    return true;
    //return this.currentRow();

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
      let populateBasedOnArray = (arr: Array<any>) => {
        for (let item of arr) {
          let type = typeof (item);
          if (type == "string" || type == "number")
            result.push({ id: item, caption: item });
          else if (item instanceof Entity) {
            let col: Column<any>;
            if (!s.dropDown.idColumn) {
              if (col = item.__getColumnByJsonName('id'))
                s.dropDown.idColumn = col;
              else {
                for (let colInEntity of item.__iterateColumns()) {
                  s.dropDown.idColumn = colInEntity;
                  break;
                }
              }
            }
            if (!s.dropDown.captionColumn) {
              if (col = item.__getColumnByJsonName('caption'))
                s.dropDown.captionColumn = col;
              else {
                for (let keyInItem of item.__iterateColumns()) {
                  if (keyInItem != item.__getColumn(s.dropDown.idColumn)) {
                    s.dropDown.captionColumn = keyInItem;
                    break;
                  }
                }
              }
            }
            let p = { id: item.__getColumn(s.dropDown.idColumn).value, caption: item.__getColumn(s.dropDown.captionColumn).value };
            if (p.id instanceof Column) {
              p.id = p.id.value;
            }
            if (p.caption instanceof Column)
              p.caption = p.caption.value;
            if (!p.caption)
              p.caption = p.id;
            result.push(p);
          }
        }
      };
      if (orig instanceof Array) {
        populateBasedOnArray(orig);
      }
      if (s.dropDown.source) {
        if (s.dropDown.source instanceof Entity) {
          return new DataList(s.dropDown.source).get({ limit: 5000 }).then(arr =>
            populateBasedOnArray(arr));
        }

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
    this.filterHelper.filterColumn(col.column, false);
  }
  clearFilter(col: FilteredColumnSetting<any>) {
    col._showFilter = false;
    this.filterHelper.filterColumn(col.column, true);
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
  _getColDataType(col: ColumnSetting<any>, row: any) {
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
    return this.__getColumn(col, r).error;
  }
  autoGenerateColumnsBasedOnData() {
    if (this.items.length == 0) {
      let r = this.currentRow();
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
      if (c.readonly != undefined && c.readonly != c.column.readonly && (c.readonly || c.column.readonly)) {
        addToProperties('readonly', c.readonly);
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
