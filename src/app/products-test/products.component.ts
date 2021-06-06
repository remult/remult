import { Component, OnInit } from '@angular/core';
import { Context, iterateConfig, Column, getControllerDefs, EntityColumns, Entity, EntityBase, DateOnlyValueConverter } from '@remult/core';

import { Products } from './products';
import { DialogConfig, getValueList, GridSettings, InputControl, openDialog } from '@remult/angular';
import { DataAreaSettings, DataControl } from '@remult/angular';








//Context.apiBaseUrl = '/dataApi'

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
@DialogConfig({
  height: '1500px'

})
export class ProductsComponent implements OnInit {



  constructor(private context: Context) { }
  products = new GridSettings<Orders>(this.context.for(Orders), {
    allowCrud: true,
    columnSettings: orders => [
      {
        getValue: () => 1 + 1
      },
      {
        column: orders.id,
        width: '90px',
        readonly: true,
      }, {
        column: orders.customerID,
        getValue: (x,y) => this.context.for(Customers).lookup(y.value).companyName
      },
      /* columnWithSelectPopupAndGetValue(this.context, orders.customerID, models.Customers,
         {
           width: '300px'
         }),*/
      {
        column: orders.orderDate,
        width: '170px'
      },
      {
        column: orders.shipVia,
        width: '150px',
        valueList: getValueList(this.context.for(Products)),
      },
      orders.employeeID,
      orders.requiredDate,
      orders.shippedDate,
      orders.freight,
      orders.shipName,
      orders.shipAddress,
      orders.shipCity,
      orders.shipRegion,
      orders.shipPostalCode,
      orders.shipCountry,

    ],
    rowButtons: [
      {
        click: orders =>
          window.open(
            '/home/print/' + orders.id),
        showInLine: true,
        textInMenu: 'Print',
        icon: 'print'
      }
    ],
  });
  async ngOnInit() {




  }



}

@Entity({ key: 'Orders' })
export class Orders extends EntityBase {
  @Column({ caption: 'OrderID' })
  id: number;
  @Column()
  customerID: string;
  @Column()
  employeeID: number;
  @Column({ valueConverter: () => DateOnlyValueConverter })
  orderDate: Date;
  @Column({ valueConverter: () => DateOnlyValueConverter })
  requiredDate: Date;
  @Column({ valueConverter: () => DateOnlyValueConverter })
  shippedDate: Date;
  @Column()
  shipVia: number;
  @Column()
  freight: number;
  @Column()
  shipName: string;
  @Column()
  shipAddress: string;
  @Column()
  shipCity: string;
  @Column()
  shipRegion: string;
  @Column()
  shipPostalCode: string;
  @Column()
  shipCountry: string;

}



@Entity({ key: 'Customers' })
export class Customers extends EntityBase {
  @Column({ caption: 'CustomerID' })
  id: string;
  @Column()
  companyName: string;
  @Column()
  contactName: string;
  @Column()
  contactTitle: string;
  @Column()
  address: string;
  @Column()
  city: string;
  @Column()
  region: string;
  @Column()
  postalCode: string;
  @Column()
  country: string;
  @Column()
  phone: string;
  @Column()
  fax: string;

}