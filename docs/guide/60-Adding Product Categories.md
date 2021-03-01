# Adding the Categories component
Next we would like to implement the following improvement to our app:
1. We would like to organize the products by categories.
2. We'll need a screen to manage the categories.
3. We would like to easily select for product which category is it on.
4. We would like to allow our users to filter products by Category.

## Step 1, add the categories component
run the following command:
```
ng generate component --skipTests=true categories 
```

## Step 2, add the Categories Route
in the `app-routing.module.ts` file:
```ts{5}
const routes: Routes = [
  { path: 'Home', component: HomeComponent },
  { path: 'User Accounts', component: UsersComponent, canActivate: [AdminGuard] },
  { path: 'Products', component: ProductsComponent },
  { path: 'Categories', component: CategoriesComponent },
  { path: 'Register', component: RegisterComponent, canActivate: [NotSignedInGuard] },
  { path: 'Account Info', component: UpdateInfoComponent, canActivate: [SignedInGuard] },
  { path: '', redirectTo: '/Home', pathMatch: 'full' },
  { path: '**', redirectTo: '/Home', pathMatch: 'full' }
];
```

## Step 3, add the Categories Entity
In the `Categories` folder add a file called `categories.ts`
```ts
import { IdEntity, StringColumn, EntityClass } from '@remult/core';

@EntityClass
export class Categories extends IdEntity {
    name = new StringColumn();
    constructor() {
        super({
            name: "Categories",
            allowApiCRUD:true,
            allowApiRead:true
        });
    }
} 
```
## Step 4, add the Categories entity to the Categories Component
in `categories.component.ts` 
```ts{2-3,11-16}
import { Component, OnInit } from '@angular/core';
import { Context } from '@remult/core';
import { Categories } from './categories';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit {
  constructor(private context: Context) { }
  categories = this.context.for(Categories).gridSettings({
    allowUpdate: true,
    allowInsert: true,
    allowDelete: true
  });
  ngOnInit() {
  }
}
```

In the `categories.component.html`
```ts
 <data-grid [settings]="categories"></data-grid>
```

## Add a few categories
1. Beverages
2. Grains/Cereals

## Adding the Category to the Products Entity
In the `products.ts` let's add the `category` field to our Entity
```ts{27}
import { IdEntity, StringColumn, EntityClass, NumberColumn, DateColumn, IdColumn } from '@remult/core';

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
        validate:() => {
            if (!this.availableTo.value||this.availableTo.value<=this.availableFrom.value){
                this.availableTo.validationError = 'Should be greater than ' + this.availableFrom.defs.caption;
            }
        }
    });
    category = new IdColumn();
    constructor() {
        super({
            name: "Products",
            allowApiCRUD: true,
            allowApiRead: true
        });
    }
} 
```
## Allowing the user to Easily select a category for a product
in the `products.component.ts`
```ts{11-14,18}
products = this.context.for(Products).gridSettings({
  allowInsert: true,
  allowUpdate: true,
  allowDelete: true,
  columnSettings: p => [
    p.name,
    {
      column: p.price,
      width: '75'
    },
+   {
+     column: p.category,
+     valueList: this.context.for(Categories).getValueList()
+   },
    p.availableFrom,
    p.availableTo
  ]
  , numOfColumnsInGrid: 3
  , hideDataArea: true
});
```

Great - now the user can select the category of each product.

## Display the Category for each Product in the website's Home

In the `home.component.ts` let's add the following method:
```ts{12-14}
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
  getProductCategory(p: Products) {
    return this.context.for(Categories).lookup(p.category).name.value;
  }
}
```

Let's review:
1. the `getProductCategory` method will receive the product we care about, and should return the product name.
2. We're using the `context` object as we do to get data from the server.
3. The `lookup` method, is useful for getting data to display to the user, it has several traits:
   1. It'll request the category from the server and cache the result, so that the second time you ask for it - you'll get it immediately.
   2. If the `category` doesn't exist in the cache, it'll return an empty category, until it'll get the result from the server (since Angular recomputes all the time, it'll start with a blank value and when the data is loaded from the server it'll display it's the correct category data)
4. Once we get the category from the `lookup`, we ask for it's `name` column's `value`

In the `home.component.html` let's use this method:
```html{7-8}
  <mat-card *ngFor="let p of products" class="product-card">
      <mat-card-title>
        {{p.name.value}}
      </mat-card-title>
      <mat-card-subtitle>
        {{p.availableFrom.displayValue}} - {{p.availableTo.displayValue}}
        <br/>
        Category: {{getProductCategory(p)}}
      </mat-card-subtitle>
  </mat-card>
```

Now the category is clearly displayed next to the product, for our website visitors