


import { Component, Input, ViewEncapsulation, OnChanges } from '@angular/core';
import { dataAreaSettings, DataAreaSettings } from '../../core/data-area-settings';
import { ColumnCollection } from '../../core/column-collection';
import { ColumnSetting } from '../../core/column-interfaces';
@Component({
  selector: 'data-area',

  templateUrl: './dataArea2.html',
  styleUrls: ['./dataArea2.scss'],
  encapsulation: ViewEncapsulation.None

})
export class DataArea2Compnent implements OnChanges {

  @Input() settings: dataAreaSettings = { columns: new ColumnCollection(() => undefined, () => false, undefined, () => true), lines: undefined };

  ngOnChanges(): void {
    if (this.settings && this.settings.columns) {
      this.settings.columns.onColListChange(() => this.lastCols = undefined);
      let areaSettings = this.settings as DataAreaSettings<any>;
      if (areaSettings.settings) {
        if (areaSettings.settings.numberOfColumnAreas)
          this.columns = areaSettings.settings.numberOfColumnAreas;
      }
    }


  }

  lastCols: ColumnSetting<any>[][][];
  lastAllCols: ColumnSetting<any>[];

  theColumns(): ColumnSetting<any>[][][] {



    let cols = this.settings.columns.getNonGridColumns();
    if (cols == this.lastAllCols)
      return this.lastCols;
    this.lastAllCols = cols;

    let r: ColumnSetting<any>[][][] = [];
    this.lastCols = r;
    for (var i = 0; i < this.columns; i++) {
      r.push([]);
    }
    let linesToPlaceInColumns: ColumnSetting<any>[][];
    if (this.settings.lines)
      linesToPlaceInColumns = this.settings.lines;
    else {
      linesToPlaceInColumns = cols.map(x => [x]);
    }
    let itemsPerCol = Math.round(linesToPlaceInColumns.length / this.columns);
    for (var i = 0; i < linesToPlaceInColumns.length; i++) {
      r[Math.floor(i / itemsPerCol)].push(linesToPlaceInColumns[i]);
    }

    return this.lastCols;

  }
  @Input() columns = 1;
}
