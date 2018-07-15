import { GridSettings } from './../utils/utils';
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
    numOfColumnsInGrid: 4,
    get: { limit: 100 },
    hideDataArea: true
   
    
  });

}
