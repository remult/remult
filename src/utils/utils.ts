import { makeTitle, isFunction } from './common';
import { FormsModule } from '@angular/forms';
import { rowButton, rowButtonBase } from './utils';
import { Column, Entity} from './data'
import { iDataColumnSettings, FilterBase, ColumnValueProvider } from './DataInterfaces';

import { Component, Input, OnChanges, Type, NgModule } from '@angular/core';
import { Routes } from '@angular/router';
import { CommonModule } from '@angular/common';

export * from './data';



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
            if (typeof (s.dropDown.source) == "string") {
              new RestList(s.dropDown.source).get({ limit: 5000 }).then(arr => populateBasedOnArray(arr));
            }
            else if (s.dropDown.source instanceof DataSettings) {
              s.dropDown.source.get({ limit: 5000 }).then(arr => populateBasedOnArray(arr.items));
            }
            else if (s.dropDown.source instanceof RestList) {
              s.dropDown.source.get({ limit: 5000 }).then(arr => populateBasedOnArray(arr));
            } else if (s.dropDown.source instanceof Entity) {
              new RestList(s.dropDown.source.name).get({ limit: 5000 }).then(arr => populateBasedOnArray(arr));
            }
            else {
              let x = s.dropDown.source as Promise<any>;
              if (x.then) {
                x.then(arr => populateBasedOnArray(arr));
              }
            }
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



export interface dataAreaSettings {
  columns: ColumnCollection<any>;
}


@Component({
  selector: 'data-area',
  template: `

<div class="form-horizontal" *ngIf="settings.columns&&settings.columns.currentRow()" >

        <div class="{{getColumnsClass()}}" *ngFor="let col of theColumns()">
            <div class="form-group {{settings.columns._getColumnClass(map,settings.columns.currentRow())}}" *ngFor="let map of col" >
                <div class="col-sm-{{labelWidth}}">
                    <label class="control-label" *ngIf="!map.designMode">{{map.caption}}</label>
                    <column-designer [settings]="settings.columns" [map]="map"></column-designer>
                </div>
                <div class="col-sm-{{12-labelWidth}}">
                    <data-control [settings]="settings.columns" [map]="map" [record]="settings.columns.currentRow()"></data-control>
                </div>
            </div>
        </div>
</div>


`
})
export class DataAreaCompnent implements OnChanges {

  ngOnChanges(): void {
    if (this.settings && this.settings.columns) {
      this.settings.columns.onColListChange(() => this.lastCols = undefined);
      let areaSettings = this.settings as DataAreaSettings<any>;
      if (areaSettings.settings) {
        if (areaSettings.settings.labelWidth)
          this.labelWidth = areaSettings.settings.labelWidth;
        if (areaSettings.settings.numberOfColumnAreas)
          this.columns = areaSettings.settings.numberOfColumnAreas;
      }
    }


  }
  getColumnsClass() {
    if (this.columns > 1)
      return "col-sm-" + 12 / this.columns;
  }


  lastCols: Array<ColumnSetting<any>[]>;

  theColumns(): Array<ColumnSetting<any>[]> {

    if (!this.lastCols) {

      let cols = this.settings.columns.getNonGridColumns();

      let r: Array<ColumnSetting<any>[]> = [];
      this.lastCols = r;
      for (var i = 0; i < this.columns; i++) {
        r.push([]);
      }
      let itemsPerCol = Math.round(cols.length / this.columns);
      for (var i = 0; i < cols.length; i++) {
        r[Math.floor(i / itemsPerCol)].push(cols[i]);
      }
    }
    return this.lastCols;
  }
  @Input() settings: dataAreaSettings = { columns: new ColumnCollection(() => undefined, () => false, null, (r, andDo) => andDo()) };
  @Input() labelWidth = 4;
  @Input() columns = 1;
}




