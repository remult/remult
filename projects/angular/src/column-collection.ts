import { columnDefs, Entity, FilterHelper, IdEntity, ValueListItem, valueOrEntityExpressionToValue } from "@remult/core";
import { column,  EntityDefs, getEntityOf } from "../../core/src/remult3";
import { DataControlInfo, DataControlSettings, decorateDataSettings } from "./data-control-interfaces";



export class ColumnCollection<rowType = any> {
  constructor(public currentRow: () => any, private allowUpdate: () => boolean, public filterHelper: FilterHelper<rowType>, private showArea: () => boolean) {


  }
  __showArea() {
    return this.showArea();

  }
  __getColumn(map: DataControlSettings, record: any) {
    let result: column<any, any>;
    if (record)
      result = getEntityOf(record).columns.find(map.column);
    if (!result)
      result = map.column as column<any, any>;
    return result;
  }



  __visible(col: DataControlSettings, row: any) {
    if (col.visible === undefined)
      return true;
    return col.visible(row);
  }

  __dataControlStyle(map: DataControlSettings): string {

    if (map.width && map.width.trim().length > 0) {
      if ((+map.width).toString() == map.width)
        return map.width + "px";
      return map.width;
    }
    return undefined;

  }
  private settingsByKey: any = {};

  allowDesignMode: boolean;
  async add(...columns: DataControlInfo<rowType>[]): Promise<void>;
  async add(...columns: string[]): Promise<void>;
  async add(...columns: any[]) {
    var promises: Promise<void>[] = [];
    for (let c of columns) {
      if (!c)
        continue;
      let s: DataControlSettings<rowType>;
      let x = c as DataControlSettings<rowType>;
      let col = c as columnDefs;
      if (!x.column && col.key && col.caption && col.dbName && col.inputType) {
        x = {
          column: c,
        }

      }
      if (x.column) {
        decorateDataSettings(x.column, x);
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
  async buildDropDown(s: DataControlSettings) {
    if (s.valueList) {
      let orig = s.valueList;
      let result: ValueListItem[] = [];
      s.valueList = result;

      if (orig instanceof Array) {
        for (let item of orig) {
          let type = typeof (item);
          if (type == "string" || type == "number")
            result.push({ id: item, caption: item });
          else {
            let x = item as ValueListItem;
            if (x && x.id != undefined) {
              result.push(x);
            }
          }
        }
      }
      else if (typeof orig === "function") {
        result.push(...(await (orig as (() => Promise<ValueListItem[]>))()));
      }
      else {
        result.push(...(await (orig as (Promise<ValueListItem[]>))));
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
  moveCol(col: DataControlSettings, move: number) {
    let currentIndex = this.items.indexOf(col);
    let newIndex = currentIndex + move;
    if (newIndex < 0 || newIndex >= this.items.length)
      return;
    this.items.splice(currentIndex, 1);
    this.items.splice(newIndex, 0, col);
    this.colListChanged();


  }

  filterRows(col: DataControlSettings) {

    let forceEqual = col.forceEqualFilter;
    if (forceEqual === undefined)
      forceEqual = (col.valueList != undefined)
    this.filterHelper.filterColumn(col.column, false, forceEqual);
  }
  clearFilter(col: DataControlSettings) {

    this.filterHelper.filterColumn(col.column, true, false);
  }
  _shouldShowFilterDialog(col: DataControlSettings) {
    return false;
  }

  deleteCol(col: DataControlSettings) {
    this.items.splice(this.items.indexOf(col), 1);
    this.colListChanged();
  }
  addCol(col: DataControlSettings, newCol: DataControlSettings) {
    this.items.splice(this.items.indexOf(col) + 1, 0, newCol);
    this.colListChanged();
  }


  _getEditable(col: DataControlSettings, row: rowType) {
    if (!this.allowUpdate())
      return false;
    if (!col.column)
      return false
    if (col.readOnly !== undefined)
      return !valueOrEntityExpressionToValue(col.readOnly, row);
    return true;
  }
  _click(col: DataControlSettings, row: any) {
    col.click(row);
  }

  _getColDisplayValue(col: DataControlSettings, row: rowType) {
    let r;
    if (col.getValue) {

      r = col.getValue(row)
      if (r.value)
        r = r.value;



    }
    else if (col.column) {
      if (col.valueList) {
        for (let x of (col.valueList as ValueListItem[])) {
          if (x.id == this.__getColumn(col, row).value)
            return x.caption;
        }
      }
      r = this.__getColumn(col, row).displayValue;
    }


    return r;
  }
  _getColDataType(col: DataControlSettings) {
    if (col.inputType)
      return col.inputType;
    return "text";
  }
  _getColumnClass(col: DataControlSettings, row: any) {

    if (col.cssClass)
      if (typeof col.cssClass === 'function') {
        let anyFunc: any = col.cssClass;
        return anyFunc(row);
      }
      else return col.cssClass;
    return '';

  }

  _getError(col: DataControlSettings, r: any) {
    if (!col.column)
      return undefined;
    return this.__getColumn(col, r).error;
  }
  autoGenerateColumnsBasedOnData(defs: EntityDefs<any>) {
    if (this.items.length == 0) {

      if (defs) {
        let ignoreCol: columnDefs = undefined;
        //   if (r instanceof IdEntity)
        //    ignoreCol = r.id;
        for (const c of defs.columns._items) {
          if (c != ignoreCol)
            this.add(c);
        }


      }
    }



  }

  __changeWidth(col: DataControlSettings, what: number) {
    let width = col.width;
    if (!width)
      width = '50';
    width = ((+width) + what).toString();
    col.width = width;
  }
  _colValueChanged(col: DataControlSettings, r: any) {



  }
  items: DataControlSettings[] = [];
  private gridColumns: DataControlSettings[];
  private nonGridColumns: DataControlSettings[];
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

