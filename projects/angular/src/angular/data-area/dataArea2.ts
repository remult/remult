


import { Component, Input, ViewEncapsulation, OnChanges } from '@angular/core';

import { ColumnCollection } from '../../column-collection';
import { DataAreaSettings } from '../../data-area-settings';
import { DataControlSettings } from '../../data-control-interfaces';

@Component({
  selector: 'data-area',

  templateUrl: './dataArea2.html',
  styleUrls: ['./dataArea2.scss'],
  encapsulation: ViewEncapsulation.None

})
export class DataArea2Component implements OnChanges {

  @Input() settings: DataAreaSettings = {
    columns: new ColumnCollection(() => undefined, () => false, undefined, () => true, () => undefined), lines: undefined
  };
  @Input() object: any;

  ngOnChanges(): void {
    if (this.settings && this.settings.columns) {
      if (this.object) {
        //@ts-ignore
        this.settings = new DataAreaSettings({
          //@ts-ignore
          columnSettings: () => getColumnsFromObject(this.object)
        });
      }

      this.settings.columns.onColListChange(() => this.lastCols = undefined);
      let areaSettings = this.settings as DataAreaSettings;
      if (areaSettings.settings) {
        if (areaSettings.settings.numberOfColumnAreas)
          this.columns = areaSettings.settings.numberOfColumnAreas;
      }
    }


  }

  lastCols: DataControlSettings[][][];
  lastAllCols: DataControlSettings[];

  theColumns(): DataControlSettings[][][] {



    let cols = this.settings.columns.getNonGridColumns();
    if (cols == this.lastAllCols)
      return this.lastCols;
    this.lastAllCols = cols;

    let r: DataControlSettings[][][] = [];
    this.lastCols = r;
    for (var i = 0; i < this.columns; i++) {
      r.push([]);
    }
    let linesToPlaceInColumns: DataControlSettings[][];
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
