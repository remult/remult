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
  cs = new Lookup(this.customers.source);
  customersForSelect = new models.Customers();
  customersSelect = new utils.DataSettings(this.customersForSelect.source, {
    numOfColumnsInGrid: 4,
    columnSettings: [
      this.customersForSelect.id,
      this.customersForSelect.companyName,
      this.customersForSelect.contactName,
      this.customersForSelect.country,
      this.customersForSelect.address,
      this.customersForSelect.city
    ]
  });

  shippers = new models.Shippers();
  settings = new utils.DataSettings(this.orders.source, {
    numOfColumnsInGrid: 4,
    allowUpdate: true,
    allowInsert: true,
    columnSettings: [
      { column: this.orders.id, caption: 'Order ID' },
      {
        column: this.orders.customerID, getValue:
          o => this.cs.get(this.customers.id.isEqualTo(o.customerID.value)).companyName,
        click: o => this.customersSelect.showSelectPopup(c => o.customerID.value = c.id.value)
      },
      this.orders.orderDate,
      { column: this.orders.shipVia, dropDown: { source: this.shippers } },
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