@Component({
  selector: 'data-control',
  template: `
<span *ngIf="!_getEditable()" >{{settings._getColValue(map,record)}}</span>
<div *ngIf="_getEditable()" class="" [class.has-error]="settings._getError(map,record)">
    <div >
        <div [class.input-group]="showDescription()||map.click" *ngIf="!isSelect()">
            <div class="input-group-btn" *ngIf="map.click">
                <button type="button" class="btn btn-default" (click)="settings._click(map,record)" > <span class="glyphicon glyphicon-chevron-down"></span></button>
            </div>
            <input class="form-control"  [(ngModel)]="record[map.key]" type="{{settings._getColDataType(map)}}" (ngModelChange)="settings._colValueChanged(map,record)" />
            <div class="input-group-addon" *ngIf="showDescription()">{{settings._getColValue(map,record)}}</div>

        </div>
        <div *ngIf="isSelect()">
            <select  class="form-control" [(ngModel)]="record[map.key]" (ngModelChange)="settings._colValueChanged(map,record)" >
                <option *ngFor="let v of map.dropDown.items" value="{{v.id}}">{{v.caption}}</option>

            </select>
        </div>
    <span class="help-block" *ngIf="settings._getError(map,record)">{{settings._getError(map,record)}}</span>
    </div>
</div>`
})
export class DataControlComponent {
  @Input() map: ColumnSetting<any>;
  @Input() record: any;
  @Input() notReadonly: false;
  showDescription() {
    return this.map.key && this.map.getValue;
  }
  _getEditable() {
    if (this.notReadonly)
      return true;
    return this.settings._getEditable(this.map);
  }
  ngOnChanges(): void {

  }
  isSelect() {
    return this.map.dropDown;
  }
  @Input() settings: ColumnCollection<any>;
}
declare var $: any;
export class SelectPopup<rowType> {
  constructor(
    private modalList: DataSettings<rowType>, settings?: SelectPopupSettings) {
    this.modalId = makeid();
    if (settings) {
      if (settings.title)
        this.title = settings.title;
      if (settings.searchColumnKey)
        this.searchColumn = settings.searchColumnKey;
    }
    if (!this.title)
      this.title = "Select " + modalList.caption;
  }
  title: string;
  private search() {
    let s: any = {};
    s[this.searchColumn] = this.searchText + "*";

    this.modalList.get({
      isEqualTo: <rowType>s
    });
  }
  searchText: string;
  private searchColumn: string;

  modalId: string = "myModal";
  private onSelect: (selected: rowType) => void;
  modalSelect() {
    this.onSelect(this.modalList.currentRow);
    $("#" + this.modalId).modal('hide');
  }
  show(onSelect: (selected: rowType) => void) {
    if (!this.searchColumn) {
      for (let col of this.modalList.columns.items) {
        if (col.key != "id" && (!col.inputType || col.inputType == "text")) {
          this.searchColumn = col.key;
          break;
        }
      }
    }
    this.onSelect = onSelect;
    $("#" + this.modalId).modal('show');
  }
  searchColumnCaption() {
    for (let item of this.modalList.columns.items) {
      if (item.key == this.searchColumn)
        return item.caption;
    }
    return this.searchColumn;
  }
}
export interface SelectPopupSettings {
  title?: string;
  searchColumnKey?: string;
}

function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

@Component({
  selector: 'select-popup',
  template: `

<!-- Modal -->
<div class="modal fade"  *ngIf="settings && settings.popupSettings" id="{{settings.popupSettings.modalId}}" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
        <h4 class="modal-title" id="myModalLabel">{{settings.popupSettings.title}}</h4>
      </div>
      <div class="modal-body">
<div class="row">
<div class="col-sm-10">
        <div class="form-group">
    <label >Search</label>
    <input type="search" class="form-control" placeholder="{{settings.popupSettings.searchColumnCaption()}}"[(ngModel)]="settings.popupSettings.searchText" (ngModelChange)="settings.popupSettings.search()">
  </div>
</div>
        <data-grid [settings]="settings"></data-grid>
</div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary" (click)="settings.popupSettings.modalSelect()">Select</button>
      </div>
    </div>
  </div>
</div>`
})
export class SelectPopupComponent {
  @Input() settings: DataSettings<any>;
  @Input() dataView: dataView;

  ngOnChanges(): void {
    if (this.dataView && !this.settings) {
      this.settings = this.dataView.__getDataSettings();
      this.dataView.showSelectPopup = (x) => this.settings.showSelectPopup(() => x());
    }
  }
}




export interface dropDownOptions {

  items?: dropDownItem[] | string[] | any[];
  source?: Promise<any> | RestList<any> | string | DataSettings<any> | Entity;
  idKey?: string;
  captionKey?: string;
}

export interface dropDownItem {
  id?: any;
  caption?: any;
}


