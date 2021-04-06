import { extend } from '@remult/angular';
import { IdEntity, StringColumn, EntityClass, ColumnOptions, Context, ValueListColumn, NumberColumn, DateColumn, DateTimeColumn, ServerMethod, ServerController, BoolColumn,  Entity } from '@remult/core';
import { collapseTextChangeRangesAcrossMultipleVersions } from 'typescript';
@EntityClass

export class Products extends IdEntity {
  name = new StringColumn({

  });
  price = new NumberColumn({ decimalDigits: 2, key: 'price_1' });
  availableFrom1 = new DateTimeColumn();
  availableTo = new DateColumn();
  a = extend(new StringColumn()
  ).dataControl(s => s.valueList = ['a', 'b']);
  b = new bColumn();
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


export class bColumn extends StringColumn {
  constructor() {
    super()
    extend(this).dataControl(s => s.valueList = ['c', 'd']);
  }
}




