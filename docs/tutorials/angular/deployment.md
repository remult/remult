# Deployment

Let's deploy the todo app to [Heroku](https://www.heroku.com/).

## Prepare for Production

In this tutorial, we'll deploy both the Angular app and the API server as [one server-side app](https://create-react-app.dev/docs/deployment/#other-solutions), and redirect all non-API requests to return the Angular app.

In addition, to follow a few basic production best practices, we'll use [compression](https://www.npmjs.com/package/compression) middleware to improve performance, [helmet](https://www.npmjs.com/package/helmet) middleware for security CSRF to protect the api and redirect all non-HTTPS requests to HTTPS using [heroku-ssl-redirect](https://www.npmjs.com/package/heroku-ssl-redirect)

1. Install `compression`, `helmet`, `csurf`, `cookie-parser` and `heroku-ssl-redirect`.

```sh
npm i compression helmet heroku-ssl-redirect csurf cookie-parser
npm i @types/compression @types/csurf @types/cookie-parser --save-dev
```

2. Add the highlighted code lines to `src/server/index.ts`, and modify the `app.listen` function's `port` argument to prefer a port number provided by the production host's `PORT` environment variable.

*src/server/index.ts*
```ts{5-10,16-19,21-25,27-32}
import express from "express";
import { api } from "./api";
import session from "cookie-session";
import { auth } from "./auth";
import helmet from 'helmet';
import compression from 'compression';
import sslRedirect from 'heroku-ssl-redirect';
import path from 'path';
import csrf from "csurf";
import cookieParser from "cookie-parser";

const app = express();
app.use(session({
    secret: process.env['TOKEN_SIGN_KEY'] || "my secret"
}));
app.use(sslRedirect());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use("/api", cookieParser());
app.use(auth);
app.use('/api', csrf({ cookie: true }));
app.use("/api", (req, res, next) => {
    res.cookie("XSRF-TOKEN", req.csrfToken());
    next();
});
app.use(api);

app.use(express.static(path.join(__dirname, '../remult-angular-todo')));
app.get('/*', function (req, res) {
   res.sendFile(path.join(__dirname, '../remult-angular-todo', 'index.html'));
});
app.listen(process.env["PORT"] || 3002, () => console.log("Server started"));
```


3. Modify the highlighted code in the api server module to only use `Postgres` in production, and keep using the simple JSON db in our dev environment.

   *src/server/api.ts*
   ```ts{5-8}
   //...

   export const api = remultExpress({
        //...
        dataProvider: process.env["NODE_ENV"] === "production" ?
            createPostgresConnection({
                configuration: "heroku"
            }) : undefined,
        //...
   });
   ```

   The `{ configuration: "heroku" }` argument passed to Remult's `createPostgresConnection()` tells Remult to use the `DATABASE_URL` environment variable as the `connectionString` for Postgres. (See [Heroku documentation](https://devcenter.heroku.com/articles/connecting-heroku-postgres#connecting-in-node-js).)

   In development, the `dataProvider` function returns `undefined`, causing Remult to continue to use the default JSON-file database.

4. Add the highlighted lines to the server's TypeScript configuration file, to prepare it for production builds using TypeScript:

*tsconfig.server.json*
```json{6-12}
{
   "extends": "./tsconfig.json",
   "compilerOptions": {
      "module": "commonjs",
      "emitDecoratorMetadata": true,
      "noEmit": false,
      "outDir": "dist",
      "rootDir": "src"
   },
   "include": [
      "src/server/index.ts"
   ]
}
```

5. Modify the project's `build` npm script to additionally transpile the API server's TypeScript code to JavaScript (using `tsc`).

*package.json*
```json
"build": "ng build && tsc -p tsconfig.server.json"
```

6. Modify the project's `start` npm script to start the production Node.js server.

*package.json*
```json
"start": "node dist/server/"
```

The todo app is now ready for deployment to production.

## Deploy to Heroku

In order to deploy the todo app to [heroku](https://www.heroku.com/) you'll need a `heroku` account. You'll also need [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) and [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli#download-and-install) installed.

1. Create a Heroku `app`.

```sh
heroku create
```

2. Set the jwt authentication to something random - you can use an [online UUID generator](https://www.uuidgenerator.net/).

```sh
heroku config:set SESSION_SECRET=random-secret
```

3. Provision a dev postgres database on Heroku.

```sh
heroku addons:create heroku-postgresql:hobby-dev
```

4. Commit the changes to git and deploy to Heroku using `git push`.

```sh
git add .
git commit -m "todo app tutorial"
git push heroku master
```

5. Open the deployed app using `heroku apps:open` command.

```sh
heroku apps:open
```

::: warning Note
If you run into trouble deploying the app to Heroku, try using Heroku's [documentation](https://devcenter.heroku.com/articles/git).
:::

That's it - our application is deployed to production, play with it and enjoy.

Love Remult?&nbsp;<a href="https://github.com/remult/remult" target="_blank" rel="noopener"> Give our repo a star.⭐</a>