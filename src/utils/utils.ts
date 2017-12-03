import { ColumnCollection } from './columnCollection';
import { EntitySource } from './Data';

import { makeTitle, isFunction } from './common';

import { Column, Entity, Sort, AndFilter } from './data'
import { DataColumnSettings, FilterBase, ColumnValueProvider, FindOptions } from './DataInterfaces';
import { RestList } from './restList';

export * from './data';





export interface dataAreaSettings {
  columns: ColumnCollection<any>;
}







declare var $: any;
export class SelectPopup<rowType extends Entity> {
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
    this.modalList.get({ where: this.searchColumn.isEqualTo(this.searchText + "*") });

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
        if (col.column && col.column.key != "id" && (!col.inputType || col.inputType == "text")) {
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
  source?: Entity;
  idColumn?: Column<any>;
  captionColumn?: Column<any>;
}

export interface DropDownItem {
  id?: any;
  caption?: any;
}








export interface IDataAreaSettings<rowType> {
  columnSettings?: ColumnSetting<rowType>[];
  numberOfColumnAreas?: number;
  labelWidth?: number;
}

export class DataAreaSettings<rowType extends Entity>
{

  constructor(public columns: ColumnCollection<rowType>, public settings: IDataAreaSettings<rowType>) {
    if (settings.columnSettings)
      columns.add(...settings.columnSettings);

  }
}

export class Lookup<lookupType extends Entity> {

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
      find.where.__addToUrl((k, v) => { key += k + ':' + (v ? v : '') + '|' });
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



export class DataSettings<rowType extends Entity>  {



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

    return new DataAreaSettings<rowType>(col, settings);
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


  _buttons: RowButton<Entity>[] = [];

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
  lookup: Lookup<rowType>;
  private filterHelper = new FilterHelper<rowType>(() => {
    this.page = 1;
    this.getRecords();
  });
  constructor(entitySource?: EntitySource<rowType>, settings?: IDataSettings<rowType>) {
    this.restList = new RestList<rowType>(entitySource);
    if (entitySource)
      this.filterHelper.filterRow = entitySource.createNewItem();

    this.columns = new ColumnCollection<rowType>(() => this.currentRow, () => this.allowUpdate, this.filterHelper)

    this.restList._rowReplacedListeners.push((old, curr) => {
      if (old == this.currentRow)
        this.setCurrentRow(curr);
    });
    this.lookup = new Lookup<rowType>(entitySource);
    if (settings) {
      if (settings.columnKeys)
        this.columns.add(...settings.columnKeys);
      if (settings.columnSettings)
        this.columns.add(...settings.columnSettings);

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
      if (!this.caption && entitySource) {
        this.caption = entitySource.createNewItem().name;
      }
      this.getOptions = settings.get;

    }

    this.popupSettings = new SelectPopup(this);
  }
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
  get(options: FindOptions) {
    this.getOptions = options;
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

export class FilterHelper<rowType extends Entity> {
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
export interface IDataSettings<rowType extends Entity> {
  allowUpdate?: boolean,
  allowInsert?: boolean,
  allowDelete?: boolean,
  hideDataArea?: boolean,

  columnSettings?: ColumnSetting<rowType>[],
  areas?: { [areaKey: string]: ColumnSetting<any>[] },
  columnKeys?: string[],
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

export interface RowButton<rowType extends Entity> {
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



export class lookupRowInfo<type> {
  found = false;
  loading = true;
  value: type = {} as type;
  promise: Promise<lookupRowInfo<type>>

}

export function isNewRow(r: Entity) {
  if (r) {
    r.__entityData.isNewRow();
  }
  return false;
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

