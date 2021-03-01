# Creating a category id column type
Currently the code that relates to the category is spread across many files - let's create a `CategoryId` type and consolidate everything to it.

Under the `categories` folder, let's add a `categoryId.ts` file
```ts
import { IdColumn } from '@remult/core';

export class CategoryId extends IdColumn{
}
```

Now let's use it in the `Products` Entity
```ts{2,28}
import { IdEntity, StringColumn, EntityClass, NumberColumn, DateColumn, IdColumn } from '@remult/core';
import { CategoryId } from '../categories/categoryId';

@EntityClass
export class Products extends IdEntity {
    name = new StringColumn();
    price = new NumberColumn({
        validate: () => {
            if (!this.price.value) {
                this.price.validationError = 'Price is required';
            }
        }
    });
    availableFrom = new DateColumn({
        validate: () => {
            if (!this.availableFrom.value || this.availableFrom.value.getFullYear() < 1990)
                this.availableFrom.validationError = 'Invalid Date';
        }
    }
    );
    availableTo = new DateColumn({
        validate:() =>{
            if (!this.availableTo.value||this.availableTo.value<=this.availableFrom.value){
                this.availableTo.validationError='Should be greater than '+this.availableFrom.defs.caption;
            }
        }
    });
    category = new CategoryId();
    constructor() {
        super({
            name: "Products",
            allowApiCRUD: true,
            allowApiRead: true
        });
    }
} 
```

Now let's start moving logic into the `CategoryId` class.

My first priority is to configure the `displayValue` property of the `CategoryId` to display the category name, then we can remove the `getProductCategory` from the `home.component.ts`

In the `CategoryId.ts` file:
```ts
export class CategoryId extends IdColumn {
    constructor(private context: Context) {
        super();
     }
    get displayValue() {
        return this.context.for(Categories).lookup(this).name.value;
    }
}
```
Let's review:
1. In line 2, we've added a constructor that receives the `context` object that we'll use to get data from the server.
2. In line 3 we've called the base class's constructor - since CategoryId extends IdColumn we are required to call it's constructor in ours, this is done by calling the `super()` method.
3. On lines 5-7 we've overwritten the `displayValue` property, to return the Category name instead if it's id.

Since we've added a parameter to the constructor of `CategoryId` well need to provide it. 
In `products.ts`
```ts{25-32}
@EntityClass
export class Products extends IdEntity {
    name = new StringColumn();
    price = new NumberColumn({
        validate: () => {
            if (!this.price.value) {
                this.price.validationError = 'Price is required';
            }
        }
    });
    availableFrom = new DateColumn({
        validate: () => {
            if (!this.availableFrom.value || this.availableFrom.value.getFullYear() < 1990)
                this.availableFrom.validationError = 'Invalid Date';
        }
    }
    );
    availableTo = new DateColumn({
        validate:() =>{
            if (!this.availableTo.value||this.availableTo.value<=this.availableFrom.value){
                this.availableTo.validationError='Should be greater than '+this.availableFrom.defs.caption;
            }
        }
    });
    category = new CategoryId(this.context);
    constructor(private context:Context) {
        super({
            name: "Products",
            allowApiCRUD: true,
            allowApiRead: true
        });
    }
} 
```

Now let's simplify the code of our `home.component` to use the `displayValue` property instead of the `getProductCategory` method.

in `home.component.ts`
```ts{13-15}
export class HomeComponent implements OnInit {

  constructor(private context: Context) { }
  products: Products[] = [];
  async ngOnInit() {
    this.products = await this.context.for(Products).find({
      orderBy: p => p.name,
      where: p => p.availableFrom.isLessOrEqualTo(new Date()).and(
        p.availableTo.isGreaterOrEqualTo(new Date()))
    });
  }
  
  //getProductCategory(p: Products) {
  //  return this.context.for(Categories).lookup(p.category).name.value;
  //}
}
```

In `home.component.html`
```html {7}
    <mat-card *ngFor="let p of products" class="product-card">
        <mat-card-title>
            {{p.name.value}}
        </mat-card-title>
        <mat-card-subtitle>
        {{p.availableFrom.displayValue}} - {{p.availableTo.displayValue}}<br/>
            Category: {{p.category.displayValue}}
        </mat-card-subtitle>
    </mat-card> 
```