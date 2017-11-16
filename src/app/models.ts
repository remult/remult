import * as utils from '../utils/utils';


export class Category extends utils.entity {
  id = new utils.numberColumn('CategoryID');
  categoryName = new utils.textColumn('CategoryName');
  description = new utils.textColumn('Description');

  constructor() {
      super('http://localhost:56557/dataapi/categories');
      this.initColumns();
  }
}
