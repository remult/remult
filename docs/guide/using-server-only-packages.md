# Using Node JS Packages (server only)
One of the core advantages of remult is that you write your code once and it runs both on the server and in the browser.

Although this can useful for most cases, if you are using an npm package that only makes sense in the context of the Node JS Server and wouldn't work in a browser, the fact that the same code "compiles" both to the server and the client can cause problems.

When you'll build the angular project you'll get errors of `Module not found`.
In this article we'll walk thorough such a scenario and demonstrate how it can be solved.

For the purpose of this example, our customer would like us to document each call to the `updatePriceOnServer` method in a log fie.

Our first instinct would be to add in the `products.component.ts` file an import to `fs` (Node JS file system component) and write the following code:
```ts{1,10}
import * as fs from 'fs';
.....
@ServerFunction({allowed:true})
static async updatePriceOnServer(priceToUpdate:number,context?:Context){
  let products = await context.for(Products).find();
  for (const p of products) {
      p.price.value += priceToUpdate;
      await p.save();
  }
  fs.appendFileSync('./logs/log.txt', new Date() + " " + context.user.name + " update price\n");
}
```

::: danger Error
 As soon as we do that we'll get the following errors on the `ng-serve` terminal
 ```sh
 ERROR in ./src/app/products/products.component.ts
Module not found: Error: Can't resolve 'fs' in 'C:\try\test19\my-project\src\app\products'
i ｢wdm｣: Failed to compile.
 ```
:::

The reason we get this error is that the `fs` module on which we rely here, is only relevant in the context of a `Node JS` server and not in the context of the browser.

To solve this problem, we'll `abstract` the call to `fs` and `inject` it only when we are running on the server.

## Step 1, abstract the call
We'll remove the import to `fs` and instead of calling specific `fs` methods we'll define and call a method `writeToLog` that describes what we are trying to do:

```ts{1,11,13}
//import * as fs from 'fs';
.....
@ServerFunction({allowed:true})
static async updatePriceOnServer(priceToUpdate:number,context?:Context){
  let products = await context.for(Products).find();
  for (const p of products) {
      p.price.value += priceToUpdate;
      await p.save();
  }
  //fs.appendFileSync('./logs/log.txt', new Date() + " " + context.user.name + " update price\n");
  ProductsComponent.writeToLog(new Date() + " " + context.user.name + " update price\n");
}
static writeToLog:(textToWrite:string)=>void;
```

The method `writeToLog` that we've defined serves as a place holder which we'll assign to in the context of the server.
It receives one parameter of type `string` and returns `void`

## Step 2, implement the method
In the `/src/app/server` folder, we'll add a file called `log-writer.ts` with the following code:
```ts{3}
import * as fs from 'fs';
import { ProductsComponent } from '../products/products.component';
ProductsComponent.writeToLog = what => fs.appendFileSync('./logs/log.txt', what);
```

Here we set the implementation of the `writeToLog` method with the actual call to the `fs` module.
This file is intended to only run in the server, so it'll not present us with any problem.

## Step 3, load the `log-writer.ts` file
In the `/src/app/server/server-init.ts` file, load the `log-writer.ts` file using an `import` statement
```ts{2}
import '../app.module';
import './log-writer'; //load the log-writer.ts file

import { Pool } from 'pg';
import { config } from 'dotenv';
import { PostgresDataProvider, PostgresSchemaBuilder } from '@remult/server-postgres';
import * as passwordHash from 'password-hash';

```

That's it - it'll work now.
::: tip
If you're still getting some kind of error - check that you have a `logs` folder on your project :)
:::