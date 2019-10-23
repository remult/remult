
import { ColumnCollection, DataAreaSettings, dataAreaSettings, ColumnSetting } from '../../core/utils';

import { Component, OnChanges, Input } from '@angular/core';
@Component({
  selector: 'data-area',
  template: `

<div class="form-horizontal row" *ngIf="settings.columns&&settings.columns.__showArea()" >

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
    if (this.columns >= 1)
      return "col-sm-" + 12 / this.columns;
      
  }


  lastCols: Array<ColumnSetting<any>[]>;
  lastAllCols: ColumnSetting<any>[];

  theColumns(): Array<ColumnSetting<any>[]> {



    let cols = this.settings.columns.getNonGridColumns();
    if (cols == this.lastAllCols)
      return this.lastCols;
    this.lastAllCols = cols;

    let r: Array<ColumnSetting<any>[]> = [];
    this.lastCols = r;
    for (var i = 0; i < this.columns; i++) {
      r.push([]);
    }
    let itemsPerCol = Math.round(cols.length / this.columns);
    for (var i = 0; i < cols.length; i++) {
      r[Math.floor(i / itemsPerCol)].push(cols[i]);
    }

    return this.lastCols;
  }
  @Input() settings: dataAreaSettings = { columns: new ColumnCollection(() => undefined, () => false, undefined, () => true) };
  @Input() labelWidth = 4;
  @Input() columns = 1;
}
