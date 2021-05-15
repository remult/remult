import { extend } from '@remult/angular';
import { IdEntity,     ServerMethod } from '@remult/core';
import { Column, Entity, EntityBase } from '../../../projects/core/src/remult3';

@Entity({
  name: "Products",
  allowApiCRUD: true,
})

export class Products extends EntityBase {
  @Column()
  name = '';
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


