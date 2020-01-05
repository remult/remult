
import { DataProvider } from "../../data-interfaces";

import { EntityClass } from "../../context";
import { Entity, EntityOptions } from "../../entity";
import { NumberColumn } from "../../columns/number-column";
import { StringColumn } from "../../columns/string-column";
import { ValueListColumn } from "../../columns/value-list-column";

export const environment = {
  production: false
};
@EntityClass
export class Categories extends Entity<number> {
  id = new NumberColumn({ dbName: 'CategoryID' });
  categoryName = new StringColumn();
  description = new StringColumn();
  categoryNameLength = new NumberColumn({
    serverExpression: () => this.categoryName.value? this.categoryName.value.length:undefined
  });
  categoryNameLengthAsync = new NumberColumn({
    serverExpression: () => Promise.resolve(this.categoryName.value? this.categoryName.value.length:undefined)
  });
  status = new StatusColumn();
  constructor(settings?: EntityOptions | string) {
    super(settings);
    
  }
}
export class CategoriesWithValidation extends Categories {
  static orderOfOperation: string;
  constructor() {
    super({
      name: undefined,
      savingRow: () => CategoriesWithValidation.orderOfOperation += "EntityOnSavingRow,",
      validate: r => CategoriesWithValidation.orderOfOperation += "EntityValidate,",
    });
  }
}

export class Status {
  static open = new Status(0, "open");
  static closed = new Status(1, "closed");
  static hold = new Status(2, "hold");

  constructor(public id: number, public name: string) {

  }
  toString() {
    return this.name;
  }
}
export class StatusColumn extends ValueListColumn<Status> {
  constructor() {
    super(Status);
  }

}