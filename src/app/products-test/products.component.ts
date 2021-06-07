import { Component, OnInit } from '@angular/core';
import { Context,   Field, getControllerDefs,  Entity, EntityBase, DateOnlyValueConverter } from '@remult/core';

import { Products } from './products';
import { DialogConfig, getValueList, GridSettings, InputField, openDialog } from '@remult/angular';
import { DataAreaSettings, DataControl } from '@remult/angular';
import { DateOnlyField } from '../../../projects/core/src/remult3';








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
        field: orders.id,
        width: '90px',
        readonly: true,
      }, {
        field: orders.customerID,
        getValue: (x,y) => this.context.for(Customers).lookup(y.value).companyName
      },
      /* columnWithSelectPopupAndGetValue(this.context, orders.customerID, models.Customers,
         {
           width: '300px'
         }),*/
      {
        field: orders.orderDate,
        width: '170px'
      },
      {
        field: orders.shipVia,
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
  @Field({ caption: 'OrderID' })
  id: number;
  @Field()
  customerID: string;
  @Field()
  employeeID: number;
  @DateOnlyField()
  orderDate: Date;
  @DateOnlyField()
  requiredDate: Date;
  @DateOnlyField()
  shippedDate: Date;
  @Field()
  shipVia: number;
  @Field()
  freight: number;
  @Field()
  shipName: string;
  @Field()
  shipAddress: string;
  @Field()
  shipCity: string;
  @Field()
  shipRegion: string;
  @Field()
  shipPostalCode: string;
  @Field()
  shipCountry: string;

}



@Entity({ key: 'Customers' })
export class Customers extends EntityBase {
  @Field({ caption: 'CustomerID' })
  id: string;
  @Field()
  companyName: string;
  @Field()
  contactName: string;
  @Field()
  contactTitle: string;
  @Field()
  address: string;
  @Field()
  city: string;
  @Field()
  region: string;
  @Field()
  postalCode: string;
  @Field()
  country: string;
  @Field()
  phone: string;
  @Field()
  fax: string;

}