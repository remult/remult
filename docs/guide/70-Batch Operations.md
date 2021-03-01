# Batch Operations

The next requirement from our users is to be able to update the price of all products by a fixed amount in a simple operation.

First we'll add a number column that'll be used to store the price we want to update:

<<< @/docs-code/products-batch-operations/products.component.step1.ts{17-19}

We'll use Material design to format our [input](https://material.angular.io/components/input/overview) and [button](https://material.angular.io/components/button/overview)

Add the following styles to the `products.component.scss` - they'll help us with alignment of objects in our page.

<<< @/docs-code/products-batch-operations/products.component.scss

Next we'll adjust the html to display above the grid an input for our column and a button

<<< @/docs-code/products-batch-operations/products.component.html

* we've used the `data-control` element to display the column as an input.
* In the click event of the button, we've called the `updatePrice` method which we'll implement next.
 
## Updating the data
In the `products.component.ts`:

<<< @/docs-code/products-batch-operations/products.component.step2.ts{19-24}

* We use `await p.save()` to save the products one by one. (to do this, we have to add the word `async` before the `updatePrice` method as we've done in the previous step)
* we use `this.products.getRecords()` to refresh the data displayed on the grid.

