import { Entity, EntitySource, InMemoryDataProvider } from './../utils/data';
import { DataProvider, DataProviderFactory } from './../utils/DataInterfaces';
import * as utils from '../utils/utils';

export class Category extends utils.Entity {
  id = new utils.numberColumn('CategoryID');
  categoryName = new utils.textColumn('CategoryName');
  description = new utils.textColumn('Description');

  constructor() {
    super(() => new Category());
    this.initColumns();
  }
}
