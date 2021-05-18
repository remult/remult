import { DataControl, extend } from '@remult/angular';
import { IdEntity, ServerMethod } from '@remult/core';
import { Column, Entity, EntityBase } from '../../../projects/core/src/remult3';

@Entity({
  key: "Products",
  allowApiCrud: true,
  extends: IdEntity
})

export class Products extends IdEntity {
  @Column()
  @DataControl<Products, string>({
    caption: 'the caption',
    getValue: (x, y) => x.name.length,
    click: (x) => alert(x.name)
  })
  name: string = '';
  @Column()
  price = 0;//= extend(new NumberColumn({ decimalDigits: 2, key: 'price_1' })).dataControl(x => x.getValue = () => this.price.value);
  @Column() // should be Date
  availableFrom1: Date;
  @Column() // should be Date
  availableTo: Date;
  @Column()
  archive: boolean;

  @ServerMethod({ allowed: true })
  async doit() {
    await this._.save();
  }
}


