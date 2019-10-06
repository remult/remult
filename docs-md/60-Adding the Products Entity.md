At this stage we would like to define the product Entity, where we will store our product information.
Let's add a new file under the `Products` folder, called `products.ts`

```csdiff
import { IdEntity, StringColumn, EntityClass } from 'radweb';

@EntityClass
export class Products extends IdEntity {
    name = new StringColumn();
    constructor() {
        super({
            name: "Products",
            allowApiCRUD:true,
            allowApiRead:true
        });
    }
}
```

Let's review:
1. We've added a `Products` class that extends the `IdEntity` class from `radweb`. This will create an `Entity` that will have an `id` column that is unique, and anything else we would like to add to it.
2. On line 5 we've defined a `name` column (the product name)
3. On line 7 we've called the `super` class's constructor and defined:
   1.  Line 8 - the `name` for our `API` 
   2.  Line 9 - `allowApiCRUD` determined that CRUD operations are allowed in the `API` (**CR**eate **U**pdate **D**elete)
   3.  Line 10 - `allowApiRead` determines that data can be read from this `API`.

>The `allowApiRead` and `allowApiCRUD` properties are set by default to false, to secure the data of your application, you may want to restrict access to this data and we want to make sure that data will not be exposed by default. Later we'll review how to control access to data.

Now let's add a grid on the `ProductsComponent` that displays the `Products` Entity

in `products.component.ts`
```csdiff
import { Component, OnInit } from '@angular/core';
+import { Context } from 'radweb';
+import { Products } from './products';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.sass']
})
export class ProductsComponent implements OnInit {
- constructor() { }
+ constructor(private context: Context) { }

+ products = this.context.for(Products).gridSettings({
+   allowInsert:true,
+   allowUpdate:true,
+   allowDelete:true
+});

  ngOnInit() {
  }

}
```

let's review:
1. In line 2 and 3 we've added the required imports (those are added automatically when typing the names later on and allowing vscode to add them)
2. In line 12, we've added a parameter to the constructor called `context` of type `Context` from `radweb`. This object will help us get data from the server and more. by tagging it as `private` we make it available throughout the class, by using `this.context`
3. On line 14 we've added the definition of `products` in this component. We've asked the context to provide us with `gridSettings` for the `Entity` Products - and we've configured it to allow update insert and delete.

and in the `products.component.html`
```csdiff
-   <p>
-       products works!
-   </p>
+ <data-grid2 [settings]="products" [height]="300"></data-grid2>
```

let's review:
1. We've replaced the `html` with a `data-grid2` tag that will display the grid settings provided in the `products` member of the `products.component.ts` file.
2. We've determined a fixed height of 300 pixels.

Now if we'll look at the bottom of our screen, at the Terminal output for the task `node-serve`, we'll see that the server restarted and a new api is now available:
```csdiff
12:08:26 PM - Found 0 errors. Watching for file changes.

> my-project@0.0.0 server:dev-run c:\try\test1\my-project
> node --inspect dist-server/server/server.js

Debugger listening on ws://127.0.0.1:9229/9c63d9ea-2a61-4848-8e8f-b2802cb42777
For help, see: https://nodejs.org/en/docs/inspector
start verify structure
+create table Products (
+  id varchar default '' not null  primary key,
+  name varchar default '' not null
+)
/api/signIn
/api/resetPassword
/api/Users
+/api/Products
```
Let's review:
1. When the server restarted, it checked if a `Products` table exists in the database, and since it didn't exist it created it in lines 9-12.
2. On line 16 it added an api endpoint for our `Products` `Entity`


When we'll review the products page, we'll be able to see an empty grid with a column called `id` and a column called `name`, we can add new rows by clicking on the `+` sign at the bottom, and saving them when we edit them.

Let's add a few products:
1. Beer
2. Wine
3. Bread

We can also navigate through the browser directly to the api address `http://localhost:4200/api/products` and see the Json result we'll get when calling the api.

```JSON
[
  {
    id: "63cc3c14-aa3d-4597-9acd-47a4cb62ec73",
    name: "Bread"
  },
  {
    id: "2b829c04-c5b1-45f8-b271-9c32d13b18ae",
    name: "Beer"
  },
  {
    id: "862ef7c3-d92a-4eeb-a4cb-505ced2179eb",
    name: "Wine"
  }
]
```
