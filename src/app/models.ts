import { environment } from './../environments/environment';

import { Entity, EntitySource } from './../utils/utils';
import { DataProvider, DataProviderFactory } from './../utils/DataInterfaces';
import * as radweb from '../utils/utils';

export class Categories extends radweb.Entity<number> {
  id = new radweb.NumberColumn('CategoryID');
  categoryName = new radweb.StringColumn();
  description = new radweb.StringColumn();

  constructor() {
      super(() => new Categories(), environment.dataSource, 'Categories');
      this.initColumns();
  }
}
export class Orders extends radweb.Entity<number> {
  id = new radweb.NumberColumn({dbName:"OrderId"});
  customerID = new radweb.StringColumn();
  employeeID = new radweb.NumberColumn();
  orderDate = new radweb.DateColumn('OrderDate');
  requiredDate = new radweb.DateColumn('RequiredDate');
  shippedDate = new radweb.DateColumn('ShippedDate');
  shipVia = new radweb.NumberColumn('ShipVia');
  freight = new radweb.NumberColumn('Freight');
  shipName = new radweb.StringColumn('ShipName');
  shipAddress = new radweb.StringColumn('ShipAddress');
  shipCity = new radweb.StringColumn('ShipCity');
  shipRegion = new radweb.StringColumn('ShipRegion');
  shipPostalCode = new radweb.StringColumn('ShipPostalCode');
  shipCountry = new radweb.StringColumn('ShipCountry');

  constructor() {
    super(() => new Orders(), environment.dataSource, 'Orders');

    this.initColumns(this.id);
  }


}

export class Order_details extends radweb.Entity<string> {
  orderID = new radweb.NumberColumn('OrderID');
  productID = new radweb.NumberColumn('ProductID');
  unitPrice = new radweb.NumberColumn('UnitPrice');
  quantity = new radweb.NumberColumn('Quantity');
  discount = new radweb.NumberColumn('Discount');
  id = new radweb.StringColumn('id');

  constructor() {
    super(() => new Order_details(), environment.dataSource, 'Order_details');
    this.initColumns(this.id);
  }
}


export class Customers extends radweb.Entity<string> {
  id = new radweb.StringColumn({caption: 'CustomerID',dbName:'CustomerID'});
  companyName = new radweb.StringColumn('CompanyName');
  contactName = new radweb.StringColumn('ContactName');
  contactTitle = new radweb.StringColumn('ContactTitle');
  address = new radweb.StringColumn('Address');
  city = new radweb.StringColumn('City');
  region = new radweb.StringColumn('Region');
  postalCode = new radweb.StringColumn('PostalCode');
  country = new radweb.StringColumn('Country');
  phone = new radweb.StringColumn('Phone');
  fax = new radweb.StringColumn('Fax');

  constructor() {
    super(() => new Customers(), environment.dataSource, 'Customers');
    this.initColumns(this.id);
  }
}

export class Products extends radweb.Entity<number> {
  id = new radweb.NumberColumn({ dbName: 'ProductID' });
  productName = new radweb.StringColumn('ProductName');
  supplierID = new radweb.NumberColumn('SupplierID');
  categoryID = new radweb.NumberColumn('CategoryID');
  quantityPerUnit = new radweb.StringColumn('QuantityPerUnit');
  unitPrice = new radweb.NumberColumn('UnitPrice');
  unitsInStock = new radweb.NumberColumn('UnitsInStock');
  unitsOnOrder = new radweb.NumberColumn('UnitsOnOrder');
  reorderLevel = new radweb.NumberColumn('ReorderLevel');
  discontinued = new radweb.BoolColumn('Discontinued');

  constructor() {
    super(() => new Products(), environment.dataSource, 'Products');
    this.initColumns(this.id);
  }
}

export class Shippers extends radweb.Entity<number> {
  id = new radweb.NumberColumn('ShipperID');
  companyName = new radweb.StringColumn('CompanyName');
  phone = new radweb.StringColumn('Phone');

  constructor() {
    super(() => new Shippers(), environment.dataSource, 'Shippers');
    this.initColumns(this.id);
  }
}
