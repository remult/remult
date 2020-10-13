import { IdEntity, StringColumn, EntityClass, ColumnOptions, Context, ValueListColumn, NumberColumn, DateColumn, DateTimeColumn } from '@remult/core';
@EntityClass
export class Products extends IdEntity {
  name = new StringColumn();
  price = new NumberColumn();
  availableFrom1 = new DateTimeColumn();
  availableTo = new DateColumn();
  constructor() {
      super({
          name: "Products",
          allowApiCRUD:true,
          allowApiRead:true,
          saving:()=>{
     //       this.validationError = 'dont save';
          }
      });
  }
} 

