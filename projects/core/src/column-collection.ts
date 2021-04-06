import { Entity } from "./entity";
import { FilterHelper } from "./filter/filter-helper";
import { DataControlSettings, ValueListItem, DataControlInfo, valueOrEntityExpressionToValue, ColumnSettings,  configDataControlField } from "./column-interfaces";
import { Column } from "./column";
import { Context } from "./context";
import { isBoolean, isFunction } from "util";
import { IdEntity } from './id-entity';
import { ValueListColumn } from "./columns/value-list-column";



export class ColumnCollection<rowType extends Entity = Entity> {
  constructor(public currentRow: () => Entity, private allowUpdate: () => boolean, public filterHelper: FilterHelper<rowType>, private showArea: () => boolean) {


  }
  __showArea() {
    return this.showArea();

  }
  __getColumn(map: DataControlSettings, record: Entity) {
    let result: Column;
    if (record)
      result = record.columns.find(map.column);
    if (!result)
      result = map.column;
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
      if (!x.column && c instanceof Column) {
        x = {
          column: c,
        }

      }
      if (x.column) {
        decorateDataSettings(x.column,x);
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
      else if (isFunction(orig)) {
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
      if (r instanceof Column)
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
      if (isFunction(col.cssClass)) {
        let anyFunc: any = col.cssClass;
        return anyFunc(row);
      }
      else return col.cssClass;
    return '';

  }

  _getError(col: DataControlSettings, r: Entity) {
    if (!col.column)
      return undefined;
    return this.__getColumn(col, r).validationError;
  }
  autoGenerateColumnsBasedOnData(r: Entity) {
    if (this.items.length == 0) {

      if (r) {
        let ignoreCol: Column = undefined;
        if (r instanceof IdEntity)
          ignoreCol = r.id;
        for (const c of r.columns) {
          if (c != ignoreCol)
            this.add(c);
        }


      }
    }



  }
  __columnSettingsTypeScript() {
    let memberName = 'x';
    if (this.currentRow())
      memberName = this.currentRow().defs.name;
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
  __columnTypeScriptDescription(c: DataControlSettings, memberName: string) {
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
      columnMember += memberName + "." + c.column.defs.key;
      if (c == c.column)
        columnMember += '/*equal*/';
      if (c.caption != c.column.defs.caption) {
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

export function decorateDataSettings(col: Column<any>, x: DataControlSettings, context?: Context) {
  if (!x.caption && col.defs.caption)
    x.caption = col.defs.caption;
  if (!x.inputType && col.defs.inputType)
    x.inputType = col.defs.inputType;
  let settings: ColumnSettings = col["__settings"];
  if (x.readOnly == undefined) {
    if (settings.sqlExpression)
      x.readOnly = true;
    else
      if (!context) {
        if (isBoolean(settings.allowApiUpdate))
          x.readOnly = !settings.allowApiUpdate;
      }
      else
        x.readOnly = !context.isAllowed(settings.allowApiUpdate);
  }


  col[__displayResult] = __getDataControlSettings(col);
  if (col[__displayResult]) {
    if (!x.getValue && col[__displayResult].getValue) {
      x.getValue = e => {
        let c: Column = col;
        if (e)
          c = e.columns.find(c) as Column;
        if (!c[__displayResult])
          c[__displayResult] = __getDataControlSettings(col);
        return c[__displayResult].getValue(e);
      };
    }
    if (!x.click && col[__displayResult].click) {
      x.click = e => {
        let c: Column = col;
        if (e)
          c = e.columns.find(c) as Column;
        if (!c[__displayResult])
          c[__displayResult] = __getDataControlSettings(col);
        c[__displayResult].click(e);
      };
    }
    if (!x.allowClick && col[__displayResult].allowClick) {
      x.allowClick = e => {
        let c: Column = col;
        if (e)
          c = e.columns.find(c) as Column;
        if (!c[__displayResult])
          c[__displayResult] = __getDataControlSettings(col);
        return c[__displayResult].allowClick(e);
      };
    }
    for (const key in col[__displayResult]) {
      if (col[__displayResult].hasOwnProperty(key)) {
        const val = col[__displayResult][key];
        if (val !== undefined && x[key] === undefined) {
          x[key] = val;
        }
      }
    }
  }
}
const  __displayResult =  Symbol("__displayResult");

export function __getDataControlSettings(col: Column): DataControlSettings {
  if (col[configDataControlField]) {
      let r = {};
      col[configDataControlField](r);
      return r;
  } if (col instanceof ValueListColumn) {
      col[configDataControlField] = (x: DataControlSettings) => {
          x.valueList = col.getOptions();
      };
  }
  return undefined;
}