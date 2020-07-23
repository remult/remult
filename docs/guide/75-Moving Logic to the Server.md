# Moving Logic to the Server

In the previous article we've create a process that runs for each product and updates it. 
As we've written this process, it runs in the browser, requesting the server for a list of products, and then for every product sends another request to the server to perform the update.
Although this is valid when you have 10-20 products, if you have a 1000 products this can become slow, as each `save` call will take 0.1 seconds - times 1000 it's more than a minute.

An easy way to improve the performance, is to make a single call to the server and do all the business logic there.

Let's refactor the code in `update-price.component.ts` to do that:

We'll perform several steps:
1. Separate the update logic from the UI (the alert messages)
2. Make our method static
3. Decorate the method with the `@ServerFunction` decorator

Here's the result:

Let's start with separating the update logic from the UI
```ts{1-10,15-21,23}
  async actualUpdatePrices() {
    let products = await this.context.for(Products).find();
    let count = 0;
    for (const p of products) {
      p.price.value += this.amountToAdd;
      await p.save();
      count++;
    }
    return count;
  }
  async updatePrices() {
    if (!this.amountToAdd || this.amountToAdd < 1) {
      alert("Please enter a valid amount");
      return;
    }
//   let products = await this.context.for(Products).find();
//   let count = 0;
//   for (const p of products) {
//     p.price.value += this.amountToAdd;
//     await p.save();
//     count++;
//   }
    let count = await this.actualUpdatePrices();
    alert("updated " + count + " products");
  }
```

Next we'll make the `actualUpdatePrices` method static and decorate it with the `ServerFunction` decorator
```ts{1-3,6,18}
 @ServerFunction({ allowed: true })
 static async actualUpdatePrices(amountToAdd:number,context?:Context) {
   let products = await context.for(Products).find({});
    let count = 0;
    for (const p of products) {
      p.price.value += amountToAdd;
      await p.save();
      count++;
    }
    return count;
  }
  async updatePrices() {
    if (!this.amountToAdd || this.amountToAdd < 1) {
      alert("Please enter a valid amount");
      return;
    }
    
    let count = await UpdatePriceComponent.actualUpdatePrices(this.amountToAdd);
    alert("updated " + count + " products");
  }
```

Let's review:
1. First we've changed the method to be a `static` method - line 3
   1. Now that the method is `static` it can no longer access the `this` keyword to get the `amountToAdd` value, so it'll receive it as a parameter. (lines 3 and 9)
   2. Also the `context` is not available for the `static` method - so we'll add it as a parameter, but this parameter is optional (as indicated by the ?). When calling this method to the server, it'll automatically receive a `context` object on the server with everything it needs to run. (lines 3 and 5)
   3. On line 21 we can no longer use `this` to call the static method, instead we use the name of the component `UpdatePriceComponent` and we send it the `this.amountToAdd` variable.

If we'll review the output of the `node-serve` window, we'll see that a new API entry was added to the list:
```sh{3}
/api/signIn
/api/resetPassword
/api/actualUpdatePrices
/api/Categories
/api/Products
/api/Users
```