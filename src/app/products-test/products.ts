import { IdEntity, StringColumn, EntityClass, ColumnOptions, Context, ValueListColumn, NumberColumn, DateColumn, DateTimeColumn, ServerMethod, ServerController } from '@remult/core';
@EntityClass
@ServerController({ key: 'myKey', allowed: true })
export class Products extends IdEntity {
  name = new StringColumn();
  price = new NumberColumn();
  availableFrom1 = new DateTimeColumn();
  availableTo = new DateColumn();
  @ServerMethod()
  async doSomething(p: string) {
    console.log({
      p,
      val: this.name.value,
      original: this.name.originalValue
    });
    this.name.value+='1';
    await this.save();
  }
  constructor() {
    super({
      name: "Products",
      allowApiCRUD: true,
      allowApiRead: true,
      saving: () => {
        //       this.validationError = 'dont save';
      }
    });
  }
}

