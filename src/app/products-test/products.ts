import { extend } from '@remult/angular';
import { IdEntity, StringColumn, EntityClass, Context, NumberColumn, DateColumn, DateTimeColumn, ServerMethod, ServerController, BoolColumn, Entity, ServerFunction } from '@remult/core';

@EntityClass

export class Products extends IdEntity {
  name = new StringColumn({

  });
  price = extend( new NumberColumn({ decimalDigits: 2, key: 'price_1' })).dataControl(x=>x.getValue=()=>this.price.value);
  availableFrom1 = new DateColumn();
  availableTo = new DateColumn();
  archive = new BoolColumn();
  constructor(context: Context) {
    super({
      name: "Products",
      allowApiCRUD: true,
      saving: () => {
     
      }
    });

  }
  @ServerMethod({ allowed: true })
  async doit() {
    await this.save();
  }
}


export class bColumn extends StringColumn {
  constructor() {
    super()
    extend(this).dataControl(s => s.valueList = ['c', 'd']);
  }
}




