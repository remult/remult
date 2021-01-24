import { Entity } from "./entity";


import { Column } from "./column";
import { DataControlSettings, DataControlInfo } from "./column-interfaces";
import { Context } from "./context";

import { DataList } from "./dataList";
import { Sort } from "./sort";
import { ColumnCollection } from "./column-collection";
import { IDataAreaSettings, DataAreaSettings } from "./data-area-settings";
import { FilterHelper } from "./filter/filter-helper";
import { EntityProvider, FindOptions, entityOrderByToSort, EntityWhere, EntityOrderBy } from './data-interfaces';
import { AndFilter } from "./filter/filter-interfaces";




export class GridSettings<rowType extends Entity = Entity>  {
  constructor(private entityProvider: EntityProvider<rowType>, private context: Context, public settings?: IDataSettings<rowType>) {
    this.restList = new DataList<rowType>(entityProvider);
    if (entityProvider) {
      this.filterHelper.filterRow = <rowType>entityProvider.create();
    }

    this.columns = new ColumnCollection<rowType>(() => this.currentRow, () => this.allowUpdate, this.filterHelper, () => this.currentRow ? true : false, context)

    this.restList._rowReplacedListeners.push((old, curr) => {
      if (old == this.currentRow)
        this.setCurrentRow(curr);
    });

    if (settings) {

      if (settings.columnSettings)
        this.columns.add(...settings.columnSettings(entityProvider.create()));
      if (settings.allowCRUD !== undefined) {

        if (settings.allowUpdate === undefined)
          settings.allowUpdate = settings.allowCRUD;
        if (settings.allowDelete === undefined)
          settings.allowDelete = settings.allowCRUD;
        if (settings.allowInsert === undefined)
          settings.allowInsert = settings.allowCRUD;
      }
      if (settings.allowUpdate)
        this.allowUpdate = true;
      if (settings.allowDelete)
        this.allowDelete = true;
      if (settings.allowInsert)
        this.allowInsert = true;
      if (settings.showDataArea)
        this.showDataArea = settings.showDataArea;
      if (settings.showPagination === undefined)
        settings.showPagination = true;

      if (settings.numOfColumnsInGrid != undefined)
        this.columns.numOfColumnsInGrid = settings.numOfColumnsInGrid;

      if (settings.rowButtons)
        this._buttons = settings.rowButtons;


      if (settings.rowCssClass)
        this.rowClass = settings.rowCssClass;
      if (settings.saving)
        this.onSavingRow = settings.saving;
      if (settings.enterRow)
        this.onEnterRow = settings.enterRow;
      if (settings.newRow)
        this.onNewRow = settings.newRow;
      if (settings.validation)
        this.onValidate = settings.validation;
      if (settings.caption)
        this.caption = settings.caption;
      if (!this.caption && entityProvider) {
        this.caption = entityProvider.create().defs.caption;
      }
      let get = settings.get;
      if (!get) {
        get = {};
      }
      if (settings.where)
        get.where = settings.where;
      if (settings.orderBy)
        get.orderBy = settings.orderBy;
      if (settings.rowsInPage !== undefined)
        get.limit = settings.rowsInPage;
      if (settings.page !== undefined)
        get.page = settings.page;
      this.setGetOptions(get);

    }


  }

  currList: DataControlSettings[];
  origList: DataControlSettings[];
  origNumOfColumns: number;
  showSelectColumn = false;

  initOrigList() {
    if (!this.origList) {
      this.origList = [];
      this.origNumOfColumns = this.columns.numOfColumnsInGrid;
      this.origList.push(...this.columns.items);
    }
  }
  userChooseColumns() {
    this.initOrigList();
    if (!this.currList) {

      this.resetColumns();

    }
    this.showSelectColumn = !this.showSelectColumn;
  }
  resetColumns() {
    this.currList = [];
    this.columns.items = this.currList;
    this.columns.numOfColumnsInGrid = this.origNumOfColumns;
    for (let i = 0; i < this.origList.length; i++) {
      // if (i < this.columns.numOfColumnsInGrid)
      this.currList.push(this.origList[i]);
    }

  }

  deleteCol(c: DataControlSettings) {
    this.columns.deleteCol(c)
    this.columns.numOfColumnsInGrid--;
  }


  private setGetOptions(get: FindOptions<rowType>) {
    this.getOptions = get;
    if (get && get.limit)
      this.rowsPerPage = get.limit;
    else
      this.rowsPerPage = 25;
    if (this.rowsPerPageOptions.indexOf(this.rowsPerPage) < 0) {
      this.rowsPerPageOptions.push(this.rowsPerPage);
      this.rowsPerPageOptions.sort((a, b) => +a - +b);
    }
    this._currentOrderBy = undefined;
    if (this.getOptions && this.getOptions.orderBy)
      this._currentOrderBy = entityOrderByToSort(this.entityProvider.create(), this.getOptions.orderBy);

  }






