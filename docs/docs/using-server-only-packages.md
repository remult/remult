# Backend only code

One of the main advantages of remult is that you write code once, and it runs both on the server and in the browser.

However, if you are using a library that only works on the server, the fact that the same code is bundled to the frontend can cause problems. For example, when you build an Angular project, you'll get `Module not found` errors.

This article will walk through such a scenario and how it can be solved.

For this example, our customer would like us to document each call to the `updatePriceOnBackend` method in a log file.

Our first instinct would be to add in the `products.component.ts` file an import to `fs` (Node JS file system component) and write the following code:

```ts{1,10}
import * as fs from 'fs';
.....
@BackendMethod({allowed:true})
static async updatePriceOnBackend(priceToUpdate:number,remult?:Remult){
  let products = await remult.repo(Products).find();
  for (const p of products) {
      p.price.value += priceToUpdate;
      await p.save();
  }
  fs.appendFileSync('./logs/log.txt', new Date() + " " + remult.user.name + " update price\n");
}
```

::: danger Error
As soon as we do that, we'll get the following errors on the `ng-serve` terminal

```sh
ERROR in ./src/app/products/products.component.ts
Module not found: Error: Can't resolve 'fs' in 'C:\try\test19\my-project\src\app\products'
i ｢wdm｣: Failed to compile.
```

:::

We get this error because the `fs` module on which we rely here is only relevant in the remult of a `Node JS` server and not in the context of the browser.

There are two ways to handle this:

## Solution 1 - exclude from bundler

### Step 1 - replace the File level import with an import in the specific backend method:

```ts{1,5}
// import * as fs from 'fs'; <-- REMOVE THIS LINE
.....
@BackendMethod({allowed:true})
static async updatePriceOnBackend(priceToUpdate:number,remult?:Remult){
  const fs = await import('fs');
  let products = await remult.repo(Products).find();
  for (const p of products) {
      p.price.value += priceToUpdate;
      await p.save();
  }
  fs.appendFileSync('./logs/log.txt', new Date() + " " + remult.user.name + " update price\n");
}
```

### Step 2 - Exclude the package from the bundler:

- If you're using `vite` instruct `vite` not to include the `fs` package in the `frontend` bundle by adding the following JSON to the `vite-config.ts` file:

  ```ts{7-11}
  import { defineConfig } from "vite"
  import react from "@vitejs/plugin-react"

  // https://vitejs.dev/config/
  export default defineConfig({
    plugins: [react()],
    build: {
      rollupOptions: {
        external: ["fs", "nodemailer", "node-fetch"],
      },
    },
  })
  ```

- If you're using `webpack` (create-react-app or Angular) Instruct `webpack` not to include the `fs` package in the `frontend` bundle by adding the following JSON to the main section of the project's `package.json` file.
  _package.json_
  ```json
  "browser": {
     "jsonwebtoken": false
  }
  ```

* note that you'll need to restart the react/angular dev server.

## Solution 2 - abstract the call

Abstract the call and separate it to backend only files and `inject` it only when we are running on the server.

**Step 1**, abstract the call - We'll remove the import to `fs,` and instead of calling specific `fs` methods, we'll define and call a method `writeToLog` that describes what we are trying to do:

```ts{1,11,13}
//import * as fs from 'fs';
.....
@BackendMethod({allowed:true})
static async updatePriceOnBackend(priceToUpdate:number,remult?:Remult){
  let products = await remult.repo(Products).find();
  for (const p of products) {
      p.price.value += priceToUpdate;
      await p.save();
  }
  //fs.appendFileSync('./logs/log.txt', new Date() + " " + remult.user.name + " update price\n");
  ProductsComponent.writeToLog(new Date() + " " + remult.user.name + " update price\n");
}
static writeToLog:(textToWrite:string)=>void;
```

The method `writeToLog` that we've defined serves as a place holder which we'll assign to in the remult of the server.
It receives one parameter of type `string` and returns `void`.

**Step 2**, implement the method:
In the `/src/app/server` folder, we'll add a file called `log-writer.ts` with the following code:

```ts{3}
import * as fs from 'fs';
import { ProductsComponent } from '../products/products.component';
ProductsComponent.writeToLog = what => fs.appendFileSync('./logs/log.txt', what);
```

Here we set the implementation of the `writeToLog` method with the actual call to the `fs` module.
This file is intended to only run on the server, so it'll not present us with any problem.

**Step 3**, load the `log-writer.ts` file:
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
If you're still getting an error - check that you have a `logs` folder on your project :)
:::
