import { ColumnSetting } from './../utils/utils';
import { Component } from '@angular/core';
import * as models from './models';
import * as utils from '../utils/utils';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],

})
export class AppComponent {
   categories = new models.categories();
   dv = new utils.dataView({
     from: this.categories,

   });
  title = 'app';
  anotherTitle = 'noam';
  doSomething() {
    alert('noam the red');

  }
  constructor() {
      this.title = "123";
  }
}
