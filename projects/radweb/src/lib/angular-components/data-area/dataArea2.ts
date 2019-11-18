
import { ColumnCollection, DataAreaSettings, dataAreaSettings, ColumnSetting } from '../../core/utils';

import { Component,  Input, ViewEncapsulation, OnChanges } from '@angular/core';
@Component({
  selector: 'data-area',
  
  templateUrl:'./dataArea2.html',
  styleUrls:['./dataArea2.scss'],
  encapsulation:ViewEncapsulation.None
  
})
export class DataArea2Compnent  implements OnChanges  {
 
  @Input() settings: dataAreaSettings = { columns: new ColumnCollection(() => undefined, () => false, undefined, () => true),lines:undefined };
  
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
  @Input() columns = 1;
}
