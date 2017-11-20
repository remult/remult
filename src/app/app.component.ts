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
  categories = new models.Category();
  settings = new utils.DataSettings(this.categories.source, {
    allowUpdate:true,
    columnSettings: [
      this.categories.id,
      this.categories.categoryName,
      this.categories.description
    ]
  });

  title = 'app';
  anotherTitle = 'noam';
  doSomething() {
    alert('noam the red');

  }
  constructor() {

  }
}
