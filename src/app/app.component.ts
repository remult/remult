import { GridSettings, Column } from './../utils/utils';
import { Component } from '@angular/core';
import * as models from './models';





@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],

})
export class AppComponent {

  x = new GridSettings(new models.Orders(), {
    allowUpdate: true,
    allowDelete: true,
    allowInsert: true,
    knowTotalRows: true,
    numOfColumnsInGrid: 100,
    get: { limit: 100 },
    hideDataArea: true,
    onValidate:o=>{
      o.shipCountry.error='Has Errors';
    },
    columnSettings: o => [
      {
        column: o.customerID, click: x => { },
        width:'150px'

      },
      o.shipAddress,
      {
        column: o.shipCity,
        getValue:x=>'asdf'
      },
      o.shipCountry
    ]
  });
  test() {
    let y = this.x.columns.items[2];
    this.x.columns.items.splice(2, 1);
    this.x.columns.items.splice(this.x.columns.items.length, 0, y);
    this.x.columns.colListChanged();


  }
  filterColumn: Column<any>;

}
