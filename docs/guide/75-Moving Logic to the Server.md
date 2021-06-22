# Moving Logic to the Backend

In the previous article we've create a process that runs for each product and updates it. 
As we've written this process, it runs in the browser, requesting the Backend for a list of products, and then for every product sends another request to the Backend to perform the update.
Although this is valid when you have 10-20 products, if you have a 1000 products this can become slow, as each `save` call will take 0.1 seconds - times 1000 it's more than a minute.

An easy way to improve the performance, is to make a single call to the Backend and do all the business logic there.

Let's refactor the code to do that:

<<< @/docs-code/products-batch-operations/products.component.ts{20-33} 

* We've created a new static method called `updatePriceOnBackend` and moved the code to it
* * note that the `context` parameter is marked as optional - that parameter will automatically be injected with the Backend context once this method will run on the Backend.
* * note that since this is a `static` method, we can't use the `this` keyword so instead of writing `this.context.for(Products)` we write `context.for(Products) ` and we receive the context as a parameter.
* * note that we also that the parameter `priceToUpdate` is typed, which means that we achieved type check across backend calls.
* We've tagged it with the `@BackendMethod` decorator to indicate that it runs on the Backend and we've moved the code to it.
* * In the parameter sent to the `@BackendMethod` decorator, we've set the `allowed` property to `true` indicating that anyone can run this function. Later we'll restrict it to users with specific roles.

If we'll review the output of the `node-serve` window, we'll see that a new API entry was added to the list:
```sh{4}
/api/Users_methods/create
/api/Users_methods/updatePassword
/api/resetPassword
/api/updatePriceOnBackend
/api/signIn
/api/Products
/api/Users
```