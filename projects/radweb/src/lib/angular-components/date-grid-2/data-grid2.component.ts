import { GridSettings, RowButton, isNewRow, Column,Entity, ColumnSetting } from '../../core/utils';
import { Component, OnChanges, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { isFunction } from '../../core/common';
@Component({
  selector: 'data-grid2',
  template: `
123
  <div *ngIf="settings&&settings.columns&& settings.columns.designMode">
<pre>
{{settings.columns.__columnSettingsTypeScript()}}
</pre>


  </div>
  <div  >
  <div  *ngIf="settings && records && displayVCR">
    <button class="btn glyphicon glyphicon-pencil btn-primary" *ngIf="settings.columns.allowDesignMode" (click)="settings.columns.designMode=!settings.columns.designMode"></button>
    
    
    

        
 
  </div>

<div>
    <div class="dataGrid" #dataGridDiv *ngIf="settings&&settings.columns"[style.height]="_getHeight()" >
    <div class="inner-wrapper">
      <div class="dataGridHeaderArea">
        <div class="dataGridRow">
          <div class="dataGridHeaderCell headerWithFilter" *ngFor="let map of settings.columns.getGridColumns()"  [style.flex]="getColFlex(map)" [style.width]="getColWidth(map)" draggable="true" (dragstart)="dragStart(map)" (dragover)="dragOver(map,$event)" (drop)="onDrop(map)" >

            <span (click)="settings.sort(map.column)">{{map.caption}}</span>


            <span class="glyphicon glyphicon-filter filterButton" [class.filteredFilterButton]="isFiltered(map.column)"
              (click)="settings.columns.showFilterDialog(map)"></span>
            <div class="filterDialog col-sm-4" *ngIf="settings.columns._shouldShowFilterDialog(map)">
              <div class="form-group">
                <data-control [settings]="settings.columns" [map]="map" [record]="settings.columns.filterHelper.filterRow" [notReadonly]="true"></data-control>
              </div>
              <button class="btn glyphicon glyphicon-ok btn-success" (click)="settings.columns.filterRows(map)"></button>
              <button class="btn glyphicon glyphicon-remove btn-primary" (click)="settings.columns.clearFilter(map)"></button>

            </div>
            <span class="glyphicon glyphicon-chevron-up pull-right" *ngIf="settings.sortedAscending(map.column)"></span>
            <span class="glyphicon glyphicon-chevron-down pull-right" *ngIf="settings.sortedDescending(map.column)"></span>
            <column-designer [settings]="settings.columns" [map]="map"></column-designer>





          </div>
          <div class="dataGridButtonHeaderCell" *ngIf="rowButtons&& rowButtons.length>0&&displayButtons" [class.col-xs-1]="rowButtons&&rowButtons.length<3" ></div>
        </div>
      </div>
      <div class="dataGridBodyArea">
        <div class="dataGridRow" *ngFor="let record of records"  [className]="_getRowClass(record)" (click)="rowClicked(record)">

          <div class="dataGridDataCell" *ngFor="let map of settings.columns.getGridColumns()" [className]="_getRowColumnClass(map,record)" [style.flex]="getColFlex(map)" [style.width]="getColWidth(map)">
            <data-control [settings]="settings.columns" [map]="map" [record]="record"></data-control>
          </div>
          <div class="dataGridButtonCell" *ngIf="rowButtons.length>0&&displayButtons" style="white-space:nowrap">
            <span *ngFor="let b of rowButtons">
              <button class="btn {{getButtonCssClass(b,record) }}" *ngIf="b.visible(record)" (click)="b.click(record)">{{b.name}}</button>
            </span>
          </div>
        </div>

        </div>
        </div>
        </div>
        <div class="dataGridFooterArea" *ngIf="records">
        <div class="dataGridFooterButtonGroup">
        <button class="btn glyphicon glyphicon glyphicon-cog" (click)="settings.userChooseColumns()"></button>
    <button class="btn glyphicon glyphicon glyphicon-filter" (click)="dataFilter.userFilterButton()"></button>
    {{rightToLeft?'שורות בדף': 'lines per page'}}
  <select class="form-control" style="width:80px;display:inline-block" [(ngModel)]="settings.rowsPerPage" (change)="settings.getRecords()">
          <option *ngFor="let r of settings.rowsPerPageOptions" value="{{r}}">{{r}}</option>
      </select></div>
      <div class="dataGridFooterButtonGroup" *ngIf="!rightToLeft">
      <button class="btn glyphicon glyphicon-step-backward" (click)="settings.firstPage()"></button>
      <button class="btn glyphicon glyphicon-chevron-left" [disabled]="settings.page==1" (click)="settings.previousPage()"></button>
      Page {{settings.page}} of {{getTotalRows()}} 
    <button class="btn btn-sm glyphicon glyphicon-chevron-right"[disabled]="!(records.items&& records.items.length>0)" (click)="settings.nextPage()"></button>
    <button class="btn  btn-primary glyphicon glyphicon-plus" *ngIf="settings.allowUpdate &&settings.allowInsert" (click)="settings.addNewRow()"></button>
    </div>
    <div class="dataGridFooterButtonGroup" *ngIf="rightToLeft">
      <button class="btn glyphicon glyphicon-step-forward" (click)="settings.firstPage()"></button>
      <button class="btn glyphicon glyphicon-chevron-right" [disabled]="settings.page==1" (click)="settings.previousPage()"></button>
      עמוד {{settings.page}} מתוך {{getTotalRows()}} 
    <button class="btn btn-sm glyphicon glyphicon-chevron-left"[disabled]="!(records.items&& records.items.length>0)" (click)="settings.nextPage()"></button>
    <button class="btn  btn-primary glyphicon glyphicon-plus" *ngIf="settings.allowUpdate &&settings.allowInsert" (click)="settings.addNewRow()"></button>
    </div>
    
        

        <Data-Filter [settings]="settings" #dataFilter></Data-Filter>
        <div *ngIf="settings.showSelectColumn" class="selectColumnsArea">
        Select Columns
        <ol>
        <li *ngFor="let c of settings.currList; let i=index">
            <select [(ngModel)]="settings.currList[i]" class="form-control selectColumnCombo" (change)="settings.columns.colListChanged()">
                <option *ngFor="let o of settings.origList" [ngValue]="o">{{o.caption}}</option>
            </select>
            <button class="btn btn-sm glyphicon glyphicon-trash" *ngIf="settings.currList.length>1" (click)="settings.deleteCol(c)"></button>
            <button class="btn btn-sm  glyphicon glyphicon-plus" (click)="settings.addCol(c)"></button>
            <button class="btn btn-sm  glyphicon glyphicon-chevron-down" *ngIf="i<settings.currList.length-1"(click)="settings.columns.moveCol(c,1)"></button>
            <button class="btn btn-sm  glyphicon glyphicon-chevron-up" *ngIf="i>0" (click)="settings.columns.moveCol(c,-1)"></button>
        </li>
      </ol>
      <button (click)="settings.resetColumns()" class="btn glyphicon glyphicon-repeat"></button>
      </div>
        </div>
  </div>
  <data-area *ngIf="!settings.hideDataArea" [settings]="settings" [columns]="2"></data-area>
  `,
  styles: [`
  .inner-wrapper {
    display: inline-block;
  }
    .dataGrid{
    overflow:auto;
    border:1px solid #e0e0e0;
  }
  .dataGridBodyArea{

  }
  .dataGridHeaderCell{
    
  }
  .dataGridButtonHeaderCell{

  }
  .dataGridButtonCell{

  }
  .dataGridDataCell ,.dataGridHeaderCell{
    
    
  }
  .dataGridRow{
    display:flex;
    
    
  }

  .dataGridHeaderArea{
    position: -webkit-sticky;
    position:sticky;
    top:0;
    clear:both;
    background-color:rgb(245, 245, 245);
    z-index:3;
    
  }
  .dataGridFooterButtonGroup{
    display:inline-block;
  }
  .dataGridFooterArea{
    
    width:100%;
    padding:4px;
    
    bottom:0;
    left:0;
    background-color:rgb(245, 245, 245);
  }

  /* styling */
  

  .dataGridHeaderCell,.dataGridDataCell{
    padding:4px;
  }
  .dataGridHeaderCell{
 
    height:36px;
    font-weight:bold;
  }
  .dataGridDataCell{
    border-top:1px solid #e0e0e0;
  }
  .dataGridFooterArea{
    border:1px solid #e0e0e0;
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
    width:200px;

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
.selectColumnCombo{
  display:inline-block;
  width:auto;
}
.selectColumnsArea{
  display:block;
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



export class DataGrid2Component implements OnChanges, AfterViewInit {
  ngAfterViewInit(): void {
    if (window && window.getComputedStyle && this.dataGridDiv) {
      this.rightToLeft = window.getComputedStyle(this.dataGridDiv.nativeElement, null).getPropertyValue('direction') == 'rtl';
      console.log(this.rightToLeft);
    }
  }
  getColFlex(map: ColumnSetting<any>) {
    return '0 0 ' + this.getColWidth(map);
  }
  getColWidth(map:ColumnSetting<any>)
  {
    let x = this.settings.columns.__dataControlStyle(map);
    if (!x)
      x = '200px';
    return  x;
  }

  test() {
    //this.dataGridDiv.nativeElement.scrollTop = 0;
  }
  rightToLeft = false;
  @ViewChild('dataGridDiv')
  dataGridDiv: ElementRef;
  getTotalRows() {
    if (this.settings.totalRows)
      return Math.ceil(this.settings.totalRows / this.settings.rowsPerPage);
    return 'many';
  }
  tempDragColumn: Column<any>;
  dragStart(x: Column<any>) {
    this.tempDragColumn = x;

  }
  dragOver(x: Column<any>, event: any) {
    event.preventDefault();
  }
  onDrop(x: Column<any>) {
    let oldPosition = this.settings.columns.items.indexOf(this.tempDragColumn);
    this.settings.columns.items.splice(oldPosition, 1);
    let newPosition = this.settings.columns.items.indexOf(x);
    if (newPosition == oldPosition)
      newPosition++;
    this.settings.columns.items.splice(newPosition, 0, this.tempDragColumn);
    this.settings.columns.colListChanged();
  }
  @Input() width: string;
  @Input() height: string;
  _getHeight() {
    if (this.height) {
      if ((+this.height).toString() == this.height)
        return this.height + "px";
      return this.height;
    }
  }
  @Input() displayButtons = true;
  @Input() displayVCR = true;

  @Input() records: any;
  @Input() settings: GridSettings<any>;
  isFiltered(c: Column<any>) {
    return this.settings.columns.filterHelper.isFiltered(c);
  }

  getButtonCssClass(b: RowButton<any>, row: any) {
    if (!b.cssClass)
      return "";
    if (isFunction(b.cssClass))
      return (<((row: any) => string)>b.cssClass)(row);
    return b.cssClass.toString();

  }

  rowButtons: RowButton<any>[] = [];
  keys: string[] = [];
  private addButton(b: RowButton<any>) {
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

  catchErrors(what: any, r: Entity<any>) {
    what.catch((e: any) => {
      this.showError(r);

    });


  }
  private showError(row: Entity<any>) {
    let message = row.error;
    if (!message)
      message = "";
    let foundStateErrors = false;
    row.__iterateColumns().forEach(c => {
      if (c.error) {
        if (!foundStateErrors) {
          foundStateErrors = true;
          message = "";
        }
        let m = c.caption + ": ";
        m += c.error;
        message += m + "\n";
      }
    });
    alert(message);
  }



  ngOnChanges(): void {

    if (!this.settings)
      return;


    this.rowButtons = [];
    if (this.settings.allowUpdate) {
      this.addButton({
        name: "",
        cssClass: "glyphicon glyphicon-ok btn-success",
        visible: r => r.wasChanged(),
        click: r => {
          this.catchErrors(this.settings._doSavingRow(r), r);
        },

      });
      this.addButton({
        name: "",
        cssClass: "btn btn-danger glyphicon glyphicon-ban-circle",
        visible: r => r.wasChanged(),
        click: r => {
          r.reset();
        }
      });


    }
    if (this.settings.allowDelete)
      this.addButton({
        name: '',
        visible: (r) => !isNewRow(r),
        click: r => {
          if (this.settings.setCurrentRow && this.settings.settings.confirmDelete) {
            this.settings.settings.confirmDelete(r, () => this.catchErrors(r.delete(), r));
          }
          else
            this.catchErrors(r.delete(), r);

        },
        cssClass: "btn-danger glyphicon glyphicon-trash"
      });
    if (this.settings._buttons)
      for (let b of this.settings._buttons) {
        this.addButton(b);
      }
    if (!this.records && this.settings) {
      this.settings.getRecords().then((r: any) => {
        this.records = r;

      });

    }

  }

  _getRowClass(row: any) {
    let r = 'dataGridRow ';
    if (this.settings.rowClass)
      r += this.settings.rowClass(row);
    if (row == this.settings.currentRow)
      r += " active";

    return r;
  }
  _getRowColumnClass(col: any, row: any) {
    return this.settings.columns._getColumnClass(col, row) + ' dataGridDataCell';
  }


}
