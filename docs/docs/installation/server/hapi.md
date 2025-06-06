# Hapi

### Install Required Packages

To set up your Hapi server with Remult, install the necessary packages:

```sh
npm install @hapi/hapi remult
npm install --save-dev tsx
```

### Bootstrap Remult in the Backend

Remult is integrated into your backend as a Hapi plugin.

1. **Create the API File**

   Create a new `api.ts` file in the `src/server/` folder with the following code to set up the Remult middleware for Hapi:

   ```ts
   // src/server/api.ts

   import { remultApi } from 'remult/remult-hapi'

   export const api = remultApi({})
   ```

2. **Register the Middleware**

   Update the `index.ts` file in your `src/server/` folder to include the Remult middleware. Add the following code:

   ```ts{5-7,10}
   // src/server/index.ts

   import { server } from '@hapi/hapi'
   import { api } from './api.js'

   const hapi = server({ port: 3002 })

   await hapi.register(api)

   hapi.start().then(() => console.log("Server started"))
   ```

   ::: warning ESM Configuration
   When using ECMAScript modules (`esm`) in Hapi, ensure you include the `.js` suffix when importing files, as shown in the `import { api } from './api.js'` statement.

   Also, make sure that `"type": "module"` is set in your `package.json`.
   :::

#### Create the Server's TypeScript Configuration

In the root folder, create a TypeScript configuration file named `tsconfig.server.json` for the Hapi server:

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

Add a new script in your `package.json` to start the Hapi server in development mode:

```json
// package.json

"dev-node": "tsx watch --env-file=.env --tsconfig tsconfig.server.json src/server"
```

- `tsx`: A TypeScript execution environment that watches for file changes and automatically restarts the server on each save.
- `--env-file=.env`: Ensures environment variables are loaded from the `.env` file.
- `--tsconfig tsconfig.server.json`: Specifies the TypeScript configuration file for the server.

#### Start the Hapi Server

Open a new terminal and run the following command to start the development server:

```sh
npm run dev-node
```

The server will now run on port 3002. `tsx` will watch for file changes, automatically restarting the Hapi server whenever updates are made.
