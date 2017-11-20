import { Column } from './data';
import { RestList } from './restList';
import { makeTitle, isFunction } from './common';
import { ColumnSetting, dropDownItem, FilteredColumnSetting, ModelState } from './utils';

export class ColumnCollection<rowType> {
  constructor(public currentRow: () => any, private allowUpdate: () => boolean, private _filterData: (f: rowType) => void, private scopeToRow: (r: rowType, andDo: () => void) => void) {

    if (this.allowDesignMode == undefined) {
      if (location.search)
        if (location.search.toLowerCase().indexOf('design=y') >= 0)
          this.allowDesignMode = true;
    }
  }
  private settingsByKey: any = {};
  _optionalKeys() {
    if (!this.currentRow())
      return [];
    let r = this.currentRow();
    let result: Array<any> = [];
    Object.keys(r).forEach(key => {
      if (typeof (r[key]) != 'function')

        result.push(key);
    });
    return result;
  }
  allowDesignMode: boolean;
  add(...columns: ColumnSetting<rowType>[]): void;
  add(...columns: string[]): void;
  add(...columns: any[]) {
    for (let c of columns) {
      let s: ColumnSetting<rowType>;
      let x = c as ColumnSetting<rowType>;
      if (x.column) {
        if (!x.key && x.column.caption)
          x.key = x.column.key;
        if (!x.caption && x.column.caption)
          x.caption = x.column.caption;

      }

      if (x.key || x.getValue) {
        s = x;
      }
      else {
        s = { key: c, caption: makeTitle(c) };
      }
      if (s.key) {
        let existing: ColumnSetting<rowType> = this.settingsByKey[s.key];
        if (!s.caption)
          s.caption = makeTitle(s.key);
        if (s.dropDown) {
          let orig = s.dropDown.items;
          let result: dropDownItem[] = [];
          s.dropDown.items = result;
          let populateBasedOnArray = (arr: Array<any>) => {
            for (let item of arr) {
              let type = typeof (item);
              if (type == "string" || type == "number")
                result.push({ id: item, caption: item });
              else {
                if (!s.dropDown.idKey) {
                  if (item['id'])
                    s.dropDown.idKey = 'id';
                  else {
                    for (let keyInItem of Object.keys(item)) {
                      s.dropDown.idKey = keyInItem;
                      break;
                    }
                  }
                }
                if (!s.dropDown.captionKey) {
                  if (item['caption'])
                    s.dropDown.captionKey = 'caption';
                  else {
                    for (let keyInItem of Object.keys(item)) {
                      if (keyInItem != s.dropDown.idKey) {
                        s.dropDown.captionKey = keyInItem;
                        break;
                      }
                    }
                  }
                }
                let p = { id: item[s.dropDown.idKey], caption: item[s.dropDown.captionKey] };
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

            new RestList(s.dropDown.source.source).get({ limit: 5000 }).then(arr => populateBasedOnArray(arr));
          }
        }
        if (existing) {
          if (s.caption)
            existing.caption = s.caption;
          if (s.cssClass)
            existing.cssClass = s.cssClass;
          if (s.getValue)
            existing.getValue = s.getValue;
          if (s.readonly)
            existing.readonly = s.readonly;
          if (s.inputType)
            existing.inputType = s.inputType;
          if (s.click)
            existing.click = s.click;
          if (s.defaultValue)
            existing.defaultValue = s.defaultValue;
          if (s.onUserChangedValue)
            existing.onUserChangedValue = s.onUserChangedValue;


        }
        else {
          this.items.push(s);
          this.settingsByKey[s.key] = s;
        }

      }
      else
        this.items.push(s);


    }
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
  userFilter: any = {};
  filterRows(col: FilteredColumnSetting<any>) {
    col._showFilter = false;
    this._filterData(this.userFilter);
  }
  clearFilter(col: FilteredColumnSetting<any>) {
    col._showFilter = false;
    this.userFilter[col.key] = undefined;
    this._filterData(this.userFilter);
  }
  _shouldShowFilterDialog(col: FilteredColumnSetting<any>) {
    return col._showFilter;
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
    if (!col.key)
      return false
    return !col.readonly;
  }
  _click(col: ColumnSetting<any>, row: any) {

    this.scopeToRow(row, () => {
      col.click(row, what => {
        this.scopeToRow(row, what);
      });
    });


  }

  _getColValue(col: ColumnSetting<any>, row: any) {
    let r;
    if (col.getValue) {
      this.scopeToRow(row, () => {
        r = col.getValue(row)
        if (r instanceof Column)
          r = r.value;
      });

    }
    else r = row[col.key];
    if (col.inputType == "date")
      r = new Date(r).toLocaleDateString();
    if (col.dropDown) {
      if (col.dropDown.items instanceof Array)
        for (let item of col.dropDown.items) {
          let i: dropDownItem = item;
          if (i.id == r)
            return i.caption;
        }
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
        let errors = m.modelState[col.key];
        if (errors && errors.length > 0)
          return errors[0];
      }

    }
    return undefined;
  }
  autoGenerateColumnsBasedOnData() {
    if (this.items.length == 0) {
      let r = this.currentRow();
      if (r) {
        this._optionalKeys().forEach(key => {

          this.items.push({
            key: key,
            caption: makeTitle(key)
          });
        });

      }
    }



  }
  columnSettingsTypeScript() {
    let result = `columnSettings:[`;
    for (var i = 0; i < this.items.length; i++) {
      let item = this.items[i];
      result += `
    { key:"${item.key}"`

      let addString = (k: string, v: string) => {
        if (v) {
          result += `, ${k}:"${v.replace('"', '""')}"`;
        }
      }
      let addBoolean = (k: string, v: boolean) => {
        if (v) {
          result += `, ${k}:${v}`;
        }
      }
      if (item.caption != makeTitle(item.key))
        addString('caption', item.caption);
      addString('inputType', item.inputType);
      addBoolean('readonly', item.readonly);


      result += ` },`
    }
    result += `
]`;
    return result;
  }
  _colValueChanged(col: ColumnSetting<any>, r: any) {
    if (r.__modelState) {
      let m = <ModelState<any>>r.__modelState();
      m.modelState[col.key] = undefined;
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