@Component({
  selector: 'column-designer',
  template: `
<div *ngIf="map.designMode" class="columnDesigner">
    <div class="form-group">
        <input type="text" class="form-control" [(ngModel)]="map.caption">
    </div>
    <label>Key</label>
    <div class="form-group">
        <select class="form-control" [(ngModel)]="map.key">
            <option value="" selected></option>
            <option  selected *ngFor="let k of settings._optionalKeys()">{{k}}</option>
        </select>
    </div>
    <label>Input Type</label>
    <div class="form-group">
        <select class="form-control" [(ngModel)]="map.inputType" placeholder="inputType">
            <option value="" selected>text</option>
            <option value="number">number</option>
            <option value="date">date</option>
            <option value="checkbox">checkbox</option>
        </select>
    </div>

    <div class="checkbox">

        Readonly <input type="checkbox"  [(ngModel)]="map.readonly">
    </div>


    <div class="form-group">

        <button class="btn btn-success glyphicon glyphicon-ok pull-left" (click)="settings.designColumn(map)"></button>
        <div class="btn-group pull-right">
                <button class="btn btn-danger glyphicon glyphicon-trash " (click)="settings.deleteCol(map)"></button>
                <button class="btn btn-primary glyphicon glyphicon-plus " (click)="settings.addCol(map)"></button>
                <button class="btn btn-primary glyphicon glyphicon-chevron-left" (click)="settings.moveCol(map,-1)"></button>
                <button class="btn btn-primary glyphicon glyphicon-chevron-right" (click)="settings.moveCol(map,1)"></button>
        </div>
    </div>
</div>
<span class="designModeButton pull-right">
<span class="glyphicon glyphicon-pencil " (click)="settings.designColumn(map)" *ngIf="settings.allowDesignMode"></span>
</span>
`
})
export class ColumnDesigner {
  @Input() map: ColumnSetting<any>;
  @Input() settings: ColumnCollection<any>;
}


@Component({
  selector: 'data-grid',
  template: `<div class="pull-right" *ngIf="settings && records">
    <button class="btn glyphicon glyphicon-pencil btn-primary" *ngIf="settings.columns.allowDesignMode" (click)="settings.columns.designMode=!settings.columns.designMode"></button>
    <button class="btn glyphicon glyphicon-chevron-left" *ngIf="settings.page>1" (click)="settings.previousPage()"></button>
    <button class="btn glyphicon glyphicon-chevron-right" *ngIf="records.items&& records.items.length>0" (click)="settings.nextPage()"></button>
    <button class="btn btn-primary glyphicon glyphicon-plus" *ngIf="settings.allowUpdate &&settings.allowInsert" (click)="settings.addNewRow()"></button>
  </div>

  <div *ngIf="settings&&settings.columns&& settings.columns.designMode">

    <pre>
  {{settings.columns.columnSettingsTypeScript()}}
  </pre>


  </div>
  <div >
    <table class="table table-bordered table-condensed table-hover table-striped" *ngIf="settings&&settings.columns">

      <thead>
        <tr>
          <th *ngFor="let map of settings.columns.getGridColumns()" class="headerWithFilter">
            <span (click)="settings.sort(map.key)">{{map.caption}}</span>


            <span class="glyphicon glyphicon-filter filterButton" [class.filteredFilterButton]="settings.columns.userFilter[map.key]"
              (click)="settings.columns.showFilterDialog(map)"></span>
            <div class="filterDialog col-sm-4" *ngIf="settings.columns._shouldShowFilterDialog(map)">
              <div class="form-group">
                <data-control [settings]="settings.columns" [map]="map" [record]="settings.columns.userFilter" [notReadonly]="true"></data-control>
              </div>
              <button class="btn glyphicon glyphicon-ok btn-success" (click)="settings.columns.filterRows(map)"></button>
              <button class="btn glyphicon glyphicon-remove btn-primary" (click)="settings.columns.clearFilter(map)"></button>

            </div>
            <span class="glyphicon glyphicon-chevron-down pull-right" *ngIf="settings.sortedAscending(map.key)"></span>
            <span class="glyphicon glyphicon-chevron-up pull-right" *ngIf="settings.sortedDescending(map.key)"></span>
            <column-designer [settings]="settings.columns" [map]="map"></column-designer>





          </th>
          <th *ngIf="rowButtons&& rowButtons.length>0" [class.col-xs-1]="rowButtons&&rowButtons.length<3" [class.col-xs-2]="rowButtons.length>=3"></th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let record of records" [className]="_getRowClass(record)" (click)="rowClicked(record)">

          <td *ngFor="let map of settings.columns.getGridColumns()" [className]="settings.columns._getColumnClass(map,record)">
            <data-control [settings]="settings.columns" [map]="map" [record]="record"></data-control>
          </td>
          <td *ngIf="rowButtons.length>0" style="white-space:nowrap">
            <span *ngFor="let b of rowButtons">
              <button class="btn {{getButtonCssClass(b,record) }}" *ngIf="b.visible(record)" (click)="b.click(record)">{{b.name}}</button>
            </span>
          </td>
        </tr>

      </tbody>
    </table>
  </div>
  <data-area *ngIf="!settings.hideDataArea" [settings]="settings" [columns]="2"></data-area>
  `,
  styles: [`.columnDesigner {
    background-color: white;
    position: absolute;
    padding: 10px;
    border-color: gray;
    border-width: 2px;
    border-style: solid;
    z-index: 800;
    border-radius: 5px;
    width: 300px;
}

    .columnDesigner .form-group {
        margin-right: 0;
        margin-left: 0;
    }

.filterDialog {
    background-color: white;
    position: absolute;
    padding: 10px;
    border-color: gray;
    border-width: 2px;
    border-style: solid;
    z-index: 800;
    border-radius: 5px;

}

    .filterDialog .form-group {
        margin-right: 0;
        margin-left: 0;
    }

.designModeButton span {
    visibility: hidden;
}

.designModeButton:hover span {
    visibility: visible
}

.headerWithFilter {
}
.headerWithFilter .filterButton{
    visibility:hidden;
}
    .headerWithFilter .filteredFilterButton {
        visibility: visible;
    }
    .headerWithFilter:hover .filterButton {
        visibility: visible;
    }

.filterButton {
}
table input {
    min-width:75px;
}
table select {
    min-width:100px
}`

  ]
}
)



