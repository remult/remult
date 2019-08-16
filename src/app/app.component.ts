import { GridSettings, Column, Context } from 'radweb';
import { Component } from '@angular/core';
import * as models from './models';





@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],

})
export class AppComponent {
  constructor(private context:Context) {

  }
  x =  this.context.for(models.Products).gridSettings( {
    allowUpdate: true,
    allowDelete: true,
    allowInsert: true,
    knowTotalRows: true,
    //numOfColumnsInGrid: 100,
    get: { limit: 100 },
    hideDataArea: true,
    onValidate: o => {

    },
    columnSettings: p => [
      p.id, p.productName, p.discontinued,
      {
        getValue: p => p.discontinued.value + 'noam'
      }
    ]


  });
  inputType = 'checkbox';
  test: any;
  filterColumn: Column<any>;

}
