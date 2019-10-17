import { Entity, EntityOptions, NumberColumn, StringColumn } from "../../core/utils";
import { DataProviderFactory } from "../../core/dataInterfaces1";
import { LocalStorageDataProvider } from "../../core/localStorageDataProvider";
import { EntityClass } from "../../context/Context";

export const environment = {
  production: false,
  dataSource: new LocalStorageDataProvider() as DataProviderFactory
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
  constructor(settings?: EntityOptions|string) {
    super(settings, () => new Categories(settings));
    this.__initColumns();
  }
}