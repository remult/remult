
import { DataProvider } from "../../core/data-interfaces";
import { LocalStorageDataProvider } from "../../core/data-providers/localStorageDataProvider";
import { EntityClass } from "../../context/Context";
import { Entity, EntityOptions } from "../../core/entity";
import { NumberColumn } from "../../core/columns/number-column";
import { StringColumn } from "../../core/columns/string-column";
import { ClosedListColumn } from "../../core/columns/closed-list-column";

export const environment = {
  production: false,
  dataSource: new LocalStorageDataProvider() as DataProvider
};
@EntityClass
export class Categories extends Entity<number> {
  id = new NumberColumn({ dbName: 'CategoryID' });
  categoryName = new StringColumn();
  description = new StringColumn();
  categoryNameLength = new NumberColumn({
    virtualData: () => this.categoryName.value.length
  });
  categoryNameLengthAsync = new NumberColumn({
    virtualData: () => Promise.resolve(this.categoryName.value.length)
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
      onSavingRow: () => CategoriesWithValidation.orderOfOperation += "EntityOnSavingRow,",
      onValidate: r => CategoriesWithValidation.orderOfOperation += "EntityValidate,",
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
export class StatusColumn extends ClosedListColumn<Status> {
  constructor() {
    super(Status);
  }

}