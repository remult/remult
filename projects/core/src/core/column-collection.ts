import { Entity } from "./entity";
import { FilterHelper } from "./filter/filter-helper";
import { ColumnInAreaDisplaySettings, DropDownItem, FilteredColumnSetting } from "./column-interfaces";
import { Column } from "./column";
import { Context } from "../context/Context";
import { isFunction } from "util";

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
    __getColumn(map: ColumnInAreaDisplaySettings<any>, record: Entity<any>) {
      let result: Column<any>;
      if (record)
        result = record.__getColumn(map.column);
      if (!result)
        result = map.column;
      return result;
    }
    __dataControlStyle(map: ColumnInAreaDisplaySettings<any>): string {
  
      if (map.width && map.width.trim().length > 0) {
        if ((+map.width).toString() == map.width)
          return map.width + "px";
        return map.width;
      }
      return undefined;
  
    }
    private settingsByKey: any = {};
  
    allowDesignMode: boolean;
    async add(...columns: ColumnInAreaDisplaySettings<rowType>[]): Promise<void>;
    async add(...columns: string[]): Promise<void>;
    async add(...columns: any[]) {
      var promises: Promise<void>[] = [];
      for (let c of columns) {
        if (!c)
          continue;
        let s: ColumnInAreaDisplaySettings<rowType>;
        let x = c as ColumnInAreaDisplaySettings<rowType>;
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
    async buildDropDown(s: ColumnInAreaDisplaySettings<any>) {
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
    moveCol(col: ColumnInAreaDisplaySettings<any>, move: number) {
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
    deleteCol(col: ColumnInAreaDisplaySettings<any>) {
      this.items.splice(this.items.indexOf(col), 1);
      this.colListChanged();
    }
    addCol(col: ColumnInAreaDisplaySettings<any>) {
      this.items.splice(this.items.indexOf(col) + 1, 0, { designMode: true });
      this.colListChanged();
    }
    designColumn(col: ColumnInAreaDisplaySettings<any>) {
      col.designMode = !col.designMode;
    }
  
    _getEditable(col: ColumnInAreaDisplaySettings<any>) {
      if (!this.allowUpdate())
        return false;
      if (!col.column)
        return false
      return !col.readonly;
    }
    _click(col: ColumnInAreaDisplaySettings<any>, row: any) {
      col.click(row);
    }
  
    _getColDisplayValue(col: ColumnInAreaDisplaySettings<any>, row: rowType) {
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
    _getColDataType(col: ColumnInAreaDisplaySettings<any>) {
      if (col.inputType)
        return col.inputType;
      return "text";
    }
    _getColumnClass(col: ColumnInAreaDisplaySettings<any>, row: any) {
  
      if (col.cssClass)
        if (isFunction(col.cssClass)) {
          let anyFunc: any = col.cssClass;
          return anyFunc(row);
        }
        else return col.cssClass;
      return '';
  
    }
  
    _getError(col: ColumnInAreaDisplaySettings<any>, r: Entity<any>) {
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
    __columnTypeScriptDescription(c: ColumnInAreaDisplaySettings<any>, memberName: string) {
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
    __changeWidth(col: ColumnInAreaDisplaySettings<any>, what: number) {
      let width = col.width;
      if (!width)
        width = '50';
      width = ((+width) + what).toString();
      col.width = width;
    }
    _colValueChanged(col: ColumnInAreaDisplaySettings<any>, r: any) {
  
      if (col.onUserChangedValue)
        col.onUserChangedValue(r);
  
    }
    items: ColumnInAreaDisplaySettings<any>[] = [];
    private gridColumns: ColumnInAreaDisplaySettings<any>[];
    private nonGridColumns: ColumnInAreaDisplaySettings<any>[];
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