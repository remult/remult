import { DataProvider, Entity, DataProviderFactory, EntitySource, InMemoryDataProvider } from './../utils/data';
import * as utils from '../utils/utils';

export class Category extends utils.Entity {
  id = new utils.numberColumn('CategoryID');
  categoryName = new utils.textColumn('CategoryName');
  description = new utils.textColumn('Description');

  constructor() {
    super();
    this.initColumns();
  }
}
export class Categories extends EntitySource<Category> {
  constructor(dataProvider?: DataProviderFactory) {
    super('categories', () => new Category(), dataProvider ?dataProvider: new InMemoryDataProvider());
  }
}
