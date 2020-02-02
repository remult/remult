Next we would like to create a list of products that our site visitors can see on our home page.

First, let's clear everything we've played with in our `home.component.html` and our `home.component.ts` 
Replace the `home.component.html` content with the default:
```csdiff
 <p>
  home works!
 </p>
```

Replace the `hompe.component.ts` content with the default:
```csdiff
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }
}
```


Let's start with designing our `home.component.html` - we'll use Angular Material components for this design - specifically the  [Mat-Card](https://material.angular.io/components/card/overview)

Let's start with the basic card:
```csdiff
    <mat-card>
        <mat-card-title>
        My Product
        </mat-card-title>
        <mat-card-subtitle>
        this is my subtitle
        </mat-card-subtitle>
    </mat-card>
```

Next we would like to use the actual data from the `products` entity.
In the `home.component.ts` file, the first step would be to get the `context` object in. As used before, the `context` object helps us with comunicating with the server and figuring out our context
```csdiff
export class HomeComponent implements OnInit {

- constructor() { }
+ constructor(private context:Context) { }

  ngOnInit() {
  }
}
```
> note that when you'll add the `context` parameter to the constructor, you'll also require the `import` statement for the `Context` class.
> If you don't have that import statement, Visual Studio Code will highlight it in red and display a "light bulb" you can click to automatically add it:
![](2020-01-26_11h45_50.png)
> It'll then automatically add the `import { Context } from '@remult/core';` statement to the top of the document.
> The same can be done for any missing `import` statement 

Next let's define a list of products:
```csdiff
export class HomeComponent implements OnInit {

  constructor(private context:Context) { }
+ products :Products[] = [];
  ngOnInit() {
  }
}
```
> If the `Products` class is highlighted, add it to the `import` statement using the method describe in the previous note.

We've defined a member called `products` of type `Products[]` (an Array of products) and have set it's initial value to an empty array (` = []`)

Now let's populate the array with products from our db:
```csdiff
export class HomeComponent implements OnInit {

  constructor(private context: Context) { }
  products: Products[] = [];
- ngOnInit() {
+ async ngOnInit() {
+   this.products = await this.context.for(Products).find();
+ }
}
```

Just three lines, but a lot to explain.

When developing web applications, all the calls to the server (and many many other things) are performed asynchronously. That means that while we wait for the call to the server to complete, the code can do other things (specifically not leave the user interface hung).

The fact that the call to the `find` method is asynchronous can be  inferred from it's return type - in this case `Promise<Products[]>`. Any method that returns a `Promise` will run asynchronously. In this case it return a `Promise` of type `Products[]`.

We want to wait for the result of this `Promise`. To do that we'll have to decorate the method we are running with the `async` keyword (as we've done on line 5) and use the `await` keyword when we call the method.

Now let's adjust the `home.component.html` to use these products, using the `*ngFor` directive
```csdiff
-   <mat-card>
+   <mat-card *ngFor="let p of products">
        <mat-card-title>
-       My Product
+       {{p.name.value}}
        </mat-card-title>
        <mat-card-subtitle>
-       this is my subtitle
+       {{p.availableFrom.displayValue}} - {{p.availableTo.displayValue}}
        </mat-card-subtitle>
    </mat-card>
```
* We're using the `displayValue` property of the `DateColumn` to show the date in a friendly way.

Now let's format the cards to display multiple cards in a row. We'll add a `css` class to the `mat-card` tag
```csdiff
-   <mat-card *ngFor="let p of products">
+   <mat-card *ngFor="let p of products" class="product-card">
        <mat-card-title>
        {{p.name.value}}
        </mat-card-title>
        <mat-card-subtitle>
        {{p.availableFrom.displayValue}} - {{p.availableTo.displayValue}}
        </mat-card-subtitle>
    </mat-card>
```

and in the `home.component.scss` file we'll define that class:
```csdiff
.product-card{
    width:260px;
    display:inline-block;
    margin:10px;
}
```

# Sorting
Now let's sort the cards by name. In the `home.component.ts` file, let's start by sending an object to the `find` method:
```csdiff
  async ngOnInit() {
-   this.products = await this.context.for(Products).find();
+   this.products = await this.context.for(Products).find({
+   });
  }
```

Next let's add the `orderBy` property:
```csdiff
  async ngOnInit() {
    this.products = await this.context.for(Products).find({
+     orderBy: p => p.name
    });
  }
```

The `orderBy` property is set to a method that receives the `Products` entity and returns one of several variations:
1. The column we wanted to sort on (as we've done in this case)
2. An array of columns we want to sort on - for example: `orderBy: p => [p.name,p.availableFrom]`
3. An Array of `SortSegments` that can be used to sort descending - for example: `orderBy: p => [{ column: p.name, descending: true }, p.availableFrom]`

In our case we'll stick to simply sorting by the Product Name.

# Filtering the Data
Since we only want to show products that are available, let's filter the products to indicate that:
```csdiff
  async ngOnInit() {
    this.products = await this.context.for(Products).find({
      orderBy: p => p.name
+     , where: p => p.availableFrom.isLessOrEqualTo(new Date()).and(
+         p.availableTo.isGreaterOrEqualTo(new Date()))
    });
  }
```

We've used the `where` property which receives a function that gets the `Products` entity as a parameter and returns a filter.

we've then used the column's filter method, these start with the `is` word and allow filtering (`isEqualTo`, `isGreaterOrEqualTo` etc...)

The result should look like this:

![](2019-10-07_09h32_19.png)