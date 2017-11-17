import * as utils from '../utils/utils';



export class Category extends utils.Entity {
  id = new utils.numberColumn('CategoryID');
  categoryName = new utils.textColumn('CategoryName');
  description = new utils.textColumn('Description');

  constructor() {
      super('http://localhost:56557/dataapi/categories');
      this.initColumns();
  }
}

export const testCategoriesData = [
  {
    "id": 1,
    "categoryName": "Beverages",
    "description": "Soft dri"
  },
  {
    "id": 2,
    "categoryName": "Condiments",
    "description": "Sweet and"
  },
  {
    "id": 3,
    "categoryName": "Confections",
    "description": "Desserts,"
  },
  {
    "id": 4,
    "categoryName": "Dairy Products",
    "description": "Cheeses"
  },
  {
    "id": 5,
    "categoryName": "Grains/Cereals",
    "description": "Breads, cr"
  },
  {
    "id": 6,
    "categoryName": "Meat/Poultry",
    "description": "Prepared m"
  },
  {
    "id": 7,
    "categoryName": "Produce",
    "description": "Dried frui"
  },
  {
    "id": 8,
    "categoryName": "Seafood",
    "description": "Seaweed an"
  }
];
