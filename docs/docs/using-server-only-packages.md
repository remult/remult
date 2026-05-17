---
llm: "Keep Node-only deps (fs, etc.) out of client bundles via import.meta.env.SSR, dynamic import, or build aliases."
---

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

There are three ways to handle this:

## Solution 1 - guard with `if (import.meta.env.SSR)`

In Vite-based projects (React-Vite, Vue, SvelteKit, SolidStart, ...), wrap the server-only section in `if (import.meta.env.SSR) { ... }` and dynamically `import()` the Node-only dep inside the block. Vite resolves `import.meta.env.SSR` at build time (`false` on the client bundle), so the entire branch - including the dynamic import - is dropped from the client.

```ts
@BackendMethod({ allowed: true })
static async log(msg: string) {
  if (import.meta.env.SSR) {
    const { appendFileSync } = await import('fs')
    appendFileSync('./logs/log.txt', `${new Date().toISOString()} ${msg}\n`)
  }
}
```

Same pattern in an entity `saved` hook:

```ts
@Entity<Post>('posts', {
  saved: async (post) => {
    if (import.meta.env.SSR) {
      const { appendFileSync } = await import('fs')
      appendFileSync('./logs/log.txt', `${new Date().toISOString()} saved ${post.id}\n`)
    }
  },
})
```

::: warning Early-return does NOT work
`if (!import.meta.env.SSR) return` at the top of a `BackendMethod` does **not** strip the Node-only deps from the client bundle - you'll still get `Module not found`. Always wrap the server-only section in `if (import.meta.env.SSR) { ... }`.
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

## Solution 3 - exclude from bundler

Tell the bundler to leave the server-only packages out of the frontend bundle.

::: tabs

== Vite

In `vite.config.ts`, mark the packages as `external` and exclude them from `optimizeDeps`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ['fs', 'nodemailer', 'node-fetch'],
    },
  },
  optimizeDeps: {
    exclude: ['fs', 'nodemailer', 'node-fetch'],
  },
})
```

== Webpack and Angular <= 16

Add a `browser` field to `package.json` mapping the server-only package to `false`:

```json
"browser": {
  "jsonwebtoken": false
}
```

Restart the dev server after editing.

== Angular 17+

1. Either remove the `types` entry in `tsconfig.app.json`, or add the types you need to its `types` array.
2. In `angular.json`, add an `externalDependencies` entry under `architect.build.options`:

```json
// angular.json
{
  "projects": {
    "remult-angular-todo": {
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:application",
          "options": {
            "externalDependencies": ["fs"]
          }
        }
      }
    }
  }
}
```

:::

## Additional Resources

Check out this video where I implemented a similar solution when running into the same problem using `bcrypt`:

<iframe width="560" height="315" src="https://www.youtube.com/embed/9lWQwAUcKEM?start=1035" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
