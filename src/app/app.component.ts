import { environment } from '../environments/environment';
import { ColumnSetting, Lookup } from './../utils/utils';
import { Component } from '@angular/core';
import * as models from './models';
import * as utils from '../utils/utils';
import * as db from '../utils/localStorageDataProvider';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],

})
export class AppComponent {
  orders = new models.Orders();
  orderDetails = new models.Order_details();
  products = new models.Products();
  pForLookup = new models.Products();
  pLookUp = new utils.Lookup(this.pForLookup.source);
  orderDetailsSettings = new utils.DataSettings(this.orderDetails.source, {
    allowDelete: true,
    allowUpdate: true,
    allowInsert: true,
    columnSettings: [
      {
        column: this.orderDetails.productID,
        dropDown: { source: this.products },
        onUserChangedValue: od => this.pLookUp.whenGet(this.pForLookup.id.isEqualTo(od.productID)).then(p => od.unitPrice.value = p.unitPrice.value)
      },
      this.orderDetails.unitPrice,
      this.orderDetails.quantity,
      { caption: 'row total', getValue: od => od.unitPrice.value * od.quantity.value }
    ],
    onNewRow: od => {
      od.orderID.value = this.orders.id.value;
      od.unitPrice.value = 1;
    }
  });
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
    onEnterRow: o => this.orderDetailsSettings.get({ where: this.orderDetails.orderID.isEqualTo(o.id) }),
    columnSettings: [
      this.orders.id,
      {
        column: this.orders.customerID, getValue:
          o => this.cs.get(this.customers.id.isEqualTo(o.customerID)).companyName,
        click: o => this.customersSelect.showSelectPopup(c => o.customerID.value = c.id.value)
      },
      this.orders.orderDate,
      { column: this.orders.shipVia, dropDown: { source: this.shippers } }

    ]
  });
  shipInfoArea = this.settings.addArea({
    columnSettings: [
      this.orders.requiredDate,
      this.orders.shippedDate,
      this.orders.shipAddress,
      this.orders.shipCity
    ]
  });
  getOrderTotal() {
    let r = 0;
    this.orderDetailsSettings.items.forEach(od => r += od.unitPrice.value * od.quantity.value);
    return r;
  }
  printOrder() {
    window.open(environment.serverUrl + 'home/print/' + this.settings.currentRow.id.value, '_blank');
  }
  test() {

  }
}
