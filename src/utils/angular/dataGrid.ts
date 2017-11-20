import { DataSettings, RowButton, ModelState, isNewRow } from '../utils';
import { Component, OnChanges, Input } from '@angular/core';
import { isFunction } from '../common';
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
            <span (click)="settings.sort(map.column)">{{map.caption}}</span>


            <span class="glyphicon glyphicon-filter filterButton" [class.filteredFilterButton]="false"
              (click)="settings.columns.showFilterDialog(map)"></span>
            <div class="filterDialog col-sm-4" *ngIf="settings.columns._shouldShowFilterDialog(map)">
              <div class="form-group">
                <data-control [settings]="settings.columns" [map]="map" [record]="settings.columns.userFilter" [notReadonly]="true"></data-control>
              </div>
              <button class="btn glyphicon glyphicon-ok btn-success" (click)="settings.columns.filterRows(map)"></button>
              <button class="btn glyphicon glyphicon-remove btn-primary" (click)="settings.columns.clearFilter(map)"></button>

            </div>
            <span class="glyphicon glyphicon-chevron-down pull-right" *ngIf="settings.sortedAscending(map.column)"></span>
            <span class="glyphicon glyphicon-chevron-up pull-right" *ngIf="settings.sortedDescending(map.column)"></span>
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



  @Input() records: any;
  @Input() settings: DataSettings<any>;


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

    if (!this.settings)
      return;


    this.rowButtons = [];
    if (this.settings.allowUpdate) {
      this.addButton({
        name: "",
        cssClass: "glyphicon glyphicon-ok btn-success",
        visible: r => r.wasChanged(),
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
        click: r => this.catchErrors(r.delete(), r),
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
    if (row == this.settings.currentRow)
      return "active";
    if (this.settings.rowClass)
      return this.settings.rowClass(row);
    return "";
  }


}