export class DataGridComponent implements OnChanges {

  // Inspired by  https://medium.com/@ct7/building-a-reusable-table-layout-for-your-angular-2-project-adf6bba3b498

  @Input() records: any;
  @Input() settings: DataSettings<any>;
  @Input() dataView: dataView;

  getButtonCssClass(b: rowButtonBase, row: any) {
    if (!b.cssClass)
      return "";
    if (isFunction(b.cssClass))
      return (<((row: any) => string)>b.cssClass)(row);
    return b.cssClass.toString();

  }
  rowButtons: rowButtonBase[] = [];
  keys: string[] = [];
  private addButton(b: rowButtonBase) {
    if (!b.click)
      b.click = (r) => { };
    if (!b.visible)
      b.visible = r => true;
    if (!b.cssClass)
      b.cssClass = r => "btn";
    else if (!isFunction(b.cssClass)) {
      let x = b.cssClass;
      b.cssClass = <any>((r: any) => x);
    }

    this.rowButtons.push(b);
    return b;

  }
  rowClicked(row: any) {
    this.settings.setCurrentRow(row);
  }

  page = 1;
  nextPage() {
    this.page++;
  }
  previousPage() {
    if (this.page <= 1)
      return;
    this.page--;
  }

  catchErrors(what: any, r: any) {
    what.catch((e: any) => e.json().then((e: any) => {
      console.log(e);
      let s = new ModelState(r);
      r.__modelState = () => s;
      s.message = e.Message;
      s.modelState = e.ModelState;
      this.showError(s.message, s.modelState);

    }));

  }
  private showError(message: string, state: any) {
    if (!message)
      message = "";
    if (state) {
      for (let x in state) {

        let m = x + ": ";
        for (var i = 0; i < state[x].length; i++) {
          m += state[x][i];
        }
        if (m != message)
          message += "\n" + m;
      }

    }

    alert(message);
  }



  ngOnChanges(): void {
    if (this.dataView && !this.settings)
      this.settings = this.dataView.__getDataSettings();
    if (!this.settings)
      return;


    this.rowButtons = [];
    if (this.settings.allowUpdate) {
      this.addButton({
        name: "",
        cssClass: "glyphicon glyphicon-ok btn-success",
        visible: r => r.__wasChanged(),
        click: r => {
          let s = new ModelState(r);
          r.__modelState = () => s;
          this.settings._doSavingRow(s);

          if (s.isValid)
            this.catchErrors(r.save(), r);
          else
            this.showError(s.message, s.modelState);
        },

      });
      this.addButton({
        name: "",
        cssClass: "btn btn-danger glyphicon glyphicon-ban-circle",
        visible: r => r.__wasChanged(),
        click: r => {
          r.reset();
        }
      });


    }
    if (this.settings.allowDelete)
      this.addButton({
        name: '',
        visible: (r) => !isNewRow(r),
        click: r => this.catchErrors(r.delete(), r),
        cssClass: "btn-danger glyphicon glyphicon-trash"
      });
    if (this.settings._buttons)
      for (let b of this.settings._buttons) {
        this.addButton(b);
      }
    if (!this.records && this.settings) {
      this.settings.getRecords().then(r => {
        this.records = r;

      });

    }


  }

