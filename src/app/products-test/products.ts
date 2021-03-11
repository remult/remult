import { IdEntity, StringColumn, EntityClass, ColumnOptions, Context, ValueListColumn, NumberColumn, DateColumn, DateTimeColumn, ServerMethod, ServerController, BoolColumn } from '@remult/core';
@EntityClass

export class Products extends IdEntity {
  name = new StringColumn();
  price = new NumberColumn({decimalDigits:2,key:'price_1'});
  availableFrom1 = new DateTimeColumn();
  availableTo = new DateColumn();
  @ServerMethod({ allowed: true })
  async doSomething(p: string) {
    this.name.validationError = p;
    throw 'error';
    await this.save();
  }
  archive = new BoolColumn();
  constructor() {
    super({
      name: "Products",
      allowApiCRUD: true,
      saving: () => {
        //       this.validationError = 'dont save';
      }
    });
    
  }
}

