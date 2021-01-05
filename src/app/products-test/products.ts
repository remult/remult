import { IdEntity, StringColumn, EntityClass, ColumnOptions, Context, ValueListColumn, NumberColumn, DateColumn, DateTimeColumn, ServerMethod, ServerController } from '@remult/core';
@EntityClass

export class Products extends IdEntity {
  name = new StringColumn();
  price = new NumberColumn();
  availableFrom1 = new DateTimeColumn();
  availableTo = new DateColumn();
  @ServerMethod({ allowed: true })
  async doSomething(p: string) {
    console.log({
      p,
      val: this.name.value,
      original: this.name.originalValue
    });
    await this.save();
  }
  constructor() {
    super({
      name: "Products",
      allowApiCRUD: true,
      allowApiRead: c => { console.log(c.user); return true; },
      saving: () => {
        //       this.validationError = 'dont save';
      }
    });
  }
}

