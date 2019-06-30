import { GridSettings, Column, DateColumn, DataAreaSettings, NumberColumn } from 'radweb';
import { Component } from '@angular/core';
import * as models from './models';





@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],

})
export class AppComponent {

 myDate = new DateColumn('התאריך שלי');
 nc = new NumberColumn('המספר של');
  area = new DataAreaSettings({ columnSettings: () => [this.nc,this.myDate] });
  init(){
    
  }
}
