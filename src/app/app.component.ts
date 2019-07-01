import { GridSettings, Column } from 'radweb';
import { Component } from '@angular/core';
import * as models from './models';



 

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],

})
export class AppComponent {

  x = new GridSettings<models.Products>(new models.Products(), {
    allowUpdate: true,
    allowDelete: true,
    allowInsert: true,
    knowTotalRows: true,
    //numOfColumnsInGrid: 100,
    get: { limit: 100 },
    hideDataArea: true,
    onValidate:o=>{
      
    },
    columnSettings:p=>[
      p.id,p.productName,p.discontinued,
      {
        getValue:p=>p.discontinued.value +'noam'
      }
    ]
   
   
  });
  inputType='checkbox';
  test:any;
  filterColumn: Column<any>;

}
