Currently the code that relates to the category is spread across many files - let's create a `CategoryId` type and consolidate everything to it.

Under the `categories` folder, let's add a `categoryId.ts` file
```csdiff
import { IdColumn } from 'radweb';

export class CategoryId extends IdColumn{
}
```

Now let's use it in the `Products` Entity
```csdiff
import { IdEntity, StringColumn, EntityClass, NumberColumn, DateColumn, IdColumn } from 'radweb';
+import { CategoryId } from '../categories/categoryId';

@EntityClass
export class Products extends IdEntity {
    name = new StringColumn();
    price = new NumberColumn({
        onValidate: () => {
            if (!this.price.value) {
                this.price.error = 'Price is required';
            }
        }
    });
    availableFrom = new DateColumn({
        onValidate: () => {
            if (!this.availableFrom.value || this.availableFrom.value.getFullYear() < 1990)
                this.availableFrom.error = 'Invalid Date';
        }
    }
    );
    availableTo = new DateColumn({
        onValidate:() =>{
            if (!this.availableTo.value||this.availableTo.value<=this.availableFrom.value){
                this.availableTo.error='Should be greater than '+this.availableFrom.caption;
            }
        }
    });
-   category = new IdColumn();
+   category = new CategoryId();
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
```csdiff
export class CategoryId extends IdColumn {
+   constructor(private context: Context) {
+       super();
+    }
+   get displayValue() {
+       return this.context.for(Categories).lookup(this).name.value;
+   }
}
```
Let's review:
1. In line 2, we've added a constructor that receives the `context` object that we'll use to get data from the server.
2. In line 3 we've called the base class's constructor - since CategoryId extends IdColumn we are required to call it's constructor in ours, this is done by calling the `super()` method.
3. On lines 5-7 we've overwritten the `displayValue` property, to return the Category name instead if it's id.

Since we've added a parameter to the constructor of `CategoryId` well need to provide it. 
In `products.ts`
```csdiff
@EntityClass
export class Products extends IdEntity {
    name = new StringColumn();
    price = new NumberColumn({
        onValidate: () => {
            if (!this.price.value) {
                this.price.error = 'Price is required';
            }
        }
    });
    availableFrom = new DateColumn({
        onValidate: () => {
            if (!this.availableFrom.value || this.availableFrom.value.getFullYear() < 1990)
                this.availableFrom.error = 'Invalid Date';
        }
    }
    );
    availableTo = new DateColumn({
        onValidate:() =>{
            if (!this.availableTo.value||this.availableTo.value<=this.availableFrom.value){
                this.availableTo.error='Should be greater than '+this.availableFrom.caption;
            }
        }
    });
-   category = new CategoryId();
+   category = new CategoryId(this.context);
-   constructor() {}
+   constructor(private context:Context) {
        super({
            name: "Products",
            allowApiCRUD: true,
            allowApiRead: true
        });
    }
} 
```

Now let's simply the code of our `home.component` to use the `displayValue` property instead of the `getProductCategory` method.

in `home.component.ts`
```csdiff
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
- getProductCategory(p: Products) {
-   return this.context.for(Categories).lookup(p.category).name.value;
- }
}
```

In `home.component.html`
```csdiff
    <mat-card *ngFor="let p of products" class="product-card">
        <mat-card-title>
        {{p.name.value}}
        </mat-card-title>
        <mat-card-subtitle>
        {{p.availableFrom.displayValue}} - {{p.availableTo.displayValue}}<br/>
-       Category: {{getProductCategory(p)}}
+       Category: {{p.category.displayValue}}
        </mat-card-subtitle>
    </mat-card> 
```