  addNewRow() {
    let r: any = this.restList.add();
    if (this.onNewRow)
      this.onNewRow(r);
    this.setCurrentRow(r);
  }

  noam: string;

  addArea(settings: IDataAreaSettings<rowType>) {
    let col = new ColumnCollection<rowType>(() => this.currentRow, () => this.allowUpdate, this.filterHelper, () => this.currentRow ? true : false);
    col.numOfColumnsInGrid = 0;

    return new DataAreaSettings<rowType>(settings, col, this.entityProvider.create());
  }
  currentRow: rowType;
  setCurrentRow(row: rowType) {
    if (this.currentRow != row) {
      this.currentRow = row;
      if (this.onEnterRow && row) {

        this.onEnterRow(row);
      }
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
    return this.currentRow;
  }
  cancelCurrentRowChanges() {
    if (this.currentRowAsRestListItemRow() && this.currentRowAsRestListItemRow())
      this.currentRowAsRestListItemRow().undoChanges();
  }
  deleteCurrentRowAllowed() {
    return this.currentRowAsRestListItemRow() && this.currentRowAsRestListItemRow().delete && this.allowDelete && !isNewRow(this.currentRow);
  }
  currentRowChanged() {
    return this.currentRowAsRestListItemRow() && this.currentRowAsRestListItemRow().wasChanged();
  }
  saveCurrentRow() {
    if (this.currentRowAsRestListItemRow() && this.currentRowAsRestListItemRow().save)
      this.currentRowAsRestListItemRow().save();
  }

  allowUpdate = false;
  allowInsert = false;
  allowDelete = false;
  showDataArea = false;


  _buttons: RowButton<Entity>[] = [];

  rowClass?: (row: any) => string;
  onSavingRow?: (row: any) => Promise<any> | any;
  onValidate?: (row: rowType) => Promise<any> | any;
  onEnterRow: (row: rowType) => void;
  onNewRow: (row: rowType) => void;
  _doSavingRow(s: rowType) {
    return s.save(async () => {
      if (this.onValidate)
        await this.onValidate(s);
      if (this.onSavingRow)
        await this.onSavingRow(s);
    });

  }
  caption: string;

  filterHelper = new FilterHelper<rowType>(() => {
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
  firstPage() {
    this.page = 1;
    return this.getRecords();
  }
  selectedRows: rowType[] = [];
  selectedChanged(row: rowType) {
    if (this.isSelected(row)) {
      this.selectedRows.splice(this.selectedRows.indexOf(row), 1);
      this._selectedAll = false;
    }
    else {
      this.selectedRows.push(row);

      this._selectedAll = this.selectedRows.length == this.totalRows;
    }
  }
  isSelected(row: rowType) {
    return this.selectedRows.indexOf(row) >= 0;
  }
  selectAllIntermitent() {
    return this.selectedRows.length > 0 && (this.selectedRows.length != this.items.length || !this._selectedAll);
  }
  selectAllChecked() {
    return this.selectedRows.length > 0 && this.selectedRows.length == this.items.length && this._selectedAll;
  }
  private _selectedAll = false;
  selectAllChanged(e: { checked: boolean }) {

    this.selectedRows.splice(0);
    if (e.checked) {
      this.selectedRows.push(...this.items);
      this._selectedAll = true;
    }
    else
      this._selectedAll = false;
  }
  rowsPerPage: number;
  rowsPerPageOptions = [10, 25, 50, 100];
  get(options: FindOptions<rowType>) {

    this.setGetOptions(options);
    this.page = 1;
    return this.getRecords();

  }

  _currentOrderBy: Sort;
  sort(column: Column) {

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
  sortedAscending(column: Column) {
    if (!this._currentOrderBy)
      return false;
    if (!column)
      return false;
    return this._currentOrderBy.Segments.length > 0 &&
      this._currentOrderBy.Segments[0].column == column &&
      !this._currentOrderBy.Segments[0].descending;
  }
  sortedDescending(column: Column) {
    if (!this._currentOrderBy)
      return false;
    if (!column)
      return false;
    return this._currentOrderBy.Segments.length > 0 &&
      this._currentOrderBy.Segments[0].column == column &&
      !!this._currentOrderBy.Segments[0].descending;
  }



  private getOptions: FindOptions<rowType>;

  totalRows: number;
  /**
     * reloads the data for the grid
     * @deprecated Use `reloadData` instead
     */
  getRecords() {
    return this.reloadData();
  }
    
  reloadData() {
    let opt: FindOptions<rowType> = this._internalBuildFindOptions();
    this.columns.autoGenerateColumnsBasedOnData(this.entityProvider.create());
    let result = this.restList.get(opt).then(() => {
      this.selectedRows.splice(0);
      this._selectedAll = false;

      if (this.restList.items.length == 0) {
        this.setCurrentRow(undefined);

      }
      else {


        this.setCurrentRow(this.restList.items[0]);

      }
      return this.restList;
    });
    if (this.settings && this.settings.knowTotalRows) {
      this.restList.count(opt.where).then(x => {
        this.totalRows = x;
      });
    }
    return result;
  };



  private restList: DataList<rowType>;
  _internalBuildFindOptions() {
    let opt: FindOptions<rowType> = {};
    if (this.getOptions) {
      opt = Object.assign(opt, this.getOptions);
    }
    if (this._currentOrderBy)
      opt.orderBy = r => this._currentOrderBy;
    opt.limit = this.rowsPerPage;
    if (this.page > 1)
      opt.page = this.page;
    this.filterHelper.addToFindOptions(opt);
    return opt;
  }
  getFilterWithSelectedRows() {
    let r = this._internalBuildFindOptions();
    if (this.selectedRows.length > 0 && !this._selectedAll) {
      let ids = this.selectedRows.map(x => x.columns.idColumn.value);
      if (r.where) {
        let x = r.where;
        r.where = e => new AndFilter(x(e), e.columns.idColumn.isIn(...ids))
      }
      else
        r.where = e => e.columns.idColumn.isIn(...ids);
    }
    return r;
  }


  get items(): rowType[] {
    if (this.restList)
      return this.restList.items;
    return undefined;
  }





}
export interface IDataSettings<rowType extends Entity> {
  allowUpdate?: boolean,
  allowInsert?: boolean,
  allowDelete?: boolean,
  allowCRUD?: boolean,
  showDataArea?: boolean,
  showPagination?: boolean,
  showFilter?: boolean,
  allowSelection?: boolean,
  confirmDelete?: (r: rowType) => Promise<boolean>;

  columnSettings?: (row: rowType) => DataControlInfo<rowType>[],
  areas?: { [areaKey: string]: DataControlInfo<rowType>[] },

  rowCssClass?: (row: rowType) => string;
  rowButtons?: RowButton<rowType>[];
  gridButtons?: GridButton[];
  /**
     * controls the data that is presented on the data grid
     * @deprecated Use `where`, `orderBy`, `rowsPerPage` and `page`
     */
  get?: FindOptions<rowType>;
  /** filters the data
   * @example
   * where p => p.price.isGreaterOrEqualTo(5)
   * @see For more usage examples see [EntityWhere](https://remult-ts.github.io/guide/ref_entitywhere)
   */
  where?: EntityWhere<rowType>;
  /** Determines the order in which the result will be sorted in
   * @see See [EntityOrderBy](https://remult-ts.github.io/guide/ref__entityorderby) for more examples on how to sort
   */
  orderBy?: EntityOrderBy<rowType>;
  /** Determines the number of rows returned by the request, on the browser the default is 25 rows 
   * @example
   * this.products = await this.context.for(Products).gridSettings({
   *  rowsInPage:10,
   *  page:2
  * })
  */
  rowsInPage?: number;
  /** Determines the page number that will be used to extract the data 
   * @example
   * this.products = await this.context.for(Products).gridSettings({
   *  rowsInPage:10,
   *  page:2
   * })
  */
  page?: number;
  __customFindData?: any;
  knowTotalRows?: boolean;
  saving?: (r: rowType) => void;
  validation?: (r: rowType) => void;
  enterRow?: (r: rowType) => void;
  newRow?: (r: rowType) => void;
  numOfColumnsInGrid?: number;
  caption?: string;

}
export interface RowButton<rowType extends Entity> {
  name?: string;
  visible?: (r: rowType) => boolean;
  click?: (r: rowType) => void;
  showInLine?: boolean;
  textInMenu?: (string | ((row: rowType) => string));
  icon?: string;
  cssClass?: (string | ((row: rowType) => string));

}

export interface GridButton {
  name?: string;
  visible?: () => boolean;
  click?: () => void;
  textInMenu?: () => string;
  icon?: string;
  cssClass?: (string | (() => string));
}

function isNewRow(r: Entity) {
  if (r) {
    r.__entityData.isNewRow();
  }
  return false;
}