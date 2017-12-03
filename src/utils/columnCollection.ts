
import { Column,Entity } from './data';
import { RestList } from './restList';
import { makeTitle, isFunction } from './common';
import { ColumnSetting, DropDownItem, FilteredColumnSetting, ModelState, FilterHelper } from './utils';

export class ColumnCollection<rowType extends Entity> {
  constructor(public currentRow: () => Entity, private allowUpdate: () => boolean, public filterHelper: FilterHelper<rowType>) {

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
                s.dropDown.idColumn = col ;
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
                  if ( keyInItem != item.__getColumn( s.dropDown.idColumn) ){
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
