import { ColumnDefinitions, EntityColumn, EntityDefinitions, getEntityOf, IdEntity, ValueListItem, rowHelper, ClassType, Allowed, decorateColumnSettings, ColumnSettings } from "@remult/core";

import { DataControlInfo, DataControlSettings, decorateDataSettings, getColumnDefinition, ValueOrEntityExpression } from "./data-control-interfaces";
import { FilterHelper } from "./filter-helper";



export class ColumnCollection<rowType = any> {
  constructor(public currentRow: () => any, private allowUpdate: () => boolean, public filterHelper: FilterHelper<rowType>, private showArea: () => boolean, private _getRowColumn: (row: rowType, col: ColumnDefinitions) => EntityColumn<any, any>) {


  }
  __showArea() {
    return this.showArea();

  }
  __getColumn(map: DataControlSettings, record: any) {
    let result: EntityColumn<any, any>;
    if (record)
      result = getEntityOf(record).columns.find(getColumnDefinition(map.column));
    if (!result)
      result = map.column as unknown as EntityColumn<any, any>;
    return result;
  }



  __visible(col: DataControlSettings, row: any) {
    if (col.visible === undefined)
      return true;
    return this.getRowColumn({ col, row }, (c, row) => col.visible(row, c));
  }
  getRowColumn<T>(args: { col: DataControlSettings<any>, row: any }, what: (c: EntityColumn<any, any>, row: any) => T) {
    let column: EntityColumn<any, any>;
    let row = args.row;
    if (this._getRowColumn) {
      column = this._getRowColumn(row, getColumnDefinition(args.col.column));
    }
    if (!column)
      column = args.col.column as unknown as EntityColumn<any, any>;
    if (!row)
      row = column.entity;
    return what(column, row);
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
      let col = c as ColumnDefinitions;
      let ecol = c as EntityColumn<any, any>;
      if (!x.column && col.valueConverter || ecol.defs) {
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
    this.getRowColumn({ col, row }, (c, r) => { col.click(r, c) });

  }

  _getColDisplayValue(col: DataControlSettings, row: rowType) {
    let r;
    if (col.getValue) {

      r = this.getRowColumn({ row, col }, (c, r) => col.getValue(r, c));
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
  autoGenerateColumnsBasedOnData(defs: EntityDefinitions<any>) {
    if (this.items.length == 0) {

      if (defs) {
        let ignoreCol: ColumnDefinitions = undefined;
        //   if (r instanceof IdEntity)
        //    ignoreCol = r.id;
        for (const c of defs.columns) {
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


export function valueOrEntityExpressionToValue<T, entityType>(f: ValueOrEntityExpression<T, entityType>, e: entityType): T {
  if (typeof f === 'function') {
    let x = f as any;
    return x(e);
  }
  return <T>f;
}


export class InputControl<T> implements EntityColumn<T, any> {
  constructor(private defaultValue: T, private settings: ColumnSettings<T, any> & DataControlSettings & { valueChange?: () => void }) {
    if (!settings.caption)
      settings.caption = 'caption';
    if (!settings.key)
      settings.key = settings.caption;
    if (!settings.dbName)
      settings.dbName = settings.key;

    decorateColumnSettings(settings);
    this.inputType = settings.inputType;
    this._value = defaultValue;
    this.originalValue = defaultValue;
    this.defs = {

      allowNull: settings.allowNull,
      caption: settings.caption,

      valueConverter: settings.valueConverter,
      dataType: settings.dataType,
      key: settings.key,
      dbName: settings.dbName,
      dbReadOnly: false,
      inputType: settings.inputType,
      isServerExpression: false,

      target: undefined

    }



  }
  defs: ColumnDefinitions<any>;
  _value: T;
  inputType: string;
  error: string;
  get displayValue() {
    return this.settings.displayValue(this.value, undefined);
  }
  get value(): T { return this._value; }
  set value(val: T) {
    this._value = val;
    if (this.settings.valueChange)
      this.settings.valueChange()
  };
  originalValue: T;
  get inputValue(): string { return this.settings.valueConverter.toInput(this.value, this.inputType); }
  set inputValue(val: string) { this.value = this.settings.valueConverter.fromInput(val, this.inputType); };
  wasChanged(): boolean {
    return this.originalValue != this.value;
  }
  rowHelper: rowHelper<any>;
  entity: any;



}