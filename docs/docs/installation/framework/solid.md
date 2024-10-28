# SolidStart

### Step 1: Create a New SolidStart Project

Run the following command to initialize a new SolidStart project:

```sh
npm init solid@latest remult-solid-start
```

Answer the prompts as follows:

```sh
o  Is this a Solid-Start project?   Yes
o  Which template would you like to use?   basic
o  Use TypeScript?   Yes
```

Once completed, navigate to the project directory:

```sh
cd remult-solid-start
```

### Step 2: Install Remult

To install the Remult package, run:

```sh
npm i remult
```

### Step 3: Bootstrap Remult in the Backend

Remult is integrated into `SolidStart` using a [catch-all dynamic API route](https://start.solidjs.com/core-concepts/routing#catch-all-routes), which passes API requests to a handler created using the `remultSolidStart` function.

1. **Create the Remult API Configuration File**

   In the `src` directory, create a file named `api.ts` with the following code:

   ```ts
   // src/api.ts

   import { remultSolidStart } from 'remult/remult-solid-start'

   export const api = remultSolidStart({})
   ```

2. **Set Up the Catch-All API Route**

   In the `src/routes/api/` directory, create a file named `[...remult].ts` with the following code:

   ```ts
   // src/routes/api/[...remult].ts

   import { api } from '../../api.js'

   export const { POST, PUT, DELETE, GET } = api
   ```

### Step 4: Enable TypeScript Decorators

1. **Install Babel Plugins for Decorators**:

   ```sh
   npm i -D @babel/plugin-proposal-decorators @babel/plugin-transform-class-properties
   ```

2. **Configure Babel Plugins in SolidStart**:

   Add the following configuration to the `app.config.ts` file to enable TypeScript decorators:

   ```ts{6-14}
   // app.config.ts

   import { defineConfig } from "@solidjs/start/config"

   export default defineConfig({
     //@ts-ignore
     solid: {
       babel: {
         plugins: [
           ["@babel/plugin-proposal-decorators", { version: "legacy" }],
           ["@babel/plugin-transform-class-properties"],
         ],
       },
     },
   })
   ```

### Setup Complete

Your SolidStart project is now set up with Remult and ready to run. You can now proceed to the next steps of building your application.
