import { environment } from './../environments/environment';

import { Entity, EntitySource, DateTimeDateStorage, EntityClass } from 'radweb';
import { DataProvider, DataProviderFactory } from 'radweb';
import * as radweb from 'radweb';

@EntityClass
export class Categories extends radweb.Entity<number> {
  id = new radweb.NumberColumn({ dbName: 'CategoryID' });
  categoryName = new radweb.StringColumn();
  description = new radweb.StringColumn();
  categoryNameLength = new radweb.NumberColumn({
    virtualData: () => this.categoryName.value.length
  });
  categoryNameLengthAsync = new radweb.NumberColumn({
    virtualData: () => Promise.resolve(this.categoryName.value.length)
  });
  constructor(settings?: radweb.EntityOptions) {
    super(settings, () => new Categories(settings));
    this.initColumns();
  }
}
@EntityClass
export class Orders extends radweb.Entity<number> {
  id = new radweb.NumberColumn({ dbName: "OrderId" });
  customerID = new radweb.StringColumn();
  employeeID = new radweb.NumberColumn();
  orderDate = new radweb.DateColumn();
  requiredDate = new radweb.DateColumn();
  shippedDate = new radweb.DateColumn();
  shipVia = new radweb.NumberColumn('ShipVia');
  freight = new radweb.NumberColumn('Freight');
  shipName = new radweb.StringColumn('ShipName');
  shipAddress = new radweb.StringColumn('ShipAddress');
  shipCity = new radweb.StringColumn('ShipCity');
  shipRegion = new radweb.StringColumn('ShipRegion');
  shipPostalCode = new radweb.StringColumn('ShipPostalCode');
  shipCountry = new radweb.StringColumn('ShipCountry');

  constructor() {
    super('Orders');

    this.initColumns(this.id);
  }


}
@EntityClass
export class Order_details extends radweb.Entity<string> {
  orderID = new radweb.NumberColumn('OrderID');
  productID = new radweb.NumberColumn('ProductID');
  unitPrice = new radweb.NumberColumn('UnitPrice');
  quantity = new radweb.NumberColumn('Quantity');
  discount = new radweb.NumberColumn('Discount');
  id = new radweb.CompoundIdColumn(this, this.orderID, this.productID);

  constructor() {
    super({ name: "OrderDetails", dbName: '[Order Details]' });
    this.initColumns(this.id);
  }
}

@EntityClass
export class Customers extends radweb.Entity<string> {
  id = new radweb.StringColumn({ caption: 'CustomerID', dbName: 'CustomerID' });
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
    super('Customers');
    this.initColumns(this.id);
  }
}
@EntityClass
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
    super({
      name: 'Products',
      allowApiCRUD: true,

    });
    this.initColumns(this.id);
  }
}
@EntityClass
export class Shippers extends radweb.Entity<number> {
  id = new radweb.NumberColumn({ dbName: 'ShipperID' });
  companyName = new radweb.StringColumn('CompanyName');
  phone = new radweb.StringColumn('Phone');

  constructor() {
    super('Shippers');
    this.initColumns(this.id);
  }
}
