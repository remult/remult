# Batch Operations

The next requirement from our users is to be able to update the price of all products by a fixed amount in a simple operation.

We'll add an input and a button to the html and bind them to the `priceInput` field and `updatePrice` method that we'll add to the code.
In the 'products.component.html` file
```html
<input [(ngModel)]="priceInput">
<button (click)="updatePrice()">Update Price</button>
<data-grid [settings]="products"></data-grid>
```
In the 'products.component.ts` file

<<< @/docs-code/products-batch-operations/products.component.step1.ts{17-19}

## Updating the data
In the `products.component.ts`:

<<< @/docs-code/products-batch-operations/products.component.step2.ts{20-24}

* Note that we convert the `priceInput` from string to number, since all inputs return strings in angular.
* We use `await p.save()` to save the products one by one. (to do this, we have to add the word `async` before the `updatePrice` method as we've done in the previous step)
* we use `this.products.reloadData()` method to refresh the data displayed on the grid.

