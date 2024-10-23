# Backend only code

One of the main advantages of remult is that you write code once, and it runs both on the server and in the browser.

However, if you are using a library that only works on the server, the fact that the same code is bundled to the frontend can cause problems. For example, when you build an Angular project, you'll get `Module not found` errors.

This article will walk through such a scenario and how it can be solved.

For this example, our customer would like us to document each call to the `updatePriceOnBackend` method in a log file.

Our first instinct would be to add in the `products.controller.ts` file an import to `fs` (Node JS file system component) and write the following code:

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
ERROR in ./src/app/products/products.controller.ts
Module not found: Error: Can't resolve 'fs' in 'C:\try\test19\my-project\src\app\products'
i ｢wdm｣: Failed to compile.
```

:::

We get this error because the `fs` module on which we rely here is only relevant in the remult of a `Node JS` server and not in the context of the browser.

There are two ways to handle this:

## Solution 1 - exclude from bundler

::: tabs

== vite

### Exclude in `vite.config`

Instruct vite to exclude the `server-only` packages from the bundle

<!-- prettier-ignore-start -->
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {    // [!code ++]
    rollupOptions: {      // [!code ++]
      external: ['fs', 'nodemailer', 'node-fetch'], // [!code ++]
    }, // [!code ++]
  }, // [!code ++]
  optimizeDeps: {    // [!code ++]
    exclude: ['fs', 'nodemailer', 'node-fetch'], // [!code ++]
  }, // [!code ++]
})
```
<!-- prettier-ignore-end -->

== Webpack and Angular version <=16
Instruct `webpack` not to include the `fs` package in the `frontend` bundle by adding the following JSON to the main section of the project's `package.json` file.
_package.json_

```json
"browser": {
   "jsonwebtoken": false
}
```

- note that you'll need to restart the react/angular dev server.

== Angular 17

1. You'll need to either remove `types` entry in the `tsconfig.app.json` or add the types you need to that types array.
2. In `angular.json` you'll need to add an entry called `externalDependencies` to the `architect/build/options` key for your project

   ```json{21-23}
   // angular.json

   {
     "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
     "version": 1,
     "newProjectRoot": "projects",
     "projects": {
       "remult-angular-todo": {
         "projectType": "application",
         "schematics": {},
         "root": "",
         "sourceRoot": "src",
         "prefix": "app",
         "architect": {
           "build": {
             "builder": "@angular-devkit/build-angular:application",
             "options": {
               "outputPath": "dist/remult-angular-todo",
               "index": "src/index.html",
               "browser": "src/main.ts",
               "externalDependencies": [
                 "fs"
               ],
               "polyfills": [
                 "zone.js"
               ],
               //...

   ```

   :::

## Solution 2 - abstract the call

Abstract the call and separate it to backend only files and `inject` it only when we are running on the server.

**Step 1**, abstract the call - We'll remove the import to `fs,` and instead of calling specific `fs` methods, we'll define and call a method `writeToLog` that describes what we are trying to do:

<!-- prettier-ignore-start -->
```ts
import * as fs from 'fs'; // [!code --]

// We'll define an abstract `writeTiLog` function and use it in our code
static writeToLog:(textToWrite:string)=>void; // [!code ++]
.....
@BackendMethod({allowed:true})
static async updatePriceOnBackend(priceToUpdate:number,remult?:Remult){
  let products = await remult.repo(Products).find();
  for (const p of products) {
      p.price.value += priceToUpdate;
      await p.save();
  }
  fs.appendFileSync('./logs/log.txt', new Date() + " " + remult.user.name + " update price\n");  // [!code --]
  ProductsController.writeToLog(new Date() + " " + remult.user.name + " update price\n"); // [!code ++]
}

```

<!-- prettier-ignore-end -->

The method `writeToLog` that we've defined serves as a place holder which we'll assign to in the remult of the server.
It receives one parameter of type `string` and returns `void`.

**Step 2**, implement the method:
In the `/src/app/server` folder, we'll add a file called `log-writer.ts` with the following code:

```ts{3}
import * as fs from 'fs';
import { ProductsController } from '../products/products.controller';
ProductsController.writeToLog = what => fs.appendFileSync('./logs/log.txt', what);
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

## Additional Resources

Check out this video where I implemented a similar solution when running into the same problem using `bcrypt`:

<iframe width="560" height="315" src="https://www.youtube.com/embed/9lWQwAUcKEM?start=1035" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
