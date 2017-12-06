import { makeTitle, isFunction } from './common';

import { DataColumnSettings, FilterBase, ColumnValueProvider, FindOptions, FindOptionsPerEntity,RowEvents, DataProvider, DataProviderFactory } from './DataInterfaces';







export interface dataAreaSettings {
  columns: ColumnCollection<any>;
}







declare var $: any;
export class SelectPopup<rowType extends Entity<any>> {
  constructor(
    private modalList: DataSettings<rowType>, settings?: SelectPopupSettings) {
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

  constructor(public columns: ColumnCollection<rowType>, entity: rowType, public settings: IDataAreaSettings<rowType>) {
    if (settings.columnSettings)
      columns.add(...settings.columnSettings(entity));

  }
}





export class DataSettings<rowType extends Entity<any>>  {
  constructor(private entity?: rowType, settings?: IDataSettings<rowType>) {
    this.restList = new RestList<rowType>(entity.source);
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
      if (settings.caption)
        this.caption = settings.caption;
      if (!this.caption && entity) {
        this.caption = entity.source.createNewItem().name;
      }
      this.getOptions = settings.get;

    }

    this.popupSettings = new SelectPopup(this);
  }


  popupSettings: SelectPopup<rowType>;
  showSelectPopup(onSelect: (selected: rowType) => void) {


    this.popupSettings.show(onSelect);
  }


  static getRecords(): any {
    throw new Error("Method not implemented.");
  }
  private addNewRow() {
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
      this.__scopeToRow(r, () =>
        this.onNewRow(r));
    this.setCurrentRow(r);
  }

  noam: string;
  __scopeToRow(r: rowType, andDo: () => void) {
    andDo();
  }