  _getRowClass(row: any) {
    if (row == this.settings.currentRow)
      return "active";
    if (this.settings.rowClass)
      return this.settings.rowClass(row);
    return "";
  }


}



export interface IDataAreaSettings<rowType> {
  columnSettings?: ColumnSetting<rowType>[];
  numberOfColumnAreas?: number;
  labelWidth?: number;
}

export class DataAreaSettings<rowType>
{

  constructor(public columns: ColumnCollection<rowType>, public settings: IDataAreaSettings<rowType>) {
    if (settings.columnSettings)
      columns.add(...settings.columnSettings);

  }
}

export class Lookup<lookupType> {

  constructor(url: string) {
    this.restList = new RestList<lookupType>(url);
  }

  private restList: RestList<lookupType>;
  private cache: any = {};

  get(filter: lookupType): lookupType {
    return this.getInternal(filter).value;
  }
  found(filter: lookupType): boolean {
    return this.getInternal(filter).found;
  }

  private getInternal(filter: lookupType): lookupRowInfo<lookupType> {
    if (filter) {
      let filterHasMember = false;
      for (let member in filter) {
        if (filter[member] != undefined)
          filterHasMember = true;
      }
      if (!filterHasMember)
        filter = undefined;
    }
    let find: getOptions<lookupType> = {};
    find.isEqualTo = filter;

    return this._internalGetByOptions(find);
  }

  _internalGetByOptions(find: getOptions<lookupType>): lookupRowInfo<lookupType> {
    let key = JSON.stringify(find);
    if (this.cache == undefined)
      this.cache = {};
    if (this.cache[key]) {
      return this.cache[key];
    } else {
      let res = new lookupRowInfo<lookupType>();
      this.cache[key] = res;
      if (find == undefined) {
        res.loading = false;
        res.found = false;
        return res;
      } else
        res.promise = this.restList.get(find).then(r => {
          res.loading = false;
          if (r.length > 0) {
            res.value = r[0];
            res.found = true;
          }
          return res;
        });
      return res;
    }
  }

  whenGet(r: lookupType) {
    return this.getInternal(r).promise.then(r => r.value);
  }
}



export class DataSettings<rowType>  {



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
        if (result != undefined)
          r[item.key] = result;

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
    let col = new ColumnCollection<rowType>(() => this.currentRow, () => this.allowUpdate, (userFilter) => {
      this.extraFitler = userFilter;
      this.page = 1;
      this.getRecords();
    }, (r, andDo) => this.__scopeToRow(r, andDo));
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
  currentRowAsRestListItemRow(): restListItem {
    if (!this.currentRow)
      return undefined;
    return <any>this.currentRow as restListItem;
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


  _buttons: rowButtonBase[] = [];

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
  constructor(restUrl?: string, settings?: IDataSettings<rowType>) {
    this.restList = new RestList<rowType>(restUrl);
    this.restList._rowReplacedListeners.push((old, curr) => {
      if (old == this.currentRow)
        this.setCurrentRow(curr);
    });
    this.lookup = new Lookup<rowType>(restUrl);
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
      this.getOptions = settings.get;

    }
    if (!this.caption && restUrl) {
      this.caption = makeTitle(restUrl.substring(restUrl.lastIndexOf('/') + 1));
    }
    this.popupSettings = new SelectPopup(this);
  }
  columns = new ColumnCollection<rowType>(() => this.currentRow, () => this.allowUpdate, (userFilter) => {
    this.extraFitler = userFilter;
    this.page = 1;
    this.getRecords();
  }, (r, andDo) => this.__scopeToRow(r, andDo));




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
  get(options: getOptions<rowType>) {
    this.getOptions = options;
    this.page = 1;
    return this.getRecords();
  }
  sort(key: string) {
    if (!this.getOptions)
      this.getOptions = {};
    if (this.getOptions.orderBy == key && this.getOptions.orderByDir == undefined) {
      this.getOptions.orderByDir = 'd';
    }
    else {
      this.getOptions.orderBy = key;
      this.getOptions.orderByDir = undefined;
    }
    this.getRecords();
  }
  sortedAscending(key: string) {
    if (!this.getOptions)
      return false;
    if (!key || key == '')
      return false;
    return this.getOptions.orderBy == key && !this.getOptions.orderByDir;
  }
  sortedDescending(key: string) {
    if (!this.getOptions)
      return false;
    if (!key || key == '')
      return false;
    return this.getOptions.orderBy == key && this.getOptions.orderByDir && this.getOptions.orderByDir.toLowerCase().startsWith('d');
  }

