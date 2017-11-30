import { ColumnSetting, Lookup } from './../utils/utils';
import { Component } from '@angular/core';
import * as models from './models';
import * as utils from '../utils/utils';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],

})
export class AppComponent {
  orders = new models.Orders();
  customers = new models.Customers();
  shippers = new models.Shippers();
  cs = new Lookup(this.customers.source);
  settings = new utils.DataSettings(this.orders.source, {
    numOfColumnsInGrid: 4,
    allowUpdate: true,
    allowInsert: true,
    columnSettings: [
      { column: this.orders.id, caption: 'Order ID' },
      {
        column: this.orders.customerID, getValue:
          o =>  this.cs.get(this.customers.id.isEqualTo(o.customerID.value)).companyName
      },
      this.orders.orderDate,
      { column: this.orders.shipVia, dropDown: {source:this.shippers}},
      this.orders.requiredDate,
      this.orders.shippedDate,
      this.orders.shipAddress,
      this.orders.shipCity
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
