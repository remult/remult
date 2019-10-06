One of the columns that is displayed on the grid is the `id` column, and although this value is important to the application, it has little value for the user, let's configure the `DataGrid` to only show the columns that we want. In the `products.component.ts` file
```csdiff
import { Component, OnInit } from '@angular/core';
import { Context } from 'radweb';
import { Products } from './products';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.sass']
})
export class ProductsComponent implements OnInit {

  constructor(private context: Context) { }

  products = this.context.for(Products).gridSettings({
    allowInsert: true,
    allowUpdate: true,
    allowDelete: true,
+   columnSettings: p => [
+     p.name,
+     {
+       column: p.price,
+       width: '75'
+     },
+     p.availableFrom,
+     p.availableTo
+   ]
  });
  ngOnInit() {
  }
}

```
Let's review:
1. On line 18 we've set the `columnsSettings` property with a function that returns an array of column.
2. On line 19 we've included the name column.
3. On line 20-23 we've defined the `price` column, with display specific properties (in this case, width of 75 pixels)
4. On line 24-25 we've added the `availableFrom` and the `availableTo` columns