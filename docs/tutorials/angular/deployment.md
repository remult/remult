# Deployment

Let's deploy the todo app to [railway.app](https://railway.app/).

## Prepare for Production

In this tutorial, we'll deploy both the Angular app and the API server as [one server-side app](https://create-react-app.dev/docs/deployment/#other-solutions), and redirect all non-API requests to return the Angular app.

In addition, to follow a few basic production best practices, we'll use [compression](https://www.npmjs.com/package/compression) middleware to improve performance and [helmet](https://www.npmjs.com/package/helmet) middleware for security

1. Install `compression` and `helmet`.

```sh
npm i compression helmet
npm i @types/compression --save-dev
```

2. Add the highlighted code lines to `src/server/index.ts`, and modify the `app.listen` function's `port` argument to prefer a port number provided by the production host's `PORT` environment variable.

```ts{7-9,17-18,21-26}
// src/server/index.ts

import express from "express"
import { api } from "./api"
import session from "cookie-session"
import { auth } from "./auth"
import helmet from "helmet"
import compression from "compression"
import path from "path"

const app = express()
app.use(
  session({
    secret: process.env["SESSION_SECRET"] || "my secret"
  })
)
app.use(helmet())
app.use(compression())
app.use(auth)
app.use(api)
app.use(express.static(path.join(__dirname, "../remult-angular-todo")))
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "../remult-angular-todo", "index.html"))
})

app.listen(process.env["PORT"] || 3002, () => console.log("Server started"))
```

3. Modify the highlighted code in the api server module to prefer a `connectionString` provided by the production host's `DATABASE_URL` environment variable.

   ```ts{7}
   // src/server/api.ts

   //...
   export const api = remultExpress({
     //...
     dataProvider: createPostgresDataProvider({
       connectionString: process.env["DATABASE_URL"] || "your connection string"
     })
     //...
   })
   ```

1. In the root folder, create a TypeScript configuration file `tsconfig.server.json` for the build of the server project using TypeScript.

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

## Deploy to Railway

In order to deploy the todo app to [railway](https://railway.app/) you'll need a `railway` account. You'll also need [Railway CLI](https://docs.railway.app/develop/cli#npm) installed, and you'll need to login to railway from the cli, using `railway login`.

Click enter multiple times to answer all its questions with the default answer

1. Create a Railway `project`.

   From the terminal in your project folder run:

   ```sh
   railway init
   ```

2. Select `Empty Project`
3. Set a project name.
4. Once it's done add a database by running the following command:
   ```sh
   railway add
   ```
5. Select `postgressql` as the database.
6. Once that's done run the following command to upload the project to railway:
   ```sh
   railway up
   ```
7. got to the `railway` project's site and click on the project
8. Switch to the `variables` tab
9. Click on `+ New Variable`, and in the `VARIABLE_NAME` click `Add Reference` and select `DATABASE_URL`
10. Add another variable called `SESSION_SECRET` and set it to a random string, you can use an [online UUID generator](https://www.uuidgenerator.net/)
11. Switch to the `settings` tab
12. Under `Environment` click on `Generate Domain`
13. Click on the newly generated url to open the app in the browser and you'll see the app live in production. (it may take a few minutes to go live)

::: warning Note
If you run into trouble deploying the app to Railway, try using Railway's [documentation](https://docs.railway.app/deploy/deployments).
:::

That's it - our application is deployed to production, play with it and enjoy.

Love Remult?&nbsp;<a href="https://github.com/remult/remult" target="_blank" rel="noopener"> Give our repo a star.⭐</a>
