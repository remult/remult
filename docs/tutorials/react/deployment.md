# Deployment
In this tutorial, we'll deploy both the React app files and the API server project to the same host, and redirect all non-API requests to return the React app's `index.html` page.

In addition, to follow a few basic production best practices, we'll use [compression](https://www.npmjs.com/package/compression) middleware to improve performance and [helmet](https://www.npmjs.com/package/helmet) middleware to improve security.

* note that if your project name is different than `remult-react-todo`, you'll need to replace these values in the index.ts file
:::

1. Install `compression` and `helmet`.

   ```sh
   npm i compression helmet
   npm i @types/compression --save-dev
   ```

2. Add the highlighted code lines to `src/server/index.ts`, and modify the `app.listen` function's `port` argument to prefer a port number provided by the production host's `PORT` environment variable.

   *src/server/index.ts*
   ```ts{2-3,11-12,35-39}
   import express from 'express';
   import compression from 'compression';
   import helmet from 'helmet';
   import { expressjwt } from 'express-jwt';
   import { remultExpress } from 'remult/remult-express';
   import { Task } from '../shared/Task';
   import { TasksController } from '../shared/TasksController';
   import { AuthController, getJwtTokenSignKey } from '../shared/AuthController';
   
   let app = express();
   app.use(helmet({ contentSecurityPolicy: false }));
   app.use(compression());
   app.use(expressjwt({
       secret: getJwtSigningKey(),
       credentialsRequired: false,
       algorithms: ['HS256']
   }));
   app.use(remultExpress({
       entities: [Task],
       controllers: [TasksController, AuthController],
       initApi: async remult => {
           const taskRepo = remult.repo(Task);
           if (await taskRepo.count() == 0) {
               await taskRepo.insert([
                   { title: "Task a" },
                   { title: "Task b", completed: true },
                   { title: "Task c" },
                   { title: "task d" },
                   { title: "task e", completed: true }
               ]);
           }
       }
   }));
   
   app.use(express.static('build'));
   app.use('/*', async (req, res) => {
       res.sendFile(process.cwd() + '/build/index.html');
   });
   app.listen(process.env.PORT || 3002, () => console.log("Server started"));
   ```

3. Modify the project's `build` npm script to also transpile the API server's TypeScript code to JavaScript (using `tsc`).

   *package.json*
   ```json
   "build": "react-scripts build && tsc -p tsconfig.server.json"
   ```

4. Modify the project's `start` npm script to start the production Node.js server.

   *package.json*
   ```json
   "start": "node dist/server/server/"
   ```

The todo app is now ready for deployment to production.

#### Deploy to heroku

In order to deploy the todo app to [heroku](https://www.heroku.com/) you'll need a `heroku` account. You'll also need [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) and [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli#download-and-install) installed.

For this tutorial, we will use `postgres` as a production database.

1. Install postgres `pg` and `heroku-ssl-redirect` (to enforce https)
   ```sh
   npm i pg heroku-ssl-redirect
   npm i --save-dev @types/pg
   ```

2. Add the highlighted code lines to `src/server/index.ts`.

   *src/server/index.ts*
   ```ts{5-6,13,22-26}
   import express from 'express';
   import compression from 'compression';
   import helmet from 'helmet';
   import { expressjwt } from 'express-jwt';
   import sslRedirect from 'heroku-ssl-redirect'
   import { createPostgresConnection } from 'remult/postgres';
   import { remultExpress } from 'remult/remult-express';
   import { Task } from '../shared/Task';
   import { TasksController } from '../shared/TasksController';
   import { AuthController, getJwtTokenSignKey } from '../shared/AuthController';
   
   let app = express();
   app.use(sslRedirect());
   app.use(helmet({ contentSecurityPolicy: false }));
   app.use(compression());
   app.use(expressjwt({
       secret: getJwtSigningKey(),
       credentialsRequired: false,
       algorithms: ['HS256']
   }));
   app.use(remultExpress({
       dataProvider: async () => {
           if (process.env.NODE_ENV === "production")
               return createPostgresConnection({ configuration: "heroku" })
           return undefined;
       },
       entities: [Task],
       controllers: [TasksController, AuthController],
       initApi: async remult => {
           const taskRepo = remult.repo(Task);
           if (await taskRepo.count() == 0) {
               await taskRepo.insert([
                   { title: "Task a" },
                   { title: "Task b", completed: true },
                   { title: "Task c" },
                   { title: "task d" },
                   { title: "task e", completed: true }
               ]);
           }
       }
   }));
   
   app.use(express.static('build'));
   app.use('/*', async (req, res) => {
       res.sendFile(process.cwd() + '/build/index.html');
   });
   app.listen(process.env.PORT || 3002, () => console.log("Server started"));
   ```
2. Create a Heroku `app`:

   ```sh
   heroku create
   ```

3. Set the jwt authentication to something random - you can use an [Online UUID Generator](https://www.uuidgenerator.net/)
   ```sh
   heroku config:set TOKEN_SIGN_KEY=some-very-secret-key
   ```
3. Provision a dev postgres database on Heroku
   ```sh
   heroku addons:create heroku-postgresql:hobby-dev
   ```

4. Commit the changes to git and deploy to Heroku using `git push`:

   ```sh
   git add .
   git commit -m "todo app tutorial"
   git push heroku master
   ```

5. Run the production app using `heroku apps:open` command: 

   ```sh
   heroku apps:open
   ```
::: warning Note
If you run into trouble deploying the app to Heroku, try using Heroku's [documentation](https://devcenter.heroku.com/articles/git).
:::


That's it - our application is deployed to production, play with it and enjoy.

To see a larger more complex code base, visit our [CRM example project](https://www.github.com/remult/crm-demo)

Love Remult?&nbsp;<a href="https://github.com/remult/remult" target="_blank" rel="noopener"> Give our repo a star.⭐</a>
