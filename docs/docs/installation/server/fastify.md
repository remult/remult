# Fastify

### Install Required Packages

To set up your Fastify server with Remult, run the following commands to install the necessary packages:

```sh
npm install fastify remult
npm install --save-dev tsx
```

### Bootstrap Remult in the Backend

Remult is integrated into your backend as Fastify middleware.

1. **Create the API File**

   Create a new `api.ts` file in the `src/server/` folder with the following code to set up the Remult middleware for Fastify:

   ```ts
   // src/server/api.ts

   import { remultFastify } from 'remult/remult-fastify'

   export const api = remultFastify()
   ```

2. **Register the Middleware**

   Update the `index.ts` file in your `src/server/` folder to include the Remult middleware. Add the following lines:

   ```ts{5,9}
   // src/server/index.ts

   import fastify from "fastify"
   import { api } from "./api.js"

   const app = Fastify();

   app.register(api);

   app.listen({ port: 3002 }, () => console.log("Server started"))
   ```

   ::: warning ESM Configuration
   Similar to the Express setup, when using ECMAScript modules (`esm`) in Fastify, you must include the `.js` suffix when importing files (as shown in the `import { api } from "./api.js"` statement).

   Also, ensure that `"type": "module"` is set in your `package.json`.
   :::

#### Create the Server's TypeScript Configuration

In the root folder, create a TypeScript configuration file named `tsconfig.server.json` for the server project:

```json
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

This configuration enables TypeScript decorators, ensures compatibility with ECMAScript modules, and specifies the file paths for the server and shared code.

#### Create an `npm` Script to Start the API Server

To simplify the development process, add a new script in your `package.json` to start the Fastify server in development mode:

```json
// package.json

"dev-node": "tsx watch --env-file=.env --tsconfig tsconfig.server.json src/server"
```

- `tsx`: A TypeScript Node.js execution environment that watches for file changes and automatically restarts the server on each save.
- `--env-file=.env`: Ensures environment variables are loaded from the `.env` file.
- `--tsconfig tsconfig.server.json`: Specifies the TypeScript configuration file for the server.

#### Start the Fastify Server

Open a new terminal and run the following command to start the development server:

```sh
npm run dev-node
```

The server will now run on port 3002. `tsx` will watch for any file changes, automatically restarting the Fastify server whenever updates are made.