  private extraFitler: rowType;

  private getOptions: getOptions<rowType>;
  getRecords() {

    let opt: getOptions<rowType> = {};
    if (this.getOptions)
      opt = JSON.parse(JSON.stringify(this.getOptions));
    if (!opt.limit)
      opt.limit = 7;
    if (this.page > 1)
      opt.page = this.page;
    if (this.extraFitler) {
      if (!opt.isEqualTo)
        opt.isEqualTo = <rowType>{};
      for (let val in this.extraFitler) {
        if (opt.isEqualTo[val] == undefined)
          opt.isEqualTo[val] = this.extraFitler[val];
      }
    }

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
export interface IDataSettings<rowType> {
  allowUpdate?: boolean,
  allowInsert?: boolean,
  allowDelete?: boolean,
  hideDataArea?: boolean,

  columnSettings?: ColumnSetting<rowType>[],
  areas?: { [areaKey: string]: ColumnSetting<any>[] },
  columnKeys?: string[],
  rowCssClass?: (row: rowType) => string;
  rowButtons?: rowButton<rowType>[],
  get?: getOptions<rowType>,
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
  key?: string;
  caption?: string;
  readonly?: boolean;
  inputType?: string;
  designMode?: boolean;
  getValue?: (row: rowType) => any;
  cssClass?: (string | ((row: rowType) => string));
  defaultValue?: (row: rowType) => any;
  onUserChangedValue?: (row: rowType) => void;
  click?: rowEvent<rowType>;
  dropDown?: dropDownOptions;
  column?: Column<any>
}



export interface FilteredColumnSetting<rowType> extends ColumnSetting<rowType> {
  _showFilter?: boolean;
}
export interface rowButtonBase {

  name?: string;
  visible?: (r: any) => boolean;
  click?: (r: any) => void;
  cssClass?: (string | ((row: any) => string));

}
export interface rowButton<rowType> extends rowButtonBase {
  visible?: (r: rowType) => boolean;
  click?: (r: rowType) => void;
  cssClass?: (string | ((row: rowType) => string));

}



export class RestList<T extends hasId> implements Iterable<T>{
  [Symbol.iterator](): Iterator<T> {
    return this.items[Symbol.iterator]();
  }


  items: (restListItem & T)[] = [];
  constructor(private url: string) {

  }
  _rowReplacedListeners: ((oldRow: T, newRow: T) => void)[] = [];

  private map(item: T): restListItem & T {

    let x = <any>item;
    let id = x.id;
    let orig = JSON.stringify(item);
    x.__wasChanged = () => orig != JSON.stringify(item) || isNewRow(item);
    x.reset = () => {
      if (isNewRow(item)) {
        this.items.splice(this.items.indexOf(x), 1);
        this._rowReplacedListeners.forEach(y => y(x, undefined));
      }
      else
        this.replaceRow(item, JSON.parse(orig));
    }

    x.save = () => this.save(id, x);
    x.delete = () => {
      return fetch(this.url + '/' + id, { method: 'delete', credentials: 'include' }).then(() => { }, onError).then(() => {
        this.items.splice(this.items.indexOf(x), 1);
        this._rowReplacedListeners.forEach(y => y(x, undefined));
      });

    }
    return <restListItem & T>x;
  }
  lastGetId = 0;
  get(options?: getOptions<T>) {

    let url = new urlBuilder(this.url);
    if (options) {
      url.addObject({
        _limit: options.limit,
        _page: options.page,
        _sort: options.orderBy,
        _order: options.orderByDir
      });
      url.addObject(options.isEqualTo);
      url.addObject(options.isGreaterOrEqualTo, "_gte");
      url.addObject(options.isLessOrEqualTo, "_lte");
      url.addObject(options.isGreaterThan, "_gt");
      url.addObject(options.isLessThan, "_lt");
      url.addObject(options.isDifferentFrom, "_ne");
      url.addObject(options.otherUrlParameters);
    }

    let getId = ++this.lastGetId;

    return myFetch(url.url).then(r => {
      let x: T[] = r;
      let result = r.map((x: any) => this.map(x));
      if (getId == this.lastGetId)
        this.items = result;
      return result;
    });
  }
  add(): T {
    let x: newItemInList = { newRow: true };
    this.items.push(this.map(x as any as T));
    return x as any as T;
  }
  replaceRow(originalRow: any, newRow: any) {
    newRow = this.map(newRow);
    this.items[this.items.indexOf(originalRow)] = newRow;
    this._rowReplacedListeners.forEach(x => x(originalRow, newRow));
  }
  private save(id: any, c: restListItem & T) {

    let h = new Headers();
    h.append('Content-type', "application/json");
    if (isNewRow(c))
      return myFetch(this.url, {
        method: 'post',
        headers: h,
        body: JSON.stringify(c)
      }).then(response => {
        this.replaceRow(c, response);
      });
    else {

      return myFetch(this.url + '/' + id, {
        method: 'put',
        headers: h,
        body: JSON.stringify(c)
      }).then(response => {

        this.replaceRow(c, response);
      });
    }
  }

}
class urlBuilder {
  constructor(public url: string) {
  }
  add(key: string, value: any) {
    if (value == undefined)
      return;
    if (this.url.indexOf('?') >= 0)
      this.url += '&';
    else
      this.url += '?';
    this.url += encodeURIComponent(key) + '=' + encodeURIComponent(value);
  }
  addObject(object: any, suffix = '') {
    if (object != undefined)
      for (var key in object) {
        this.add(key + suffix, object[key]);
      }
  }
}
function myFetch(url: string, init?: RequestInit): Promise<any> {
  if (!init)
    init = {};
  init.credentials = 'include';
  return fetch(url, init).then(onSuccess, error => {

  });

}
function onSuccess(response: Response) {

  if (response.status >= 200 && response.status < 300)
    return response.json();
  else throw response;

}
function onError(error: any) {
  throw error;
}
interface newItemInList {
  newRow: boolean;
}
export interface hasId {
  id?: any;
}

export interface restListItem {
  save: () => void;
  delete: () => void;
  __wasChanged: () => boolean;
  reset: () => void;
}
export interface getOptions<T> {
  isEqualTo?: T;
  isGreaterOrEqualTo?: T;
  isLessOrEqualTo?: T;
  orderBy?: string;
  orderByDir?: string;
  page?: number;
  limit?: number;
  isGreaterThan?: T;
  isLessThan?: T;
  isDifferentFrom?: T;
  otherUrlParameters?: any;

}



export class lookupRowInfo<type> {
  found = false;
  loading = true;
  value: type = {} as type;
  promise: Promise<lookupRowInfo<type>>

}
export class AppHelper {
  constructor() {

  }
  Routes: Routes =
    [
    ];
  menues: MenuEntry[] = [];

  Components: Type<any>[] = [DataGridComponent, DataAreaCompnent, DataControlComponent, ColumnDesigner, SelectPopupComponent];

  Register(component: Type<any>) {
    this.Components.push(component);
    let name = component.name;
    if (this.Routes.length == 0)
      this.Routes.push({ path: '', redirectTo: '/' + name, pathMatch: 'full' });
    this.Routes.splice(0, 0, { path: name, component: component });
    this.menues.push({
      path: '/' + name,
      text: name
    });
  }
  Add(c: Type<any>) {
    this.Components.push(c);
  }

}
export interface MenuEntry {
  path: string,
  text: string
}
export function getDayOfWeek(date: string) {
  return dateFromDataString(date).getDay();
}
export function getDayOfWeekName(date: string) {
  return dateFromDataString(date).toLocaleDateString("en-us", { weekday: "long" });
}
export function dateFromDataString(date: string) {
  let from = date.split('-');
  return new Date(+from[2], +from[1] - 1, +from[0]);
}
export function dateToDataString(date: string) {
  var d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}
function isNewRow(r: any) {
  if (r) {
    let nr: newItemInList = r as any as newItemInList;
    return (nr.newRow)
  }
  return false;
}


export function init<T>(item: T, doInit: (i: T) => void): T {
  doInit(item);
  return item;
}




export class textColumn extends Column<string>{
  constructor(settingsOrCaption: iDataColumnSettings | string) {
    super(settingsOrCaption);
  }
}
export class dateColumn extends Column<string>{
  constructor(settingsOrCaption: iDataColumnSettings | string) {
    super(settingsOrCaption);
    if (!this.inputType)
      this.inputType = 'date';
  }


}
export class numberColumn extends Column<number>{
  constructor(settingsOrCaption: iDataColumnSettings | string) {
    super(settingsOrCaption);
    if (!this.inputType)
      this.inputType = 'number';
  }
}




export class dataView {
  forEach(what: () => void): any {
    this.initDataSettings();
    this.dataSettings.items.forEach(r => {
      this.dataSettings.__scopeToRow(r, what);
    });
  }
  refreshData(): any {
    this.initDataSettings();
    let getOptions = {} as getOptions<any>;
    applyWhereToGet(this.settings.where, getOptions);
    this.dataSettings.get(getOptions);
  }

  constructor(private settings?: IdataViewSettings) {
  }
  addArea(settings: IDataAreaSettings<any>) {
    this.initDataSettings();
    return this.dataSettings.addArea(settings);
  }
  showSelectPopup: (onSelect: () => void) => void;
  dataSettings: DataSettings<any>;
  __getDataSettings(): any {

    this.initDataSettings();
    return this.dataSettings;
  }
  private initDataSettings() {
    if (this.dataSettings)
      return;
    let dataSettings: IDataSettings<any> = {
      columnSettings: this.settings.displayColumns
    };
    if (this.settings.allowUpdate)
      dataSettings.allowUpdate = this.settings.allowUpdate;
    if (this.settings.allowInsert)
      dataSettings.allowInsert = this.settings.allowInsert;
    if (this.settings.allowDelete)
      dataSettings.allowDelete = this.settings.allowDelete;
    if (this.settings.onEnterRow)
      dataSettings.onEnterRow = this.settings.onEnterRow;
    if (this.settings.onNewRow)
      dataSettings.onNewRow = this.settings.onNewRow;
    if (this.settings.onSavingRow)
      dataSettings.onSavingRow = this.settings.onSavingRow;
    if (this.settings.where) {
      dataSettings.get = {};
      applyWhereToGet(this.settings.where, dataSettings.get);

    }
    if (this.settings.numOfColumnsInGrid != undefined)
      dataSettings.numOfColumnsInGrid = this.settings.numOfColumnsInGrid;
    let result = new DataSettings(this.settings.from.name, dataSettings);
    let cvp = new dataSettingsColumnValueProvider(result);
    for (let key in this.settings.from) {
      let col = (<hasIndex>this.settings.from)[key];
      if (col instanceof Column) {
        col.__valueProvider = cvp;
      }

    }
    if (this.settings.relations) {
      if (this.settings.relations instanceof Array) {
        this.settings.relations.forEach(r => new relationColumnValueProvider(r.to, r.on, cvp));
      }
      else {
        let r = this.settings.relations as IRelation;
        if (r.to && r.on)
          new relationColumnValueProvider(r.to, r.on, cvp);
      }
    }
    this.dataSettings = result;
  }
}
interface hasIndex {
  [key: string]: any;
}
function applyWhereToGet(where: FilterBase[] | FilterBase, options: getOptions<any>) {
  if (!options.otherUrlParameters)
    options.otherUrlParameters = {};
  if (where instanceof Array) {
    where.forEach(w => {
      w.__addToUrl((k, v) => { options.otherUrlParameters[k] = v });
    });
  }
  else {
    let y = where as FilterBase;
    if (y && y.__addToUrl)
      y.__addToUrl((k, v) => { options.otherUrlParameters[k] = v });
  }

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
class relationColumnValueProvider implements ColumnValueProvider {

  currentRow: () => any;
  constructor(to: Entity, on: FilterBase | FilterBase[], ds: dataSettingsColumnValueProvider) {



    for (let key in to) {
      let col = (<hasIndex>to)[key];
      if (col instanceof Column) {
        col.__valueProvider = this;
      }

    }

    let l = new DataSettings(to.name).lookup;
    this.currentRow = () => {
      let get: getOptions<any> = {};
      applyWhereToGet(on, get);
      return l._internalGetByOptions(get).value;
    }

  }
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
export interface IdataViewSettings {
  from: Entity;
  numOfColumnsInGrid?: number;
  relations?: IRelation | IRelation[];
  displayColumns?: ColumnSetting<any>[];
  where?: FilterBase[] | FilterBase;
  onEnterRow?: () => void;
  onNewRow?: () => void;
  onSavingRow?: (modelState: ModelState<any>) => void;
  allowUpdate?: boolean,
  allowInsert?: boolean,
  allowDelete?: boolean,
}
export interface IRelation {
  to: Entity;
  on: FilterBase[] | FilterBase;
}

@NgModule({
  imports: [
    FormsModule, CommonModule
  ],
  declarations:
    [DataGridComponent, DataAreaCompnent, DataControlComponent, ColumnDesigner, SelectPopupComponent]
  ,
  providers: [],
  bootstrap: [],
  exports: [DataGridComponent, DataAreaCompnent, SelectPopupComponent]

})
export class radWebModule { }
