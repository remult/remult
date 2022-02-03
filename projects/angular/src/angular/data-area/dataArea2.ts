


import { Component, Input, ViewEncapsulation, OnChanges } from '@angular/core';
import { Remult, getFields } from 'remult';


import { DataAreaSettings, DataControlSettings, FieldCollection } from '../../../interfaces/src/public_api';

@Component({
  selector: 'data-area',

  templateUrl: './dataArea2.html',
  styleUrls: ['./dataArea2.scss'],
  encapsulation: ViewEncapsulation.None

})
export class DataArea2Component implements OnChanges {
  constructor(private remult: Remult) {

  }

  @Input() settings: DataAreaSettings = {
    fields: new FieldCollection(() => undefined, () => false, undefined, () => true, () => undefined), lines: undefined
  };
  @Input() object: any;

  ngOnChanges(): void {
    if (this.object) {
      this.settings = new DataAreaSettings({
        fields: () => [...getFields(this.object, this.remult)]
      });
    }
    if (this.settings && this.settings.fields) {
      this.settings.fields.setContext(this.remult);


      this.settings.fields.onColListChange(() => this.lastCols = undefined);
      let areaSettings = this.settings as DataAreaSettings;
      if (areaSettings.settings) {
        if (areaSettings.settings.numberOfColumnAreas)
          this.columns = areaSettings.settings.numberOfColumnAreas;
      }
    }


  }
  getColWidth(map: DataControlSettings) {
    let x = this.settings.fields.__dataControlStyle(map);

    return x;
  }
  _getRowColumnClass(col: any) {
    return this.settings.fields._getColumnClass(col, this.settings.fields.currentRow()) + ' dataGridDataCell';
  }

  lastCols: DataControlSettings[][][];
  lastAllCols: DataControlSettings[];

  theColumns(): DataControlSettings[][][] {


    if (this.settings["columns"] && !this.settings.fields)
      this.settings.fields = this.settings["columns"]
    let cols = this.settings.fields.getNonGridColumns();
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
