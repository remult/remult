# Express

### Install Required Packages

To set up your Express server with Remult, run the following commands to install the necessary packages:

```sh
npm install express remult
npm install --save-dev @types/express tsx
```

### Bootstrap Remult in the Backend

Remult is integrated into your backend as an `Express middleware`.

1. **Create the API File**

   Create a new `api.ts` file in the `src/server/` folder with the following code to set up the Remult middleware:

   ```ts
   // src/server/api.ts

   import { remultApi } from 'remult/remult-express'

   export const api = remultApi()
   ```

2. **Register the Middleware**

   Update the `index.ts` file in your `src/server/` folder to include the Remult middleware. Add the following lines:

   ```ts{4,7}
   // src/server/index.ts

   import express from "express"
   import { api } from "./api.js"

   const app = express()
   app.use(api)

   app.listen(3002, () => console.log("Server started"))
   ```

   ::: warning ESM Configuration
   In this tutorial, we are using ECMAScript modules (`esm`) for the Node.js server. This means that when importing files, you must include the `.js` suffix (as shown in the `import { api } from "./api.js"` statement).

   Additionally, make sure to set `"type": "module"` in your `package.json` file.
   :::

#### Create the Server's TypeScript Configuration

In the root folder, create a TypeScript configuration file named `tsconfig.server.json` to manage the server's settings:

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

To simplify the development process, add a new script in your `package.json` file to start the Express server in development mode:

```json
// package.json

"dev-node": "tsx watch --env-file=.env --tsconfig tsconfig.server.json src/server"
```

- `tsx`: A TypeScript Node.js execution environment that watches for file changes and automatically restarts the server on each save.
- `--env-file=.env`: Ensures environment variables are loaded from the `.env` file.
- `--tsconfig tsconfig.server.json`: Specifies the TypeScript configuration file for the server.

#### Start the Node Server

Finally, open a new terminal and run the following command to start the development server:

```sh
npm run dev-node
```

The server will now run on port 3002. `tsx` will watch for any file changes, automatically restarting the server whenever updates are made.
