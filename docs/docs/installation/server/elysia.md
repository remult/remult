# Elysia

### Install Required Packages

To set up your Elysia server with Remult, install the necessary packages:

```sh
npm install elysia @elysiajs/node remult
npm install --save-dev tsx
```

### Bootstrap Remult in the Backend

Remult is integrated into your backend using the `remultApi` adapter for Hono

:::info
Yes, the Elysia shares the same adapter as Hono!
:::

1. **Create the API File**

   Create a new `api.ts` file in the `src/server/` folder with the following code to set up the Remult middleware:

   ::: code-group

   ```ts [src/server/api.ts]
   import { remultApi } from 'remult/remult-hono'

   export const api = remultApi({})
   ```

   :::

2. **Register the Middleware**

   Update the `index.ts` file in your `src/server/` folder to include the Remult middleware. Add the following code:

::: code-group

```ts{3,7} [src/server/index.ts]
import { Elysia } from "elysia";
import { node } from "@elysiajs/node";
import { api } from "./api.js";

const elysiaApp = new Elysia({ adapter: node() })
  .get("/", () => "Elysia meets Remult!")
  .mount("", api.fetch);

elysiaApp.listen(3000, () =>
  console.log("Server running on http://localhost:3000")
);

```

:::
::: warning ESM Configuration
When using ECMAScript modules (`esm`) in Elysia, ensure you include the `.js` suffix when importing files, as shown in the `import { api } from './api.js'` statement.

Also, make sure that `"type": "module"` is set in your `package.json`.
:::

#### Create the Server's TypeScript Configuration

In the root folder, create a TypeScript configuration file named `tsconfig.server.json` for the Elysia server:

::: code-group

```json [tsconfig.server.json]
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "outDir": "dist",
    "rootDir": "src",
    "module": "nodenext"
  },
  "include": ["src/server/**/*", "src/shared/**/*"]
}
```

:::

This configuration enables TypeScript decorators, ensures compatibility with ECMAScript modules, and specifies the file paths for the server and shared code.

#### Create an `npm` Script to Start the API Server

Add a new script in your `package.json` to start the Elysia server in development mode:

::: code-group

```json [package.json]
"scripts": {
  "dev-node": "tsx watch --env-file=.env --tsconfig tsconfig.server.json src/server"
}
```

:::

- `tsx`: A TypeScript execution environment that watches for file changes and automatically restarts the server on each save.
- `--env-file=.env`: Ensures environment variables are loaded from the `.env` file.
- `--tsconfig tsconfig.server.json`: Specifies the TypeScript configuration file for the server.

#### Start the Elysia Server

Open a new terminal and run the following command to start the development server:

```sh
npm run dev-node
```

`tsx` will watch for file changes, automatically restarting the Elysia server whenever updates are made.