  addArea(settings: IDataAreaSettings<rowType>) {
    let col = new ColumnCollection<rowType>(() => this.currentRow, () => this.allowUpdate, this.filterHelper);
    col.numOfColumnsInGrid = 0;

    return new DataAreaSettings<rowType>(col, this.entity, settings);
  }
  currentRow: rowType;
  setCurrentRow(row: rowType) {
    this.currentRow = row;
    if (this.onEnterRow && row) {
      this.__scopeToRow(this.currentRow, () =>
        this.onEnterRow(row));
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
  onSavingRow?: (s: ModelState<any>) => void;
  onEnterRow: (row: rowType) => void;
  onNewRow: (row: rowType) => void;
  _doSavingRow(s: ModelState<any>) {
    if (this.onSavingRow)
      this.__scopeToRow(s.row,
        () => this.onSavingRow(s));
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
    this.getOptions = {};
    if (options.where)
      this.getOptions.where = options.where(this.entity);
    if (options.orderBy)
      this.getOptions.orderBy = options.orderBy(this.entity);
    if (options.limit)
      this.getOptions.limit = options.limit;
    if (options.page)
      this.getOptions.page = options.page;
    this.page = 1;
    return this.getRecords();
  }
  sort(column: Column<any>) {
    if (!this.getOptions)
      this.getOptions = {};
    let done = false;;
    if (this.getOptions.orderBy && this.getOptions.orderBy.Segments.length > 0) {
      if (this.getOptions.orderBy.Segments[0].column == column) {
        this.getOptions.orderBy.Segments[0].descending = !this.getOptions.orderBy.Segments[0].descending;
        done = true;
      }
    } if (!done)
      this.getOptions.orderBy = new Sort({ column: column });
    this.getRecords();
  }
  sortedAscending(column: Column<any>) {
    if (!this.getOptions)
      return false;
    if (!this.getOptions.orderBy)
      return false;
    if (!column)
      return false;
    return this.getOptions.orderBy.Segments.length > 0 &&
      this.getOptions.orderBy.Segments[0].column == column &&
      !this.getOptions.orderBy.Segments[0].descending;
  }
  sortedDescending(column: Column<any>) {
    if (!this.getOptions)
      return false;
    if (!this.getOptions.orderBy)
      return false;
    if (!column)
      return false;
    return this.getOptions.orderBy.Segments.length > 0 &&
      this.getOptions.orderBy.Segments[0].column == column &&
      this.getOptions.orderBy.Segments[0].descending;
  }



  private getOptions: FindOptions;



  getRecords() {

    let opt: FindOptions = {};
    if (this.getOptions) {
      opt = Object.assign(opt, this.getOptions);
    }
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



  private restList: RestList<rowType>;
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
  addToFindOptions(opt: FindOptions) {
    this.filterColumns.forEach(c => {
      if (opt.where) {
        opt.where = new AndFilter(opt.where, c.isEqualTo(this.filterRow.__getColumn(c).value));

      }
      else opt.where = c.isEqualTo(this.filterRow.__getColumn(c).value);
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
  get?: FindOptions,
  onSavingRow?: (s: ModelState<rowType>) => void;
  onEnterRow?: (r: rowType) => void;
  onNewRow?: (r: rowType) => void;
  numOfColumnsInGrid?: number;
  caption?: string;

}
export class ModelState<rowType> {
  row: rowType;
  constructor(private _row: any) {
    this.row = _row;
  }


  isValid = true;
  message: string;
  addError(key: string, message: string) {
    this.isValid = false;
    let current = this.modelState[key];
    if (!current) {
      current = this.modelState[key] = [];
    }
    current.push(message);
  }
  required(key: string, message = 'Required') {
    let value = this._row[key];
    if (value == undefined || value == null || value == "" || value == 0)
      this.addError(key, message);
  }
  addErrorMessage(message: string) {
    this.isValid = false;
    this.message = message;
  }
  modelState: any = {};
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
  column?: Column<any>
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

class dataSettingsColumnValueProvider implements ColumnValueProvider {
  constructor(private ds: DataSettings<any>) {
    this.currentRow = () => ds.currentRow;
    ds.noam = "yeah";
    ds.__scopeToRow = (r, andDo) => {
      let prev = this.currentRow;
      this.currentRow = () => r;
      try {
        andDo();
      }
      finally {
        this.currentRow = prev;
      }
    };
  }
  currentRow: () => any;


  getValue(key: string) {
    let r = this.currentRow();
    if (!r)
      return undefined;

    return r[key];
  }
  setValue(key: string, value: any): void {
    this.currentRow()[key] = value;
  }
}

export class RestList<T extends Entity<any>> implements Iterable<T>{
  [Symbol.iterator](): Iterator<T> {
    return this.items[Symbol.iterator]();
  }


  items: T[] = [];
  constructor(private source: EntitySource<T>) {

  }
  _rowReplacedListeners: ((oldRow: T, newRow: T) => void)[] = [];

  private map(item: T): T {

    item.__entityData.register({
      rowReset: (newRow) => {
        if (newRow)
          this.items.splice(this.items.indexOf(item), 1);

      },
      rowDeleted: () => { this.items.splice(this.items.indexOf(item)) }
    });
    return item;
  }
  lastGetId = 0;
  get(options?: FindOptions) {

    let getId = ++this.lastGetId;

    return this.source.find(options).then(r => {
      let x: T[] = r;
      let result = r.map((x: any) => this.map(x));
      if (getId == this.lastGetId)
        this.items = result;
      return result;
    });
  }
  add(): T {
    let x = this.map(this.source.createNewItem());
    this.items.push(x);
    return x;
  }
  replaceRow(originalRow: any, newRow: any) {
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

export class Lookup<lookupType extends Entity<any>> {

  constructor(private source: EntitySource<lookupType>) {
    this.restList = new RestList<lookupType>(source);

  }

  private restList: RestList<lookupType>;
  private cache: any = {};

  get(filter: FilterBase): lookupType {
    return this.getInternal(filter).value;
  }
  found(filter: FilterBase): boolean {
    return this.getInternal(filter).found;
  }

  private getInternal(filter: FilterBase): lookupRowInfo<lookupType> {
    let find: FindOptions = {};
    find.where = filter;

    return this._internalGetByOptions(find);
  }

  _internalGetByOptions(find: FindOptions): lookupRowInfo<lookupType> {

    let key = "";
    if (find.where)
      find.where.__addToUrl((k, v) => { key += k.jsonName + ':' + (v ? v : '') + '|' });

    if (this.cache == undefined)
      this.cache = {};
    if (this.cache[key]) {
      return this.cache[key];
    } else {
      let res = new lookupRowInfo<lookupType>();
      this.cache[key] = res;

      if (find == undefined || key == undefined) {
        res.loading = false;
        res.found = false;
        return res;
      } else {
        res.value = this.source.createNewItem();
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

  whenGet(r: FilterBase) {
    return this.getInternal(r).promise.then(r => r.value);
  }
}


export class lookupRowInfo<type> {
  found = false;
  loading = true;
  value: type = {} as type;
  promise: Promise<lookupRowInfo<type>>

}

export class Column<dataType>  {
  jsonName: string;
  caption: string;
  dbName: string;
  constructor(settingsOrCaption?: DataColumnSettings | string) {
    if (settingsOrCaption) {
      if (typeof (settingsOrCaption) === "string") {
        this.caption = settingsOrCaption;
      } else {
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
      }

    }


  }
  __getDbName() {
    if (this.dbName)
      return this.dbName;
    return this.jsonName;
  }
  readonly: boolean;
  inputType: string;
  isEqualTo(value: Column<dataType> | dataType) {


    let val: dataType;

    if (value instanceof Column)
      val = value.value;
    else
      val = value;


    return new Filter(apply => apply(this, val));
  }
  __valueProvider: ColumnValueProvider = new dummyColumnStorage();
  get value() {
    return this.__valueProvider.getValue(this.jsonName);
  }
  set value(value: dataType) { this.__valueProvider.setValue(this.jsonName, value); }
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

  public setValue(key: string, value: string): void {
    this._val = value;
  }
}


export class Filter implements FilterBase {
  constructor(private apply: (add: (name: Column<any>, val: any) => void) => void) {

  }
  and(filter: FilterBase): FilterBase {
    return new AndFilter(this, filter);
  }

  public __addToUrl(add: (name: Column<any>, val: any) => void): void {
    this.apply(add);
  }
}



export class AndFilter implements FilterBase {
  constructor(private a: FilterBase, private b: FilterBase) {

  }


  public __addToUrl(add: (name: Column<any>, val: any) => void): void {
    this.a.__addToUrl(add);
    this.b.__addToUrl(add);
  }
}

export class Entity<idType> {
  constructor(private factory: () => Entity<idType>, source: DataProviderFactory, public name?: string) {
    this.__entityData = new __EntityValueProvider(() => this.source.__getDataProvider());
    this.setSource(source);
  }
  __entityData: __EntityValueProvider;


  __idColumn: Column<idType>;
  protected initColumns(idColumn: Column<idType>) {
    this.__idColumn = idColumn;
    let x = <any>this;
    for (let c in x) {
      let y = x[c];

      if (y instanceof Column) {
        if (!y.jsonName)
          y.jsonName = c;

        this.applyColumn(y);
      }
    }
  }

  setSource(dp: DataProviderFactory) {
    this.source = new EntitySource<this>(this.name, () => <this>this.factory(), dp);
  }
  save() {
    return this.__entityData.save();
  }
  delete() {
    return this.__entityData.delete();

  }
  reset() {
    this.__entityData.reset();
  }
  wasChanged() {
    return this.__entityData.wasChanged();
  }
  __toPojo(): any {
    let r = {};
    this.__iterateColumns().forEach(c => {
      c.__addToPojo(r);
    });
    return r;

  }
  __fromPojo(r:any): any {
    
    this.__iterateColumns().forEach(c => {
      c.__loadFromToPojo(r);
    });
    

  }

  source: EntitySource<this>;
  private applyColumn(y: Column<any>) {
    if (!y.caption)
      y.caption = makeTitle(y.jsonName);
    y.__valueProvider = this.__entityData;
    this.__columns.push(y);
  }
  private __columns: Column<any>[] = [];
  __getColumn<T>(col: Column<T>) {

    return this.__getColumnByKey(col.jsonName);
  }
  __getColumnByKey(key: string): Column<any> {
    let any: any = this;
    return any[key];
  }
  __iterateColumns() {
    return this.__columns;

  }

  lookup<lookupIdType, entityType extends Entity<lookupIdType>>(lookupEntity: entityType, filter: Column<lookupIdType> | ((entityType: entityType) => FilterBase)): entityType {

    let key = lookupEntity.constructor.name;
    let lookup: Lookup<entityType>;
    this.source.__lookupCache.forEach(l => {
      if (l.key == key)
        lookup = l.lookup;
    });
    if (!lookup) {
      lookup = new Lookup(lookupEntity.source);
      this.source.__lookupCache.push({ key, lookup });
    }
    if (filter instanceof Column)
      return lookup.get(lookupEntity.__idColumn.isEqualTo(filter));
    else if (isFunction(filter)) {

      return lookup.get(filter(lookupEntity));
    }
  }

}
export interface LookupCache<T extends Entity<any>> {
  key: string;
  lookup: Lookup<T>;
}




export class EntitySource<T extends Entity<any>>
{
  private _provider: DataProvider;
  constructor(name: string, private factory: () => T, dataProvider: DataProviderFactory) {
    this._provider = dataProvider.provideFor(name, factory);
  }
  find(options?: FindOptions): Promise<T[]> {
    return this._provider.find(options)
      .then(arr => {
        return arr.map(i => {
          let r = this.factory();
          r.__entityData.setData(i);
          r.source = this;
          return r;
        })
      });
  }
  __lookupCache: LookupCache<any>[] = [];



  __getDataProvider() {
    return this._provider;
  }

  createNewItem(): T {
    let r = this.factory();
    r.source = this;
    return r;
  }

  Insert(doOnRow: (item: T) => void): Promise<void> {
    var i = this.createNewItem();
    doOnRow(i);
    return i.save();
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
  save(): Promise<void> {
    if (this.newRow) {
      return this.getDataProvider().insert(this.data).then((newData: any) => {
        this.setData(newData);
        this.listeners.forEach(x => {
          if (x.rowSaved)
            x.rowSaved(true);
        });
      });
    } else {
      return this.getDataProvider().update(this.id, this.data).then((newData: any) => {
        this.setData(newData);
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


  setData(data: any) {
    if (!data)
      data = {};
    if (data.id) {
      this.id = data.id;
      this.newRow = false;
    }

    this.data = data;
    this.originalData = JSON.parse(JSON.stringify(this.data));
  }
  getValue(key: string) {
    return this.data[key];
  }
  setValue(key: string, value: any): void {
    this.data[key] = value;
  }
}
export class StringColumn extends Column<string>{
  constructor(settingsOrCaption: DataColumnSettings | string) {
    super(settingsOrCaption);
  }
}
export class DateColumn extends Column<string>{
  constructor(settingsOrCaption: DataColumnSettings | string) {
    super(settingsOrCaption);
    if (!this.inputType)
      this.inputType = 'date';
  }


}
export class NumberColumn extends Column<number>{
  constructor(settingsOrCaption?: DataColumnSettings | string) {
    super(settingsOrCaption);
    if (!this.inputType)
      this.inputType = 'number';
  }
}
export class BoolColumn extends Column<boolean>{
  constructor(settingsOrCaption: DataColumnSettings | string) {
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
  private settingsByKey: any = {};

  allowDesignMode: boolean;
  add(...columns: ColumnSetting<rowType>[]): void;
  add(...columns: string[]): void;
  add(...columns: any[]) {
    for (let c of columns) {
      let s: ColumnSetting<rowType>;
      let x = c as ColumnSetting<rowType>;
      if (!x.column && c instanceof Column) {
        x.column = c;
      } else
        if (x.column) {
          if (!x.caption && x.column.caption)
            x.caption = x.column.caption;
        }

      if (x.getValue) {
        s = x;
      }

      else {
        this.buildDropDown(x);
      }
      this.items.push(x);


    }
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
              if (col = item.__getColumnByKey('id'))
                s.dropDown.idColumn = col;
              else {
                for (let colInEntity of item.__iterateColumns()) {
                  s.dropDown.idColumn = colInEntity;
                  break;
                }
              }
            }
            if (!s.dropDown.captionColumn) {
              if (col = item.__getColumnByKey('caption'))
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
          return new RestList(s.dropDown.source.source).get({ limit: 5000 }).then(arr =>
            populateBasedOnArray(arr));
        }

      }
    }
    return Promise.resolve();
  }

  designMode: false;
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

  _getColValue(col: ColumnSetting<any>, row: rowType) {
    let r;
    if (col.getValue) {

      r = col.getValue(row)
      if (r instanceof Column)
        r = r.value;

    }
    else if (col.column) {
      r = row.__getColumn(col.column).value;
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
  _getError(col: ColumnSetting<any>, r: any) {
    if (r.__modelState) {
      let m = <ModelState<any>>r.__modelState();
      if (m.modelState) {
        let errors = m.modelState[col.column.jsonName];
        if (errors && errors.length > 0)
          return errors[0];
      }
      return "";

    }
    return undefined;
  }
  autoGenerateColumnsBasedOnData() {
    if (this.items.length == 0) {
      let r = this.currentRow();
      if (r) {
        this.add(...r.__iterateColumns());

      }
    }



  }
  columnSettingsTypeScript() {
    let result = `columnSettings:[`;
    return result;
  }
  _colValueChanged(col: ColumnSetting<any>, r: any) {
    if (r.__modelState) {
      let m = <ModelState<any>>r.__modelState();
      if (m && m.modelState)
        m.modelState[col.column.jsonName] = undefined;
    }
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
