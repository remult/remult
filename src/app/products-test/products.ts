import { DataControl } from '@remult/angular';
import { Filter, IdEntity, ServerMethod } from '@remult/core';
import { Field, Entity, EntityBase } from '../../../projects/core/src/remult3';

@Entity({
  key: "Products",
  allowApiCrud: true,
  apiDataFilter: (e, c) => {
    return new Filter();
  }
})
export class Products extends IdEntity {
  @Field()
  @DataControl<Products, string>({
    caption: 'the caption',
    getValue: (x, y) => x.name.length,
    click: (x) => alert(x.name)
  })
  name: string = '';
  @Field()
  price: number = 0;//= extend(new NumberColumn({ decimalDigits: 2, key: 'price_1' })).dataControl(x => x.getValue = () => this.price.value);
  @Field() // should be Date
  availableFrom1: Date;
  @Field()
  availableTo: Date;
  @Field()
  archive: boolean;

  @ServerMethod({ allowed: true })
  async doit() {
    await this._.save();
  }
}


