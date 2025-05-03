# Deployment

Let's deploy the todo app to [railway.app](https://railway.app/).

## Prepare for Production

In this tutorial, we'll deploy both the Angular app and the API server as [one server-side app](https://create-react-app.dev/docs/deployment/#other-solutions), and redirect all non-API requests to return the Angular app.

In addition, to follow a few basic production best practices, we'll use [compression](https://www.npmjs.com/package/compression) middleware to improve performance and [helmet](https://www.npmjs.com/package/helmet) middleware for security

1. Add the highlighted code lines to `src/server/index.ts`, and modify the `app.listen` function's `port` argument to prefer a port number provided by the production host's `PORT` environment variable.

```ts{16-21}
// src/server/index.ts

import express from "express"
import { api } from "./api.js"
import session from "cookie-session"
import { auth } from "./auth.js"

const app = express()
app.use(
  session({
    secret: process.env["SESSION_SECRET"] || "my secret"
  })
)
app.use(auth)
app.use(api)
const frontendFiles = process.cwd() + "/dist/remult-angular-todo/browser";
app.use(express.static(frontendFiles));
app.get("/*", (_, res) => {
  res.sendFile(frontendFiles + "/index.html");
});
app.listen(process.env["PORT"] || 3002, () => console.log("Server started"));
```

::: warning Angular versions <17
If you're using angular version 16 or less, the result path is: `'/dist/remult-angular-todo/browser`
:::

3. Modify the highlighted code in the api server module to prefer a `connectionString` provided by the production host's `DATABASE_URL` environment variable.

   ```ts{4,7-9}
   // src/server/api.ts

   //...
   const DATABASE_URL = process.env["DATABASE_URL"];

   export const api = remultApi({
    dataProvider: DATABASE_URL
      ? createPostgresDataProvider({ connectionString: DATABASE_URL })
      : undefined,
      //...
    })
   ```

::: warning Note
In order to connect to a local PostgresDB, add `DATABASE_URL` to an .env file, or simply replace `process.env["DATABASE_URL"]` with your `connectionString`.

If no `DATABASE_URL` has found, it'll fallback to our local JSON files.
:::

4. In the root folder, create a TypeScript configuration file `tsconfig.server.json` for the build of the server project using TypeScript.

```json
// tsconfig.server.json

{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "esModuleInterop": true,
    "noEmit": false,
    "outDir": "dist",
    "skipLibCheck": true,
    "rootDir": "src"
  },
  "include": ["src/server/index.ts"]
}
```

5. Modify the project's `build` npm script to additionally transpile the API server's TypeScript code to JavaScript (using `tsc`).

```json
// package.json

"build": "ng build && tsc -p tsconfig.server.json"
```

6. Modify the project's `start` npm script to start the production Node.js server.

```json
// package.json

"start": "node dist/server/"
```

The todo app is now ready for deployment to production.

## Test Locally

To test the application locally run

```sh
npm run build
npm run start
```

Now navigate to http://localhost:3002 and test the application locally

## Deploy to Railway

In order to deploy the todo app to [railway](https://railway.app/) you'll need a `railway` account. You'll also need [Railway CLI](https://docs.railway.app/develop/cli#npm) installed, and you'll need to login to railway from the cli, using `railway login`.

Click enter multiple times to answer all its questions with the default answer

1. Create a Railway `project`.

   From the terminal in your project folder run:

   ```sh
   railway init
   ```

2. Set a project name.
3. Once that's done run the following command to open the project on railway.dev:
   ```sh
   railway open
   ```
4. Once that's done run the following command to upload the project to railway:
   ```sh
   railway up
   ```
5. Add Postgres Database:
   1. In the project on `railway.dev`, click `+ Create`
   2. Select `Database`
   3. Select `Add PostgresSQL`
6. Configure the environment variables
   1. Click on the project card (not the Postgres one)
   2. Switch to the `variables` tab
   3. Click on `+ New Variable`, and in the `VARIABLE_NAME` click `Add Reference` and select `DATABASE_URL`
   4. Add another variable called `SESSION_SECRET` and set it to a random string, you can use an [online UUID generator](https://www.uuidgenerator.net/)
   5. Switch to the `settings` tab
   6. Under `Environment` click on `Generate Domain`
   7. Click on the `Deploy` button on the top left.
7. Once the deployment is complete -
8. Click on the newly generated url to open the app in the browser and you'll see the app live in production. (it may take a few minutes to go live)

::: warning Note
If you run into trouble deploying the app to Railway, try using Railway's [documentation](https://docs.railway.app/deploy/deployments).
:::

That's it - our application is deployed to production, play with it and enjoy.

Love Remult?&nbsp;<a href="https://github.com/remult/remult" target="_blank" rel="noopener"> Give our repo a star.⭐</a>
