# Displaying the Products Entity using Custom Html

Next we would like to create a list of products that our site visitors can see on our home page.

First, let's clear everything we've played with in our `home.component.html` and our `home.component.ts` 
Replace the `home.component.html` content with the default:
```html
 <p>
  home works!
 </p>
```

Replace the `home.component.ts` content with the default:
```ts
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


Let's start with designing our `home.component.html` - we'll use Angular Material components for this design - specifically the  [Mat-Card](/https://material.angular.io/components/card/overview)

Let's start with the basic card:
```html
<h1>Available Products</h1>
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
```ts{2}
export class HomeComponent implements OnInit {
  constructor(private context:Context) { }
  ngOnInit() {
  }
}
```
:::tip NOTE
 If the `Context` class is highlighted in red, add it to the `import` statement using the "light bulb" icon in visual studio
:::
Next let's define a list of products:
```ts{3}
export class HomeComponent implements OnInit {
  constructor(private context:Context) { }
  products : Products[] = [];
  ngOnInit() {
  }
}
```

:::tip NOTE
 If the `Products` class is highlighted in red, add it to the `import` statement using the "light bulb" icon in visual studio
:::

We've defined a member called `products` of type `Products[]` (an Array of products) and have set it's initial value to an empty array (` = []`)

Now let's populate the array with products from our db:
```ts{4-6}
export class HomeComponent implements OnInit {
  constructor(private context: Context) { }
  products: Products[] = [];
  async ngOnInit() {
    this.products = await this.context.for(Products).find();
  }
}
```

Just three lines, but a lot to explain.

When developing web applications, all the calls to the server (and many many other things) are performed asynchronously. That means that while we wait for the call to the server to complete, the code can do other things (specifically not leave the user interface hung).

The fact that the call to the `find` method is asynchronous can be  inferred from it's return type - in this case `Promise<Products[]>`. Any method that returns a `Promise` will run asynchronously. In this case it return a `Promise` of type `Products[]`.

We want to wait for the result of this `Promise`. To do that we'll have to decorate the method we are running with the `async` keyword (as we've done on line 5) and use the `await` keyword when we call the method.

Now let's adjust the `home.component.html` to use these products, using the `*ngFor` directive
```html{2,4,7}
<h1>Available Products</h1>
<mat-card *ngFor="let p of products">
  <mat-card-title>
    {{p.name}}
  </mat-card-title>
  <mat-card-subtitle>
    {{p.availableFrom | date}} - {{p.availableTo | date}}
  </mat-card-subtitle>
</mat-card>
```
* We're using the `|date` angular pipe to display the dates nicely.

Now let's format the cards to display multiple cards in a row. We'll add a `css` class to the `mat-card` tag
```html{2}
<h1>Available Products</h1>
<mat-card *ngFor="let p of products" class="product-card">
  <mat-card-title>
    {{p.name}}
  </mat-card-title>
  <mat-card-subtitle>
    {{p.availableFrom | date}} - {{p.availableTo | date}}
  </mat-card-subtitle>
</mat-card>
```

and in the `home.component.scss` file we'll define that class:
```scss
.product-card{
    width:260px;
    display:inline-block;
    margin:10px;
}
```

## Sorting
Now let's sort the cards by name. In the `home.component.ts` file, let's start by sending an object to the `find` method:
```ts{2-3}
  async ngOnInit() {
    this.products = await this.context.for(Products).find({
    });
  }
```

Next let's add the `orderBy` property:
```ts{3}
  async ngOnInit() {
    this.products = await this.context.for(Products).find({
      orderBy: p => p.name
    });
  }
```

The `orderBy` property is set to a method that receives the `Products` entity and returns one of several variations:
1. The column we wanted to sort on (as we've done in this case)
2. An array of columns we want to sort on - for example: `orderBy: p => [p.name,p.availableFrom]`
3. An Array of `SortSegments` that can be used to sort descending - for example: `orderBy: p => [{ column: p.name, descending: true }, p.availableFrom]`

In our case we'll stick to simply sorting by the Product Name.

## Filtering the Data
Since we only want to show products that are available, let's filter the products to indicate that:
```ts{4-5}
  async ngOnInit() {
    this.products = await this.context.for(Products).find({
      orderBy: p => p.name
      , where: p => p.availableFrom.isLessOrEqualTo(new Date()).and(
          p.availableTo.isGreaterOrEqualTo(new Date()))
    });
  }
```

We've used the `where` property which receives a function that gets the `Products` entity as a parameter and returns a filter.

we've then used the column's filter method, these start with the `is` word and allow filtering (`isEqualTo`, `isGreaterOrEqualTo` etc...)

The result should look like this:

![](/2019-10-07_09h32_19.png)